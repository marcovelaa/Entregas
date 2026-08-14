import { IUsuarioRepository } from '../../../domain/repositories/usuario.repository.interface';
import { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
import { Usuario } from '../../../domain/entities/usuario.entity';
import { UpdateUsuarioDto } from '../../dtos/update-usuario.dto';
import {
  UsuarioNoEncontradoException,
  RolNoEncontradoException,
} from '../../../domain/exceptions/iam.exceptions';
import * as bcrypt from 'bcrypt';

export class EditarUsuarioUseCase {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly rolRepository: IRolRepository,
  ) {}

  async execute(id: bigint, dto: UpdateUsuarioDto): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findById(id);
    if (!usuario) {
      throw new UsuarioNoEncontradoException(
        `El usuario con ID ${id} no existe.`,
      );
    }

    if (dto.rolId) {
      const rol = await this.rolRepository.findById(BigInt(dto.rolId));
      if (!rol) {
        throw new RolNoEncontradoException(
          `El rol con ID ${dto.rolId} no existe.`,
        );
      }
      usuario.cambiarRol(BigInt(dto.rolId));
    }

    usuario.actualizarPerfil(
      dto.nombres || usuario.nombres,
      dto.apellidos || usuario.apellidos,
      dto.telefono !== undefined ? dto.telefono : usuario.telefono,
    );

    if (dto.password) {
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(dto.password, salt);
      usuario.cambiarPassword(passwordHash);
    }

    if (dto.activo !== undefined) {
      dto.activo ? usuario.activar() : usuario.desactivar();
    }

    return await this.usuarioRepository.update(usuario);
  }
}
