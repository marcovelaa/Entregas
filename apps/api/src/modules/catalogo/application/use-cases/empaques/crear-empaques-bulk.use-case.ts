import { IEmpaqueRepository } from '../../../domain/repositories/empaque.repository.interface';
import { CrearEmpaquesBulkDto } from '../../dtos/empaque.dto';
import { EmpaqueEntity } from '../../../domain/entities/empaque.entity';

export class CrearEmpaquesBulkUseCase {
  constructor(private readonly empaqueRepo: IEmpaqueRepository) {}

  async execute(dto: CrearEmpaquesBulkDto) {
    const toInsert: Partial<EmpaqueEntity>[] = dto.empaques.map((e) => ({
      variante_id: BigInt(e.variante_id),
      nombre: e.nombre,
      sku: e.sku,
      codigo_barras: e.codigo_barras,
      multiplicador_unidades: e.multiplicador_unidades,
      precio: e.precio,
      precio_promocional: e.precio_promocional,
      activo: true,
    }));

    return this.empaqueRepo.crearMultiples(toInsert);
  }
}
