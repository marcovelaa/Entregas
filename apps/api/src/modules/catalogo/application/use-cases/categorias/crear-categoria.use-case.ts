import { ICategoriaRepository } from '../../../domain/repositories/categoria.repository.interface';
import { CrearCategoriaDto } from '../../dtos/categoria.dto';
import { BadRequestException } from '@nestjs/common';

export class CrearCategoriaUseCase {
  constructor(private readonly categoriaRepo: ICategoriaRepository) {}

  async execute(dto: CrearCategoriaDto) {
    const existe = await this.categoriaRepo.buscarPorSlug(dto.slug);
    if (existe) {
      throw new BadRequestException('Ya existe una categoria con ese slug');
    }
    const createData: any = { ...dto };
    if (dto.categoria_padre_id !== undefined) {
      createData.categoria_padre_id = BigInt(dto.categoria_padre_id);
    }
    return this.categoriaRepo.crear(createData);
  }
}
