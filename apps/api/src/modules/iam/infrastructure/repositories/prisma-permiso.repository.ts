import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { IPermisoRepository } from '../../domain/repositories/permiso.repository.interface';
@Injectable()
export class PrismaPermisoRepository implements IPermisoRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findAll() { return this.prisma.permiso.findMany({ orderBy: { codigo: 'asc' } }); }
}
