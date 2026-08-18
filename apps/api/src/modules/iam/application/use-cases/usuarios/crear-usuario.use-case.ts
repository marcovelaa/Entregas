import { IUsuarioRepository } from '../../../domain/repositories/usuario.repository.interface';
import { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
import { Usuario } from '../../../domain/entities/usuario.entity';
import { CrearUsuarioDto } from '../../dtos/crear-usuario.dto';
import {
  UsuarioDuplicadoException,
  RolNoEncontradoException,
  CodigoReferidoDuplicadoException,
} from '../../../domain/exceptions/iam.exceptions';
import * as bcrypt from 'bcrypt';

export class CrearUsuarioUseCase {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly rolRepository: IRolRepository,
  ) {}

  async execute(dto: CrearUsuarioDto): Promise<Usuario> {
    const rol = await this.rolRepository.findById(BigInt(dto.rolId));
    if (!rol) {
      throw new RolNoEncontradoException(
        `El rol con ID ${dto.rolId} no existe.`,
      );
    }

    const existeEmail = await this.usuarioRepository.findByEmail(dto.email);
    if (existeEmail) {
      throw new UsuarioDuplicadoException(
        `El email ${dto.email} ya está registrado.`,
      );
    }

    if (dto.codigoReferido) {
      const existeCodigo = await this.usuarioRepository.findByCodigoReferido(
        dto.codigoReferido,
      );
      if (existeCodigo) {
        throw new CodigoReferidoDuplicadoException(
          `El código de referido ${dto.codigoReferido} ya está en uso.`,
        );
      }
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const usuario = Usuario.crear(
      BigInt(dto.rolId),
      dto.nombres,
      dto.apellidos,
      dto.email,
      passwordHash,
      dto.telefono,
      dto.codigoReferido,
    );

    return await this.usuarioRepository.save(usuario);
  }
}
