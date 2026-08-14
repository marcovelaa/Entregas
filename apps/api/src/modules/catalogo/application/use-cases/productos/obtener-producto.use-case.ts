import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type {
  IProductoRepository,
  ProductoEntity,
} from '../../../domain/repositories/producto.repository.interface';
import { PRODUCTO_REPOSITORY } from '../../../domain/repositories/producto.repository.interface';
import { computeSellable, EstadoVenta } from '@repo/combo-rules';
import {
  computeStockBom,
  stockDisponibleDeComponente,
} from '../../../domain/combo-stock';

type ProductoConVenta = ProductoEntity & {
  stock_vendible?: number;
  estado_venta?: EstadoVenta;
};

@Injectable()
export class ObtenerProductoUseCase {
  constructor(
    @Inject(PRODUCTO_REPOSITORY)
    private readonly productoRepo: IProductoRepository,
  ) {}

  async execute(idOrPublicId: string): Promise<ProductoConVenta> {
    let producto: ProductoEntity | null = null;
    if (/^\d+$/.test(idOrPublicId)) {
      producto = await this.productoRepo.buscarPorId(BigInt(idOrPublicId));
    }
    if (!producto) {
      producto = await this.productoRepo.buscarPorPublicId(idOrPublicId);
    }
    if (!producto) {
      throw new NotFoundException(
        `Producto con ID ${idOrPublicId} no encontrado`,
      );
    }
    if (producto.tipo_producto !== 'COMBO') {
      return producto;
    }
    const ahora = new Date();
    const stockBom = computeStockBom(
      (producto.componentes_combo ?? []).map((c: any) => ({
        cantidad: c.cantidad,
        stockDisponible: stockDisponibleDeComponente(c),
      })),
    );
    const { sellable, estado } = computeSellable({
      tipoProducto: producto.tipo_producto,
      stockBom,
      activo: producto.activo,
      modoVenta: producto.modo_venta ?? 'PERMANENTE',
      vigenciaInicio: producto.vigencia_inicio,
      vigenciaFin: producto.vigencia_fin,
      cupoMaximo: producto.cupo_maximo,
      cupoUsado: producto.cupo_usado ?? 0,
      now: ahora,
    });
    return { ...producto, stock_vendible: sellable, estado_venta: estado };
  }
}
