import { Injectable, Inject } from '@nestjs/common';
import type { IProductoRepository, ProductoEntity } from '../../../domain/repositories/producto.repository.interface';
import { PRODUCTO_REPOSITORY } from '../../../domain/repositories/producto.repository.interface';
import { ListarProductosDto } from '../../dtos/producto.dto';
import { PaginatedResult } from '../../../../../common/interfaces/paginated-result.interface';
import { computeSellable, EstadoVenta } from '@repo/combo-rules';
import { computeStockBom, stockDisponibleDeComponente } from '../../../domain/combo-stock';

type ProductoConVenta = ProductoEntity & { stock_vendible?: number; estado_venta?: EstadoVenta };

@Injectable()
export class ListarProductosUseCase {
  constructor(
    @Inject(PRODUCTO_REPOSITORY)
    private readonly productoRepo: IProductoRepository,
  ) {}

  async execute(dto?: ListarProductosDto, page = 1, limit = 20): Promise<PaginatedResult<ProductoConVenta>> {
    const visibilidad = dto?.visibilidad ?? 'admin';
    const { data, total } = await this.productoRepo.buscarTodos(
      {
        activo: dto?.activo,
        categoria_id: dto?.categoria_id ? BigInt(dto.categoria_id) : undefined,
        marca_id: dto?.marca_id ? BigInt(dto.marca_id) : undefined,
        tipo_producto: dto?.tipo_producto,
        search: dto?.search,
        visibilidad,
      },
      page,
      limit,
    );

    const ahora = new Date();
    const esPublica = visibilidad === 'publica';
    const dataEnriquecida: ProductoConVenta[] = [];

    for (const p of data) {
      if (p.tipo_producto !== 'COMBO') {
        dataEnriquecida.push(p);
        continue;
      }
      const stockBom = computeStockBom(
        (p.componentes_combo ?? []).map((c: any) => ({
          cantidad: c.cantidad,
          stockDisponible: stockDisponibleDeComponente(c),
        })),
      );
      const { sellable, estado } = computeSellable({
        tipoProducto: p.tipo_producto,
        stockBom,
        activo: p.activo,
        modoVenta: p.modo_venta ?? 'PERMANENTE',
        vigenciaInicio: p.vigencia_inicio,
        vigenciaFin: p.vigencia_fin,
        cupoMaximo: p.cupo_maximo,
        cupoUsado: p.cupo_usado ?? 0,
        now: ahora,
      });
      if (esPublica && estado !== 'ACTIVO') {
        continue;
      }
      dataEnriquecida.push({ ...p, stock_vendible: sellable, estado_venta: estado });
    }

    return {
      data: dataEnriquecida,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
