import { IMarcaRepository } from '../../../domain/repositories/marca.repository.interface';
import { CrearMarcaDto } from '../../dtos/crear-marca.dto';
import { BadRequestException } from '@nestjs/common';

export class CrearMarcaUseCase {
  constructor(private readonly marcaRepo: IMarcaRepository) {}

  async execute(dto: CrearMarcaDto) {
    const existe = await this.marcaRepo.buscarPorSlug(dto.slug);
    if (existe) {
      throw new BadRequestException('Ya existe una marca con ese slug');
    }

    return this.marcaRepo.crear(dto);
  }
}
