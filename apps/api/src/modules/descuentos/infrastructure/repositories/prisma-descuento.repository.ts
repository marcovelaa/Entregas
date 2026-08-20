import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  DescuentoActualizarCompletoInput,
  DescuentoActualizarParcialInput,
  DescuentoCrearInput,
  DescuentoEntity,
  DescuentoPorCupon,
  DescuentoUsoDetalle,
  IDescuentoRepository,
  ReglaDescuentoVigente,
} from '../../domain/repositories/descuento.repository.interface';

const RELACIONES_INCLUDE = {
  productos: { include: { producto: true } },
  variantes: { include: { variante: true } },
  empaques: { include: { empaque: true } },
  categorias: { include: { categoria: true } },
} as const;

type DescuentoConRelaciones = Prisma.DescuentoGetPayload<{
  include: typeof RELACIONES_INCLUDE;
}>;

function toDescuentoEntity(d: DescuentoConRelaciones): DescuentoEntity {
  return {
    id: d.id.toString(),
    nombre: d.nombre,
    descripcion: d.descripcion,
    codigo_cupon: d.codigo_cupon,
    tipo: d.tipo,
    valor: Number(d.valor),
    max_monto_descuento:
      d.max_monto_descuento != null ? Number(d.max_monto_descuento) : null,
    alcance: d.alcance,
    canal: d.canal,
    cantidad_requerida: d.cantidad_requerida,
    cantidad_paga: d.cantidad_paga,
    monto_minimo_compra:
      d.monto_minimo_compra != null ? Number(d.monto_minimo_compra) : null,
    limite_usos: d.limite_usos,
    limite_usos_por_cliente: d.limite_usos_por_cliente,
    usos_actuales: d.usos_actuales,
    prioridad: d.prioridad,
    fecha_inicio: d.fecha_inicio,
    fecha_fin: d.fecha_fin,
    activo: d.activo,
    dias_semana: d.dias_semana,
    hora_inicio: d.hora_inicio,
    hora_fin: d.hora_fin,
    productos: d.productos.map((p) => ({
      id: p.producto.id.toString(),
      nombre: p.producto.nombre,
    })),
    variantes: d.variantes.map((v) => ({
      id: v.variante.id.toString(),
      nombre: v.variante.nombre,
    })),
    empaques: d.empaques.map((e) => ({
      id: e.empaque.id.toString(),
      nombre: e.empaque.nombre,
    })),
    categorias: d.categorias.map((c) => ({
      id: c.categoria.id.toString(),
      nombre: c.categoria.nombre,
    })),
  };
}

function isRecordNotFound(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025'
  );
}

@Injectable()
export class PrismaDescuentoRepository implements IDescuentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarReglasVigentes(params: {
    now: Date;
    codigoCupon?: string;
  }): Promise<ReglaDescuentoVigente[]> {
    const { now, codigoCupon } = params;

    const descuentos = await this.prisma.descuento.findMany({
      where: {
        activo: true,
        fecha_inicio: { lte: now },
        fecha_fin: { gte: now },
        codigo_cupon: codigoCupon ? codigoCupon.toUpperCase() : null,
        OR: [
          { dias_semana: { isEmpty: true } },
          { dias_semana: { has: now.getDay() } },
        ],
      },
      include: {
        productos: true,
        variantes: true,
        empaques: true,
        categorias: true,
      },
      orderBy: [{ prioridad: 'desc' }, { creado_en: 'desc' }],
    });

    return descuentos.map((d) => ({
      id: d.id.toString(),
      nombre: d.nombre,
      codigo_cupon: d.codigo_cupon,
      tipo: d.tipo,
      alcance: d.alcance,
      canal: d.canal,
      valor: Number(d.valor),
      max_monto_descuento:
        d.max_monto_descuento != null ? Number(d.max_monto_descuento) : null,
      cantidad_requerida: d.cantidad_requerida,
      cantidad_paga: d.cantidad_paga,
      monto_minimo_compra:
        d.monto_minimo_compra != null ? Number(d.monto_minimo_compra) : null,
      limite_usos: d.limite_usos,
      limite_usos_por_cliente: d.limite_usos_por_cliente,
      usos_actuales: d.usos_actuales,
      prioridad: d.prioridad,
      dias_semana: d.dias_semana,
      hora_inicio: d.hora_inicio,
      hora_fin: d.hora_fin,
      productos: d.productos.map((p) => ({
        producto_id: p.producto_id.toString(),
      })),
      variantes: d.variantes.map((v) => ({
        variante_id: v.variante_id.toString(),
      })),
      empaques: d.empaques.map((e) => ({
        empaque_id: e.empaque_id.toString(),
      })),
      categorias: d.categorias.map((c) => ({
        categoria_id: c.categoria_id.toString(),
      })),
    }));
  }

  async contarUsosPorCliente(
    descuentoId: string,
    clienteId: string,
  ): Promise<number> {
    return this.prisma.descuentoUso.count({
      where: {
        descuento_id: BigInt(descuentoId),
        cliente_id: BigInt(clienteId),
      },
    });
  }

  async buscarDescuentoPorCupon(
    codigoCupon: string,
  ): Promise<DescuentoPorCupon | null> {
    const descuento = await this.prisma.descuento.findUnique({
      where: { codigo_cupon: codigoCupon.toUpperCase() },
      select: {
        activo: true,
        fecha_inicio: true,
        fecha_fin: true,
        dias_semana: true,
      },
    });
    return descuento;
  }

  async buscarTodos(): Promise<DescuentoEntity[]> {
    const descuentos = await this.prisma.descuento.findMany({
      include: RELACIONES_INCLUDE,
      orderBy: [{ prioridad: 'desc' }, { creado_en: 'desc' }],
    });
    return descuentos.map(toDescuentoEntity);
  }

  async buscarPorId(id: string): Promise<DescuentoEntity | null> {
    const d = await this.prisma.descuento.findUnique({
      where: { id: BigInt(id) },
      include: RELACIONES_INCLUDE,
    });
    return d ? toDescuentoEntity(d) : null;
  }

  async crear(datos: DescuentoCrearInput): Promise<DescuentoEntity> {
    const { productoIds, varianteIds, empaqueIds, categoriaIds, ...resto } =
      datos;

    const nuevo = await this.prisma.descuento.create({
      data: {
        ...resto,
        tipo: resto.tipo as Prisma.DescuentoCreateInput['tipo'],
        alcance: resto.alcance as Prisma.DescuentoCreateInput['alcance'],
        canal: resto.canal as Prisma.DescuentoCreateInput['canal'],
        productos: productoIds?.length
          ? { create: productoIds.map((id) => ({ producto_id: BigInt(id) })) }
          : undefined,
        variantes: varianteIds?.length
          ? {
              create: varianteIds.map((id) => ({ variante_id: BigInt(id) })),
            }
          : undefined,
        empaques: empaqueIds?.length
          ? { create: empaqueIds.map((id) => ({ empaque_id: BigInt(id) })) }
          : undefined,
        categorias: categoriaIds?.length
          ? {
              create: categoriaIds.map((id) => ({ categoria_id: BigInt(id) })),
            }
          : undefined,
      },
      include: RELACIONES_INCLUDE,
    });

    return toDescuentoEntity(nuevo);
  }

  async actualizarParcial(
    id: string,
    datos: DescuentoActualizarParcialInput,
  ): Promise<DescuentoEntity | null> {
    try {
      const actualizado = await this.prisma.descuento.update({
        where: { id: BigInt(id) },
        data: datos,
        include: RELACIONES_INCLUDE,
      });
      return toDescuentoEntity(actualizado);
    } catch (e) {
      if (isRecordNotFound(e)) return null;
      throw e;
    }
  }

  async actualizarCompleto(
    id: string,
    datos: DescuentoActualizarCompletoInput,
    reemplazarRelaciones: boolean,
  ): Promise<boolean> {
    const descId = BigInt(id);
    const { productoIds, varianteIds, empaqueIds, categoriaIds, ...resto } =
      datos;

    try {
      await this.prisma.$transaction(async (tx) => {
        if (reemplazarRelaciones) {
          await tx.descuentoProducto.deleteMany({
            where: { descuento_id: descId },
          });
          await tx.descuentoVariante.deleteMany({
            where: { descuento_id: descId },
          });
          await tx.descuentoEmpaque.deleteMany({
            where: { descuento_id: descId },
          });
          await tx.descuentoCategoria.deleteMany({
            where: { descuento_id: descId },
          });
        }

        await tx.descuento.update({
          where: { id: descId },
          data: {
            ...resto,
            tipo: resto.tipo as Prisma.DescuentoUpdateInput['tipo'],
            alcance: resto.alcance as Prisma.DescuentoUpdateInput['alcance'],
            canal: resto.canal as Prisma.DescuentoUpdateInput['canal'],
            productos:
              reemplazarRelaciones && productoIds?.length
                ? {
                    create: productoIds.map((pId) => ({
                      producto_id: BigInt(pId),
                    })),
                  }
                : undefined,
            variantes:
              reemplazarRelaciones && varianteIds?.length
                ? {
                    create: varianteIds.map((vId) => ({
                      variante_id: BigInt(vId),
                    })),
                  }
                : undefined,
            empaques:
              reemplazarRelaciones && empaqueIds?.length
                ? {
                    create: empaqueIds.map((eId) => ({
                      empaque_id: BigInt(eId),
                    })),
                  }
                : undefined,
            categorias:
              reemplazarRelaciones && categoriaIds?.length
                ? {
                    create: categoriaIds.map((cId) => ({
                      categoria_id: BigInt(cId),
                    })),
                  }
                : undefined,
          },
        });
      });
      return true;
    } catch (e) {
      if (isRecordNotFound(e)) return false;
      throw e;
    }
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.descuento.delete({ where: { id: BigInt(id) } });
  }

  async buscarUsosConDetalle(
    descuentoId: string,
  ): Promise<DescuentoUsoDetalle[]> {
    const usos = await this.prisma.descuentoUso.findMany({
      where: { descuento_id: BigInt(descuentoId) },
      include: {
        venta: { include: { detalles: { include: { producto: true } } } },
        cliente: true,
      },
      orderBy: { creado_en: 'desc' },
    });

    return usos.map((u) => ({
      id: u.id.toString(),
      ventaId: u.venta_id.toString(),
      clienteNombre: u.cliente ? u.cliente.nombre : 'Cliente General',
      montoDescontado: Number(u.monto_descontado),
      montoVenta: Number(u.venta?.total || 0),
      fecha: u.creado_en,
      productos: (u.venta?.detalles ?? []).map((d) => ({
        id: d.producto_id.toString(),
        nombre: d.producto?.nombre || `Producto #${d.producto_id.toString()}`,
        cantidad: d.cantidad || 1,
        subtotal: Number(d.subtotal || 0),
      })),
    }));
  }
}
