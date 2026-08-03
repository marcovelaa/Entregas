import { IUsuarioRepository } from '../../../domain/repositories/usuario.repository.interface';
import { UsuarioNoEncontradoException } from '../../../domain/exceptions/iam.exceptions';

export class EliminarUsuarioUseCase {
  constructor(private readonly usuarioRepository: IUsuarioRepository) {}

  async execute(id: bigint): Promise<void> {
    const usuario = await this.usuarioRepository.findById(id);
    if (!usuario) {
      throw new UsuarioNoEncontradoException(`El usuario con ID ${id} no existe.`);
    }
    
    await this.usuarioRepository.delete(id);
  }
}
