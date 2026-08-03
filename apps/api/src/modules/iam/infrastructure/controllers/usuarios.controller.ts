import { Controller, Post, Get, Patch, Delete, Param, Body, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { CrearUsuarioUseCase } from '../../application/use-cases/usuarios/crear-usuario.use-case';
import { ListarUsuariosUseCase } from '../../application/use-cases/usuarios/listar-usuarios.use-case';
import { VerDetalleUsuarioUseCase } from '../../application/use-cases/usuarios/ver-detalle-usuario.use-case';
import { EditarUsuarioUseCase } from '../../application/use-cases/usuarios/editar-usuario.use-case';
import { EliminarUsuarioUseCase } from '../../application/use-cases/usuarios/eliminar-usuario.use-case';
import { CrearUsuarioDto } from '../../application/dtos/crear-usuario.dto';
import { UpdateUsuarioDto } from '../../application/dtos/update-usuario.dto';
import { UsuarioDuplicadoException, RolNoEncontradoException, UsuarioNoEncontradoException } from '../../domain/exceptions/iam.exceptions';

@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly crearUsuarioUseCase: CrearUsuarioUseCase,
    private readonly listarUsuariosUseCase: ListarUsuariosUseCase,
    private readonly verDetalleUsuarioUseCase: VerDetalleUsuarioUseCase,
    private readonly editarUsuarioUseCase: EditarUsuarioUseCase,
    private readonly eliminarUsuarioUseCase: EliminarUsuarioUseCase,
  ) {}

  @Get()
  async findAll() {
    const usuarios = await this.listarUsuariosUseCase.execute();
    return usuarios.map(u => ({
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
  async create(@Body() dto: CrearUsuarioDto) {
    try {
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
    } catch (error) {
      if (error instanceof UsuarioDuplicadoException || error instanceof RolNoEncontradoException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get(':id')
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
  async update(@Param('id') id: string, @Body() dto: UpdateUsuarioDto) {
    try {
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
    } catch (error) {
      if (error instanceof RolNoEncontradoException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.eliminarUsuarioUseCase.execute(BigInt(id));
  }
}
