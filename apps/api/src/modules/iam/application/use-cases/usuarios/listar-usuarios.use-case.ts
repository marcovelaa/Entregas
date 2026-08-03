import { IUsuarioRepository } from '../../../domain/repositories/usuario.repository.interface';
import { Usuario } from '../../../domain/entities/usuario.entity';

export class ListarUsuariosUseCase {
  constructor(private readonly usuarioRepository: IUsuarioRepository) {}

  async execute(): Promise<Usuario[]> {
    return await this.usuarioRepository.findAll();
  }
}
