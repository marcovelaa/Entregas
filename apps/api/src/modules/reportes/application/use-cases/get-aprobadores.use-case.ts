import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';

@Injectable()
export class GetAprobadoresUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    const rolesAdmin = await this.prisma.rol.findMany({
      where: { nombre: { in: ['Administrador', 'Super Usuario'] } }
    });
    const rolesIds = rolesAdmin.map(r => r.id);

    const admins = await this.prisma.usuario.findMany({
      where: { rol_id: { in: rolesIds }, activo: true },
      select: { id: true, nombres: true, apellidos: true }
    });

    return {
      success: true,
      data: admins.map(a => ({
        id: a.id.toString(),
        nombres: a.nombres,
        apellidos: a.apellidos
      }))
    };
  }
}
