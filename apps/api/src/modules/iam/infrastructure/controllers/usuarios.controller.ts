import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CrearUsuarioUseCase } from '../../application/use-cases/usuarios/crear-usuario.use-case';
import { ListarUsuariosUseCase } from '../../application/use-cases/usuarios/listar-usuarios.use-case';
import { VerDetalleUsuarioUseCase } from '../../application/use-cases/usuarios/ver-detalle-usuario.use-case';
import { EditarUsuarioUseCase } from '../../application/use-cases/usuarios/editar-usuario.use-case';
import { EliminarUsuarioUseCase } from '../../application/use-cases/usuarios/eliminar-usuario.use-case';
import { CrearUsuarioDto } from '../../application/dtos/crear-usuario.dto';
import { UpdateUsuarioDto } from '../../application/dtos/update-usuario.dto';
import { CambiarPasswordDto } from '../../application/dtos/cambiar-password.dto';
import { CambiarPasswordUseCase } from '../../application/use-cases/usuarios/cambiar-password.use-case';
import { RequierePermiso } from '../../auth/decorators/require-permiso.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';

@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly crearUsuarioUseCase: CrearUsuarioUseCase,
    private readonly listarUsuariosUseCase: ListarUsuariosUseCase,
    private readonly verDetalleUsuarioUseCase: VerDetalleUsuarioUseCase,
    private readonly editarUsuarioUseCase: EditarUsuarioUseCase,
    private readonly eliminarUsuarioUseCase: EliminarUsuarioUseCase,
    private readonly cambiarPasswordUseCase: CambiarPasswordUseCase,
  ) {}

  @Get()
  @RequierePermiso('iam:usuarios:ver')
  async findAll() {
    const usuarios = await this.listarUsuariosUseCase.execute();
    return usuarios.map((u) => ({
      id: u.id.toString(),
      publicId: u.publicId,
      rolId: u.rolId.toString(),
      nombres: u.nombres,
      apellidos: u.apellidos,
      email: u.email,
      telefono: u.telefono,
      codigoReferido: u.codigoReferido,
      activo: u.activo,
      ultimoAccesoEn: u.ultimoAccesoEn,
      creadoEn: u.creadoEn,
    }));
  }

  @Post()
  @RequierePermiso('iam:usuarios:cambiar_rol')
  async create(@Body() dto: CrearUsuarioDto) {
    const usuario = await this.crearUsuarioUseCase.execute(dto);
    return {
      id: usuario.id.toString(),
      publicId: usuario.publicId,
      rolId: usuario.rolId.toString(),
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      telefono: usuario.telefono,
      codigoReferido: usuario.codigoReferido,
      activo: usuario.activo,
      creadoEn: usuario.creadoEn,
    };
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeMyPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CambiarPasswordDto,
  ) {
    if (!user?.id) throw new Error('Usuario no autenticado');
    await this.cambiarPasswordUseCase.execute(BigInt(user.id), dto);
  }

  @Get(':id')
  @RequierePermiso('iam:usuarios:ver')
  async findOne(@Param('id') id: string) {
    const usuario = await this.verDetalleUsuarioUseCase.execute(BigInt(id));
    return {
      id: usuario.id.toString(),
      publicId: usuario.publicId,
      rolId: usuario.rolId.toString(),
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      telefono: usuario.telefono,
      codigoReferido: usuario.codigoReferido,
      activo: usuario.activo,
      ultimoAccesoEn: usuario.ultimoAccesoEn,
      creadoEn: usuario.creadoEn,
    };
  }

  @Patch(':id')
  @RequierePermiso('iam:usuarios:cambiar_rol')
  async update(@Param('id') id: string, @Body() dto: UpdateUsuarioDto) {
    const usuario = await this.editarUsuarioUseCase.execute(BigInt(id), dto);
    return {
      id: usuario.id.toString(),
      publicId: usuario.publicId,
      rolId: usuario.rolId.toString(),
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      telefono: usuario.telefono,
      codigoReferido: usuario.codigoReferido,
      activo: usuario.activo,
      ultimoAccesoEn: usuario.ultimoAccesoEn,
      creadoEn: usuario.creadoEn,
    };
  }

  @Delete(':id')
  @RequierePermiso('iam:usuarios:cambiar_estado')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.eliminarUsuarioUseCase.execute(BigInt(id));
  }
}
