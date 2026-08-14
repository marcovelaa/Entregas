import { Module } from '@nestjs/common';
import { PermisosController } from './infrastructure/controllers/permisos.controller';
import { ObtenerPermisosRolUseCase } from './application/use-cases/roles/obtener-permisos-rol.use-case';
import { AsignarPermisosUseCase } from './application/use-cases/roles/asignar-permisos.use-case';
import { ListarPermisosUseCase } from './application/use-cases/permisos/listar-permisos.use-case';
import { PERMISO_REPOSITORY } from './domain/repositories/permiso.repository.interface';
import { PrismaPermisoRepository } from './infrastructure/repositories/prisma-permiso.repository';
import { RolesController } from './infrastructure/controllers/roles.controller';
import { UsuariosController } from './infrastructure/controllers/usuarios.controller';
import { CrearRolUseCase } from './application/use-cases/roles/crear-rol.use-case';
import { ListarRolesUseCase } from './application/use-cases/roles/listar-roles.use-case';
import { VerDetalleRolUseCase } from './application/use-cases/roles/ver-detalle-rol.use-case';
import { EditarRolUseCase } from './application/use-cases/roles/editar-rol.use-case';
import { EliminarRolUseCase } from './application/use-cases/roles/eliminar-rol.use-case';
import { CrearUsuarioUseCase } from './application/use-cases/usuarios/crear-usuario.use-case';
import { ListarUsuariosUseCase } from './application/use-cases/usuarios/listar-usuarios.use-case';
import { VerDetalleUsuarioUseCase } from './application/use-cases/usuarios/ver-detalle-usuario.use-case';
import { EditarUsuarioUseCase } from './application/use-cases/usuarios/editar-usuario.use-case';
import { EliminarUsuarioUseCase } from './application/use-cases/usuarios/eliminar-usuario.use-case';
import { ROL_REPOSITORY } from './domain/repositories/rol.repository.interface';
import { PrismaRolRepository } from './infrastructure/repositories/prisma-rol.repository';
import { USUARIO_REPOSITORY } from './domain/repositories/usuario.repository.interface';
import { PrismaUsuarioRepository } from './infrastructure/repositories/prisma-usuario.repository';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RolesController, UsuariosController, PermisosController],
  providers: [
    {
      provide: PERMISO_REPOSITORY,
      useClass: PrismaPermisoRepository,
    },
    {
      provide: ObtenerPermisosRolUseCase,
      useFactory: (rolRepo) => new ObtenerPermisosRolUseCase(rolRepo),
      inject: [ROL_REPOSITORY],
    },
    {
      provide: AsignarPermisosUseCase,
      useFactory: (rolRepo) => new AsignarPermisosUseCase(rolRepo),
      inject: [ROL_REPOSITORY],
    },
    {
      provide: ListarPermisosUseCase,
      useFactory: (repo) => new ListarPermisosUseCase(repo),
      inject: [PERMISO_REPOSITORY],
    },
    {
      provide: ROL_REPOSITORY,
      useClass: PrismaRolRepository,
    },
    {
      provide: USUARIO_REPOSITORY,
      useClass: PrismaUsuarioRepository,
    },
    // Patrón Factory para inyectar el Use Case puro sin ensuciarlo con @Injectable()
    {
      provide: CrearRolUseCase,
      useFactory: (rolRepo) => new CrearRolUseCase(rolRepo),
      inject: [ROL_REPOSITORY],
    },
    {
      provide: ListarRolesUseCase,
      useFactory: (rolRepo) => new ListarRolesUseCase(rolRepo),
      inject: [ROL_REPOSITORY],
    },
    {
      provide: VerDetalleRolUseCase,
      useFactory: (rolRepo) => new VerDetalleRolUseCase(rolRepo),
      inject: [ROL_REPOSITORY],
    },
    {
      provide: EditarRolUseCase,
      useFactory: (rolRepo) => new EditarRolUseCase(rolRepo),
      inject: [ROL_REPOSITORY],
    },
    {
      provide: EliminarRolUseCase,
      useFactory: (rolRepo) => new EliminarRolUseCase(rolRepo),
      inject: [ROL_REPOSITORY],
    },
    {
      provide: CrearUsuarioUseCase,
      useFactory: (userRepo, rolRepo) =>
        new CrearUsuarioUseCase(userRepo, rolRepo),
      inject: [USUARIO_REPOSITORY, ROL_REPOSITORY],
    },
    {
      provide: ListarUsuariosUseCase,
      useFactory: (userRepo) => new ListarUsuariosUseCase(userRepo),
      inject: [USUARIO_REPOSITORY],
    },
    {
      provide: VerDetalleUsuarioUseCase,
      useFactory: (userRepo) => new VerDetalleUsuarioUseCase(userRepo),
      inject: [USUARIO_REPOSITORY],
    },
    {
      provide: EditarUsuarioUseCase,
      useFactory: (userRepo, rolRepo) =>
        new EditarUsuarioUseCase(userRepo, rolRepo),
      inject: [USUARIO_REPOSITORY, ROL_REPOSITORY],
    },
    {
      provide: EliminarUsuarioUseCase,
      useFactory: (userRepo) => new EliminarUsuarioUseCase(userRepo),
      inject: [USUARIO_REPOSITORY],
    },
  ],
  exports: [USUARIO_REPOSITORY, ROL_REPOSITORY],
})
export class IamModule {}
