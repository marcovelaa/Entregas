import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  IClienteResetTokenRepository,
  ClienteResetTokenData,
} from '../../domain/repositories/cliente-reset-token.repository.interface';

@Injectable()
export class PrismaClienteResetTokenRepository implements IClienteResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(
    clienteId: string,
    tokenHash: string,
    expiraEn: Date,
  ): Promise<void> {
    await this.prisma.clienteResetToken.create({
      data: {
        cliente_id: BigInt(clienteId),
        token_hash: tokenHash,
        expira_en: expiraEn,
      },
    });
  }

  async buscarPorHash(
    tokenHash: string,
  ): Promise<ClienteResetTokenData | null> {
    const fila = await this.prisma.clienteResetToken.findUnique({
      where: { token_hash: tokenHash },
    });
    if (!fila) return null;
    return {
      id: fila.id.toString(),
      clienteId: fila.cliente_id.toString(),
      tokenHash: fila.token_hash,
      expiraEn: fila.expira_en,
      usado: fila.usado,
    };
  }

  async marcarUsado(id: string): Promise<void> {
    await this.prisma.clienteResetToken.update({
      where: { id: BigInt(id) },
      data: { usado: true },
    });
  }
}
