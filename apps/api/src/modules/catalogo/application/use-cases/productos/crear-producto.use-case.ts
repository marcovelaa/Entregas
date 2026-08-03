import { IProductoRepository } from '../../../domain/repositories/producto.repository.interface';
import { CrearProductoDto } from '../../dtos/producto.dto';
import { BadRequestException } from '@nestjs/common';

export class CrearProductoUseCase {
  constructor(private readonly productoRepo: IProductoRepository) {}

  async execute(dto: CrearProductoDto) {
    if (dto.precio_promocional !== undefined && dto.precio_promocional !== null) {
      if (dto.precio_promocional >= dto.precio_base) {
        throw new BadRequestException('precio_promocional must be less than precio_base');
      }
    }

    const skuGenerado = dto.sku || `PRD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const createData: any = {
      ...dto,
      sku: skuGenerado,
    };
    createData.categoria_id = BigInt(dto.categoria_id);
    if (dto.marca_id !== undefined && dto.marca_id !== null) {
      createData.marca_id = BigInt(dto.marca_id);
    }
    return this.productoRepo.crear(createData);
  }
}
