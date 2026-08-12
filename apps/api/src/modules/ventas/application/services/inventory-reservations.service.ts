import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';

export const INVENTORY_RESERVATION_TTL_MS = 15 * 60 * 1000;

type TransactionClient = Prisma.TransactionClient;
type ReservationItem = {
  producto_id: string;
  variante_id?: string;
  cantidad: number;
};
type ReservationStockTarget = { inventarioId: bigint; cantidad: number };

type ReservationWithDetails = Prisma.ReservaInventarioGetPayload<{
  include: { detalles: true };
}>;

@Injectable()
export class InventoryReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reserves base inventory units for exactly fifteen minutes. Every reservation
   * attempt first releases expired reservations, so the application needs no
   * always-on worker to restore stock after a missed payment/webhook.
   */
  async create(usuarioId: string, items: ReservationItem[]) {
    if (!items.length)
      throw new ConflictException(
        'La reserva debe incluir al menos un producto.',
      );

    const now = new Date();
    const expiraEn = new Date(now.getTime() + INVENTORY_RESERVATION_TTL_MS);
    const grouped = this.groupItems(items);

    return this.prisma.$transaction(async (tx) => {
      await this.releaseExpiredInTransaction(tx, now);

      const inventories = await tx.inventario.findMany({
        where: {
          OR: grouped.map((item) => ({
            producto_id: item.productoId,
            variante_id: item.varianteId,
          })),
        },
      });
      const inventoryByKey = new Map(
        inventories.map((inventory) => [
          this.inventoryKey(inventory.producto_id, inventory.variante_id),
          inventory,
        ]),
      );

      const targets: ReservationStockTarget[] = [];
      for (const item of grouped) {
        const inventory = inventoryByKey.get(
          this.inventoryKey(item.productoId, item.varianteId),
        );
        if (!inventory) {
          throw new NotFoundException(
            `Inventario no encontrado para el producto ${item.productoId}.`,
          );
        }

        // A cached `reservado` value is unsafe here: another checkout may reserve
        // stock after the preflight read. PostgreSQL rechecks this row predicate
        // under the row lock, allowing exactly the reservations that still fit.
        const reserved = await tx.$executeRaw`
          UPDATE inventario
          SET reservado = reservado + ${item.cantidad}
          WHERE id = ${inventory.id}
            AND cantidad_disponible - reservado >= ${item.cantidad}
        `;
        if (reserved === 0) {
          throw new ConflictException(
            `Stock insuficiente para reservar el producto ${item.productoId}.`,
          );
        }
        targets.push({ inventarioId: inventory.id, cantidad: item.cantidad });
      }

      const reservation = await tx.reservaInventario.create({
        data: {
          usuario_id: BigInt(usuarioId),
          expira_en: expiraEn,
          detalles: {
            create: targets.map((target) => ({
              inventario_id: target.inventarioId,
              cantidad: target.cantidad,
            })),
          },
        },
        include: { detalles: true },
      });

      return this.serialize(reservation);
    });
  }

  async cancel(publicId: string, usuarioId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.releaseExpiredInTransaction(tx, new Date());
      const reservation = await tx.reservaInventario.findUnique({
        where: { public_id: publicId },
        include: { detalles: true },
      });
      if (!reservation)
        throw new NotFoundException('Reserva de inventario no encontrada.');
      if (reservation.usuario_id !== BigInt(usuarioId)) {
        throw new ForbiddenException(
          'No puede cancelar una reserva de inventario de otro usuario.',
        );
      }
      if (reservation.estado !== 'ACTIVA') {
        throw new ConflictException(
          `La reserva no puede liberarse porque está ${reservation.estado.toLowerCase()}.`,
        );
      }
      await this.releaseInTransaction(tx, reservation, 'LIBERADA');
      return { public_id: reservation.public_id, estado: 'LIBERADA' };
    });
  }

  /** Exposed for a deployment cron/webhook and also invoked lazily by reserve/cancel/checkout. */
  async expire() {
    return this.prisma.$transaction(async (tx) => ({
      liberadas: await this.releaseExpiredInTransaction(tx, new Date()),
    }));
  }

  /**
   * Converts a live reservation into a completed sale. The caller must decrement
   * both available and reserved quantities in the same transaction afterwards.
   */
  async consumeForSale(
    tx: TransactionClient,
    publicId: string,
    ventaId: bigint,
    usuarioId: string,
    targets: ReservationStockTarget[],
  ): Promise<void> {
    const now = new Date();
    await this.releaseExpiredInTransaction(tx, now);

    const reservation = await tx.reservaInventario.findUnique({
      where: { public_id: publicId },
      include: { detalles: true },
    });
    if (!reservation)
      throw new NotFoundException('Reserva de inventario no encontrada.');
    if (reservation.usuario_id !== BigInt(usuarioId)) {
      throw new ForbiddenException(
        'No puede consumir una reserva de inventario de otro usuario.',
      );
    }
    if (reservation.estado !== 'ACTIVA' || reservation.expira_en <= now) {
      throw new ConflictException(
        'La reserva de inventario ya expiró o fue utilizada.',
      );
    }
    if (!this.sameTargets(reservation.detalles, targets)) {
      throw new ConflictException(
        'La venta no coincide con los productos reservados.',
      );
    }

    const consumed = await tx.reservaInventario.updateMany({
      where: {
        id: reservation.id,
        usuario_id: BigInt(usuarioId),
        estado: 'ACTIVA',
        expira_en: { gt: now },
      },
      data: { estado: 'CONSUMIDA', venta_id: ventaId },
    });
    if (consumed.count === 0)
      throw new ConflictException(
        'La reserva de inventario ya expiró o fue utilizada.',
      );
  }

  /** Releases expired reservations before any stock-affecting transaction evaluates availability. */
  async releaseExpiredInTransaction(
    tx: TransactionClient,
    now = new Date(),
  ): Promise<number> {
    const expired = await tx.reservaInventario.findMany({
      where: { estado: 'ACTIVA', expira_en: { lte: now } },
      include: { detalles: true },
    });

    let released = 0;
    for (const reservation of expired) {
      if (await this.releaseInTransaction(tx, reservation, 'EXPIRADA'))
        released += 1;
    }
    return released;
  }

  private async releaseInTransaction(
    tx: TransactionClient,
    reservation: ReservationWithDetails,
    state: 'LIBERADA' | 'EXPIRADA',
  ): Promise<boolean> {
    const transitioned = await tx.reservaInventario.updateMany({
      where: { id: reservation.id, estado: 'ACTIVA' },
      data: { estado: state },
    });
    if (transitioned.count === 0) return false;

    for (const detail of reservation.detalles) {
      const released = await tx.inventario.updateMany({
        where: {
          id: detail.inventario_id,
          reservado: { gte: detail.cantidad },
        },
        data: { reservado: { decrement: detail.cantidad } },
      });
      if (released.count === 0) {
        throw new ConflictException(
          'La reserva de inventario está inconsistente y no puede liberarse de forma segura.',
        );
      }
    }
    return true;
  }

  private groupItems(items: ReservationItem[]) {
    const grouped = new Map<
      string,
      { productoId: bigint; varianteId: bigint | null; cantidad: number }
    >();
    for (const item of items) {
      const productoId = BigInt(item.producto_id);
      const varianteId = item.variante_id ? BigInt(item.variante_id) : null;
      const key = this.inventoryKey(productoId, varianteId);
      const previous = grouped.get(key);
      grouped.set(key, {
        productoId,
        varianteId,
        cantidad: (previous?.cantidad ?? 0) + item.cantidad,
      });
    }
    return [...grouped.values()];
  }

  private sameTargets(
    details: { inventario_id: bigint; cantidad: number }[],
    targets: ReservationStockTarget[],
  ) {
    const expected = new Map(
      details.map((detail) => [
        detail.inventario_id.toString(),
        detail.cantidad,
      ]),
    );
    const actual = new Map<string, number>();
    for (const target of targets) {
      const key = target.inventarioId.toString();
      actual.set(key, (actual.get(key) ?? 0) + target.cantidad);
    }
    return (
      expected.size === actual.size &&
      [...expected].every(([id, quantity]) => actual.get(id) === quantity)
    );
  }

  private serialize(reservation: ReservationWithDetails) {
    return {
      public_id: reservation.public_id,
      estado: reservation.estado,
      expira_en: reservation.expira_en,
      detalles: reservation.detalles.map((detail) => ({
        inventario_id: detail.inventario_id.toString(),
        cantidad: detail.cantidad,
      })),
    };
  }

  private inventoryKey(productoId: bigint, varianteId: bigint | null) {
    return `${productoId}_${varianteId ?? 'null'}`;
  }
}
