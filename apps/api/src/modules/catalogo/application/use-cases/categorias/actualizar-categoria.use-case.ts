import { ICategoriaRepository } from '../../../domain/repositories/categoria.repository.interface';
import { ActualizarCategoriaDto } from '../../dtos/categoria.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

export class ActualizarCategoriaUseCase {
  constructor(private readonly categoriaRepo: ICategoriaRepository) {}

  async execute(id: bigint, dto: ActualizarCategoriaDto) {
    const cat = await this.categoriaRepo.buscarPorId(id);
    if (!cat) throw new NotFoundException('Categoria no encontrada');

    if (dto.categoria_padre_id !== undefined) {
      if (BigInt(dto.categoria_padre_id) === id) {
        throw new BadRequestException(
          'Circular reference: categoria_padre_id cannot be the same as id',
        );
      }
    }

    const updateData: any = { ...dto };
    if (dto.categoria_padre_id !== undefined) {
      updateData.categoria_padre_id = BigInt(dto.categoria_padre_id);
    }
    return this.categoriaRepo.actualizar(id, updateData);
  }
}
