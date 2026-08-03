import { Injectable, Inject } from '@nestjs/common';
import type { IProductoRepository } from '../../../domain/repositories/producto.repository.interface';
import { PRODUCTO_REPOSITORY } from '../../../domain/repositories/producto.repository.interface';
import { ProductoEntity } from '../../../domain/repositories/producto.repository.interface';
import { ListarProductosDto } from '../../dtos/producto.dto';
import { PaginatedResult } from '../../../../../common/interfaces/paginated-result.interface';

@Injectable()
export class ListarProductosUseCase {
  constructor(
    @Inject(PRODUCTO_REPOSITORY)
    private readonly productoRepo: IProductoRepository,
  ) {}

  async execute(dto?: ListarProductosDto, page = 1, limit = 20): Promise<PaginatedResult<ProductoEntity>> {
    const { data, total } = await this.productoRepo.buscarTodos(
      {
        activo: dto?.activo,
        categoria_id: dto?.categoria_id ? BigInt(dto.categoria_id) : undefined,
        marca_id: dto?.marca_id ? BigInt(dto.marca_id) : undefined,
        tipo_producto: dto?.tipo_producto,
        search: dto?.search,
      },
      page,
      limit,
    );
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
