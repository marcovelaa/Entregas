import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type {
  IProductoRepository,
  ProductoEntity,
} from '../../../domain/repositories/producto.repository.interface';
import { PRODUCTO_REPOSITORY } from '../../../domain/repositories/producto.repository.interface';
import { ActualizarProductoDto } from '../../dtos/producto.dto';
import { parseUtcOrLocal } from '@repo/combo-rules';
import {
  computeStockBom,
  computeStockBomDesdeInventario,
  stockDisponibleDeComponente,
} from '../../../domain/combo-stock';

@Injectable()
export class ActualizarProductoUseCase {
  constructor(
    @Inject(PRODUCTO_REPOSITORY)
    private readonly productoRepo: IProductoRepository,
  ) {}

  async execute(id: bigint, dto: ActualizarProductoDto) {
    const producto = await this.productoRepo.buscarPorId(id);
    if (!producto) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    const precioBase = dto.precio_base ?? Number(producto.precio_base);
    const precioPromo = dto.precio_promocional;
    if (
      precioPromo !== undefined &&
      precioPromo !== null &&
      precioPromo >= precioBase
    ) {
      throw new BadRequestException(
        'precio_promocional debe ser menor que precio_base',
      );
    }

    const updateData: any = { ...dto };
    if (dto.categoria_id !== undefined)
      updateData.categoria_id = BigInt(dto.categoria_id);
    if (dto.marca_id !== undefined)
      updateData.marca_id = dto.marca_id ? BigInt(dto.marca_id) : null;

    if (dto.vigencia_inicio !== undefined) {
      updateData.vigencia_inicio =
        dto.vigencia_inicio === null
          ? null
          : parseUtcOrLocal(dto.vigencia_inicio);
    }
    if (dto.vigencia_fin !== undefined) {
      updateData.vigencia_fin =
        dto.vigencia_fin === null ? null : parseUtcOrLocal(dto.vigencia_fin);
    }

    const tipoProducto = dto.tipo_producto ?? producto.tipo_producto;
    if (dto.cupo_maximo !== undefined && tipoProducto === 'COMBO') {
      const stockBom = await this.obtenerStockBom(dto, producto);
      if (dto.cupo_maximo > stockBom) {
        throw new BadRequestException(
          `cupo_maximo (${dto.cupo_maximo}) supera el stock disponible del combo (${stockBom} kits)`,
        );
      }
    }

    return this.productoRepo.actualizar(id, updateData);
  }

  private async obtenerStockBom(
    dto: ActualizarProductoDto,
    producto: ProductoEntity,
  ): Promise<number> {
    if (dto.componentes_combo !== undefined) {
      if (dto.componentes_combo.length === 0) return 0;
      const ids = Array.from(
        new Set(dto.componentes_combo.map((c) => BigInt(c.componente_prod_id))),
      );
      const filas = await this.productoRepo.buscarStocksComponentes(ids);
      return computeStockBomDesdeInventario(dto.componentes_combo, filas);
    }
    return computeStockBom(
      (producto.componentes_combo ?? []).map((c: any) => ({
        cantidad: c.cantidad,
        stockDisponible: stockDisponibleDeComponente(c),
      })),
    );
  }
}
