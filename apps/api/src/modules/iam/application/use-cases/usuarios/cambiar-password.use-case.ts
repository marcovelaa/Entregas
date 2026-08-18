import { IUsuarioRepository } from '../../../domain/repositories/usuario.repository.interface';
import { CambiarPasswordDto } from '../../dtos/cambiar-password.dto';
import { UsuarioNoEncontradoException, CredencialesInvalidasException } from '../../../domain/exceptions/iam.exceptions';
import * as bcrypt from 'bcrypt';

export class CambiarPasswordUseCase {
  constructor(private readonly usuarioRepository: IUsuarioRepository) {}

  async execute(id: bigint, dto: CambiarPasswordDto): Promise<void> {
    const usuario = await this.usuarioRepository.findById(id);
    if (!usuario) {
      throw new UsuarioNoEncontradoException(`El usuario con ID ${id} no existe.`);
    }

    const valid = await bcrypt.compare(dto.currentPassword, usuario.passwordHash);
    if (!valid) {
      throw new CredencialesInvalidasException('La contraseña actual es incorrecta.');
    }

    const salt = await bcrypt.genSalt();
    const newHash = await bcrypt.hash(dto.newPassword, salt);

    usuario.cambiarPassword(newHash);

    await this.usuarioRepository.update(usuario);
  }
}
