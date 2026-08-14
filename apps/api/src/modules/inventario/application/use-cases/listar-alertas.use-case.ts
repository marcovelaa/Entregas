import { PrismaService } from '../../../../common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ListarAlertasUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    const rawAlertas = await this.prisma.$queryRaw`
      SELECT i.id, i.cantidad_disponible, i.stock_minimo, p.nombre, p.sku
      FROM inventario i
      JOIN productos p ON p.id = i.producto_id
      WHERE i.cantidad_disponible <= COALESCE(i.stock_minimo, 5)
    `;

    return (rawAlertas as any[]).map((a) => ({
      ...a,
      id: a.id.toString(),
    }));
  }
}
