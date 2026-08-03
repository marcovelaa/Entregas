import { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
import { Rol } from '../../../domain/entities/rol.entity';
import { RolDuplicadoException } from '../../../domain/exceptions/iam.exceptions';
import { CrearRolDto } from '../../dtos/crear-rol.dto';

export class CrearRolUseCase {
  // Recibe la interfaz pura, no sabe si es Prisma, TypeORM o memoria
  constructor(private readonly rolRepository: IRolRepository) {}

  async execute(dto: CrearRolDto): Promise<Rol> {
    // 1. Regla de negocio: El nombre del rol no debe existir
    const existeRol = await this.rolRepository.findByNombre(dto.nombre);
    
    if (existeRol) {
      throw new RolDuplicadoException(`El rol con el nombre '${dto.nombre}' ya existe.`);
    }

    // 2. Instanciamos la entidad de dominio
    const nuevoRol = Rol.crear(dto.nombre, dto.descripcion);

    // 3. Persistimos a través de la interfaz (puerto)
    const rolGuardado = await this.rolRepository.save(nuevoRol);

    return rolGuardado;
  }
}
