import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IProductoRepository } from '../../../domain/repositories/producto.repository.interface';
import { PRODUCTO_REPOSITORY } from '../../../domain/repositories/producto.repository.interface';
import { ActualizarProductoDto } from '../../dtos/producto.dto';

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
    if (precioPromo !== undefined && precioPromo !== null && precioPromo >= precioBase) {
      throw new BadRequestException('precio_promocional debe ser menor que precio_base');
    }

    const updateData: any = { ...dto };
    if (dto.categoria_id !== undefined) updateData.categoria_id = BigInt(dto.categoria_id);
    if (dto.marca_id !== undefined) updateData.marca_id = dto.marca_id ? BigInt(dto.marca_id) : null;

    return this.productoRepo.actualizar(id, updateData);
  }
}
