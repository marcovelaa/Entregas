import { IUsuarioRepository } from '../../../domain/repositories/usuario.repository.interface';
import { Usuario } from '../../../domain/entities/usuario.entity';
import { UsuarioNoEncontradoException } from '../../../domain/exceptions/iam.exceptions';

export class VerDetalleUsuarioUseCase {
  constructor(private readonly usuarioRepository: IUsuarioRepository) {}

  async execute(id: bigint): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findById(id);
    if (!usuario) {
      throw new UsuarioNoEncontradoException(
        `El usuario con ID ${id} no existe.`,
      );
    }
    return usuario;
  }
}
