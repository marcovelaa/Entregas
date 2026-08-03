import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { IClienteRepository, ClienteCreateData, ClienteUpdateData } from '../../domain/repositories/cliente.repository.interface';

@Injectable()
export class PrismaClienteRepository implements IClienteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(data: ClienteCreateData) {
    const cliente = await this.prisma.cliente.create({ data });
    return this.serialize(cliente);
  }

  async actualizar(id: string, data: ClienteUpdateData) {
    const cliente = await this.prisma.cliente.update({
      where: { id: BigInt(id) },
      data
    });
    return this.serialize(cliente);
  }

  async listar(params: { offset: number; limit: number; buscar?: string }) {
    const where = params.buscar ? {
      OR: [
        { nombres: { contains: params.buscar, mode: 'insensitive' as any } },
        { documento_id: { contains: params.buscar } }
      ]
    } : {};

    const [total, data] = await Promise.all([
      this.prisma.cliente.count({ where }),
      this.prisma.cliente.findMany({
        where,
        skip: params.offset,
        take: params.limit,
        orderBy: { creado_en: 'desc' }
      })
    ]);

    return { total, data: data.map(this.serialize) };
  }

  async obtenerPorId(id: string) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: BigInt(id) } });
    return cliente ? this.serialize(cliente) : null;
  }

  private serialize(cliente: any) {
    return {
      ...cliente,
      id: cliente.id.toString(),
    };
  }
}
