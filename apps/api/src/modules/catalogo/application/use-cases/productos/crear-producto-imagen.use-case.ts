import { IProductoImagenRepository } from '../../../domain/repositories/producto-imagen.repository.interface';
import { CrearProductoImagenDto } from '../../dtos/producto-imagen.dto';

export class CrearProductoImagenUseCase {
  constructor(private readonly repo: IProductoImagenRepository) {}

  async execute(dto: CrearProductoImagenDto) {
    const createData: any = { ...dto };
    createData.producto_id = BigInt(dto.producto_id);
    return this.repo.crear(createData);
  }
}
