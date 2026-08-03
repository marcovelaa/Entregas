import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IMarcaRepository } from '../../../domain/repositories/marca.repository.interface';
import { MARCA_REPOSITORY } from '../../../domain/repositories/marca.repository.interface';
import { ActualizarMarcaDto } from '../../dtos/crear-marca.dto';

@Injectable()
export class ActualizarMarcaUseCase {
  constructor(
    @Inject(MARCA_REPOSITORY)
    private readonly marcaRepo: IMarcaRepository,
  ) {}

  async execute(id: bigint, dto: ActualizarMarcaDto) {
    const marca = await this.marcaRepo.buscarPorId(id);
    if (!marca) {
      throw new NotFoundException(`Marca con id ${id} no encontrada`);
    }

    if (dto.slug && dto.slug !== marca.slug) {
      const existente = await this.marcaRepo.buscarPorSlug(dto.slug);
      if (existente) {
        throw new BadRequestException(`Ya existe una marca con el slug '${dto.slug}'`);
      }
    }

    return this.marcaRepo.actualizar(id, dto);
  }
}
