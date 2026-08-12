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
import { CrearRolUseCase } from '../../application/use-cases/roles/crear-rol.use-case';
import { ListarRolesUseCase } from '../../application/use-cases/roles/listar-roles.use-case';
import { VerDetalleRolUseCase } from '../../application/use-cases/roles/ver-detalle-rol.use-case';
import { EditarRolUseCase } from '../../application/use-cases/roles/editar-rol.use-case';
import { EliminarRolUseCase } from '../../application/use-cases/roles/eliminar-rol.use-case';
import { ObtenerPermisosRolUseCase } from '../../application/use-cases/roles/obtener-permisos-rol.use-case';
import { AsignarPermisosUseCase } from '../../application/use-cases/roles/asignar-permisos.use-case';
import { CrearRolDto } from '../../application/dtos/crear-rol.dto';
import { UpdateRolDto } from '../../application/dtos/update-rol.dto';
import { RequierePermiso } from '../../auth/decorators/require-permiso.decorator';

@Controller('roles')
export class RolesController {
  constructor(
    private readonly crearRolUseCase: CrearRolUseCase,
    private readonly listarRolesUseCase: ListarRolesUseCase,
    private readonly verDetalleRolUseCase: VerDetalleRolUseCase,
    private readonly editarRolUseCase: EditarRolUseCase,
    private readonly eliminarRolUseCase: EliminarRolUseCase,
    private readonly obtenerPermisosRolUseCase: ObtenerPermisosRolUseCase,
    private readonly asignarPermisosUseCase: AsignarPermisosUseCase,
  ) {}

  @Get()
  @RequierePermiso('iam:roles:ver')
  async findAll() {
    const roles = await this.listarRolesUseCase.execute();

    return roles.map((rol) => ({
      id: rol.id.toString(),
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      activo: rol.activo,
      creadoEn: rol.creadoEn,
    }));
  }

  @Post()
  @RequierePermiso('iam:roles:crear')
  async create(@Body() dto: CrearRolDto) {
    const nuevoRol = await this.crearRolUseCase.execute(dto);

    // Mapeamos a JSON para evitar problemas serializando el BigInt y mantener limpia la respuesta
    return {
      id: nuevoRol.id.toString(),
      nombre: nuevoRol.nombre,
      descripcion: nuevoRol.descripcion,
      activo: nuevoRol.activo,
      creadoEn: nuevoRol.creadoEn,
    };
  }

  @Get(':id')
  @RequierePermiso('iam:roles:ver')
  async findOne(@Param('id') id: string) {
    const rol = await this.verDetalleRolUseCase.execute(BigInt(id));
    return {
      id: rol.id.toString(),
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      activo: rol.activo,
      creadoEn: rol.creadoEn,
    };
  }

  @Patch(':id')
  @RequierePermiso('iam:roles:editar')
  async update(@Param('id') id: string, @Body() dto: UpdateRolDto) {
    const rol = await this.editarRolUseCase.execute(BigInt(id), dto);
    return {
      id: rol.id.toString(),
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      activo: rol.activo,
      creadoEn: rol.creadoEn,
    };
  }

  @Delete(':id')
  @RequierePermiso('iam:roles:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.eliminarRolUseCase.execute(BigInt(id));
  }

  @Get(':id/permisos')
  @RequierePermiso('iam:roles:ver')
  async getPermisos(@Param('id') id: string) {
    return this.obtenerPermisosRolUseCase.execute(BigInt(id));
  }

  @Patch(':id/permisos')
  @RequierePermiso('iam:roles:asignar_permisos')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePermisos(
    @Param('id') id: string,
    @Body() dto: { permisos: string[] },
  ) {
    await this.asignarPermisosUseCase.execute(BigInt(id), dto.permisos);
  }
}
