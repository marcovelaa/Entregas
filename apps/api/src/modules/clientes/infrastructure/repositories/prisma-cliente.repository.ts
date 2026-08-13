import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { IClienteRepository, ClienteCreateData, ClienteUpdateData, ClienteConCredenciales, ClienteCredencialesCreateData } from '../../domain/repositories/cliente.repository.interface';

@Injectable()
export class PrismaClienteRepository implements IClienteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(data: ClienteCreateData) {
    const nombreCompleto = [data.nombres, data.apellidos].filter(Boolean).join(' ').trim() || data.nombre || 'Cliente Genérico';
    const cliente = await this.prisma.cliente.create({
      data: {
        nombre: nombreCompleto,
        documento_id: data.documento_id || null,
        email: data.email || null,
        telefono: data.telefono || null,
        direccion: data.direccion || null,
        activo: data.activo !== undefined ? data.activo : true,
      },
    });
    return this.serialize(cliente);
  }

  async actualizar(id: string, data: ClienteUpdateData) {
    const updateData: any = {};
    if (data.nombres !== undefined || data.apellidos !== undefined || data.nombre !== undefined) {
      const nombreCompleto = [data.nombres, data.apellidos].filter(Boolean).join(' ').trim() || data.nombre;
      if (nombreCompleto) {
        updateData.nombre = nombreCompleto;
      }
    }
    if (data.documento_id !== undefined) updateData.documento_id = data.documento_id || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.telefono !== undefined) updateData.telefono = data.telefono || null;
    if (data.direccion !== undefined) updateData.direccion = data.direccion || null;
    if (data.activo !== undefined) updateData.activo = data.activo;

    const cliente = await this.prisma.cliente.update({
      where: { id: BigInt(id) },
      data: updateData,
    });
    return this.serialize(cliente);
  }

  async listar(params: { offset: number; limit: number; buscar?: string }) {
    const where = params.buscar ? {
      OR: [
        { nombre: { contains: params.buscar, mode: 'insensitive' as any } },
        { documento_id: { contains: params.buscar, mode: 'insensitive' as any } },
        { telefono: { contains: params.buscar } },
      ],
    } : {};

    const [total, data] = await Promise.all([
      this.prisma.cliente.count({ where }),
      this.prisma.cliente.findMany({
        where,
        skip: params.offset,
        take: params.limit,
        orderBy: { creado_en: 'desc' },
      }),
    ]);

    return { total, data: data.map((c: Prisma.ClienteGetPayload<Record<string, never>>) => this.serialize(c)) };
  }

  async obtenerPorId(id: string) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: BigInt(id) } });
    return cliente ? this.serialize(cliente) : null;
  }

  private serialize(cliente: any) {
    const nombreStr = cliente.nombre || '';
    const parts = nombreStr.split(' ');
    const nombres = parts[0] || nombreStr;
    const apellidos = parts.slice(1).join(' ');
    const { password_hash, ...clienteSinPassword } = cliente;

    return {
      ...clienteSinPassword,
      id: cliente.id.toString(),
      nombre: nombreStr,
      nombres: nombres,
      apellidos: apellidos,
    };
  }

  async crearConCredenciales(data: ClienteCredencialesCreateData): Promise<ClienteConCredenciales> {
    const cliente = await this.prisma.cliente.create({
      data: {
        nombre: `${data.nombres} ${data.apellidos}`.trim(),
        email: data.email,
        telefono: data.telefono || null,
        password_hash: data.passwordHash,
        activo: true,
      },
    });
    return this.serializeConCredenciales(cliente, data.nombres, data.apellidos);
  }

  async buscarPorEmailConCredenciales(email: string): Promise<ClienteConCredenciales | null> {
    const cliente = await this.prisma.cliente.findFirst({ where: { email } });
    if (!cliente || !cliente.password_hash) return null;
    return this.serializeConCredenciales(cliente);
  }

  async obtenerConCredencialesPorId(id: string): Promise<ClienteConCredenciales | null> {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: BigInt(id) } });
    if (!cliente || !cliente.password_hash) return null;
    return this.serializeConCredenciales(cliente);
  }

  async actualizarPassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.cliente.update({
      where: { id: BigInt(id) },
      data: { password_hash: passwordHash },
    });
  }

  private serializeConCredenciales(cliente: any, nombresHint?: string, apellidosHint?: string): ClienteConCredenciales {
    const nombreStr = cliente.nombre || '';
    const parts = nombreStr.split(' ');
    return {
      id: cliente.id.toString(),
      nombres: nombresHint ?? parts[0] ?? nombreStr,
      apellidos: apellidosHint ?? parts.slice(1).join(' '),
      email: cliente.email ?? '',
      telefono: cliente.telefono,
      passwordHash: cliente.password_hash,
      activo: cliente.activo,
    };
  }
}
