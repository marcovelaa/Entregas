import { IProductoRepository } from '../../../domain/repositories/producto.repository.interface';
import { CrearProductoDto } from '../../dtos/producto.dto';
import { BadRequestException } from '@nestjs/common';
import { parseUtcOrLocal } from '@repo/combo-rules';
import { computeStockBomDesdeInventario } from '../../../domain/combo-stock';

export class CrearProductoUseCase {
  constructor(private readonly productoRepo: IProductoRepository) {}

  async execute(dto: CrearProductoDto) {
    if (
      dto.precio_promocional !== undefined &&
      dto.precio_promocional !== null
    ) {
      if (dto.precio_promocional >= dto.precio_base) {
        throw new BadRequestException(
          'precio_promocional must be less than precio_base',
        );
      }
    }

    const skuGenerado =
      dto.sku ||
      `PRD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const createData: any = {
      ...dto,
      sku: skuGenerado,
    };
    createData.categoria_id = BigInt(dto.categoria_id);
    if (dto.marca_id !== undefined && dto.marca_id !== null) {
      createData.marca_id = BigInt(dto.marca_id);
    }

    if (dto.vigencia_inicio !== undefined) {
      createData.vigencia_inicio =
        dto.vigencia_inicio === null
          ? null
          : parseUtcOrLocal(dto.vigencia_inicio);
    }
    if (dto.vigencia_fin !== undefined) {
      createData.vigencia_fin =
        dto.vigencia_fin === null ? null : parseUtcOrLocal(dto.vigencia_fin);
    }

    if (dto.cupo_maximo !== undefined && dto.tipo_producto === 'COMBO') {
      const stockBom = await this.obtenerStockBom(dto.componentes_combo ?? []);
      if (dto.cupo_maximo > stockBom) {
        throw new BadRequestException(
          `cupo_maximo (${dto.cupo_maximo}) supera el stock disponible del combo (${stockBom} kits)`,
        );
      }
    }

    return this.productoRepo.crear(createData);
  }

  private async obtenerStockBom(
    componentes: CrearProductoDto['componentes_combo'],
  ): Promise<number> {
    if (!componentes || componentes.length === 0) return 0;
    const ids = Array.from(
      new Set(componentes.map((c) => BigInt(c.componente_prod_id))),
    );
    const filas = await this.productoRepo.buscarStocksComponentes(ids);
    return computeStockBomDesdeInventario(componentes, filas);
  }
}
