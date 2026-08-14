import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  IDireccionRepository,
  DireccionData,
  DireccionCreateData,
  DireccionUpdateData,
} from '../../domain/repositories/direccion.repository.interface';

@Injectable()
export class PrismaDireccionRepository implements IDireccionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorCliente(clienteId: string): Promise<DireccionData[]> {
    const filas = await this.prisma.direccion.findMany({
      where: { cliente_id: BigInt(clienteId) },
      orderBy: [{ es_principal: 'desc' }, { creado_en: 'desc' }],
    });
    return filas.map((f) => this.serialize(f));
  }

  async crear(
    clienteId: string,
    data: DireccionCreateData,
  ): Promise<DireccionData> {
    const fila = await this.prisma.direccion.create({
      data: { ...data, cliente_id: BigInt(clienteId) },
    });
    return this.serialize(fila);
  }

  async actualizar(
    clienteId: string,
    direccionId: string,
    data: DireccionUpdateData,
  ): Promise<DireccionData | null> {
    const { count } = await this.prisma.direccion.updateMany({
      where: { id: BigInt(direccionId), cliente_id: BigInt(clienteId) },
      data,
    });
    if (count === 0) return null;
    const fila = await this.prisma.direccion.findUnique({
      where: { id: BigInt(direccionId) },
    });
    return fila ? this.serialize(fila) : null;
  }

  async eliminar(clienteId: string, direccionId: string): Promise<boolean> {
    const { count } = await this.prisma.direccion.deleteMany({
      where: { id: BigInt(direccionId), cliente_id: BigInt(clienteId) },
    });
    return count > 0;
  }

  async marcarPrincipal(
    clienteId: string,
    direccionId: string,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.direccion.updateMany({
        where: { id: BigInt(direccionId), cliente_id: BigInt(clienteId) },
        data: { es_principal: true },
      });
      if (count === 0) return false;
      await tx.direccion.updateMany({
        where: {
          cliente_id: BigInt(clienteId),
          id: { not: BigInt(direccionId) },
        },
        data: { es_principal: false },
      });
      return true;
    });
  }

  private serialize(fila: any): DireccionData {
    return {
      id: fila.id.toString(),
      alias: fila.alias,
      destinatario_nombre: fila.destinatario_nombre,
      destinatario_apellidos: fila.destinatario_apellidos,
      direccion_completa: fila.direccion_completa,
      ciudad: fila.ciudad,
      telefono: fila.telefono,
      referencia: fila.referencia,
      es_principal: fila.es_principal,
    };
  }
}
