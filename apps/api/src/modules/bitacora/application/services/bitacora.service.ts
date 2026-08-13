import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  BITACORA_REPOSITORY,
  type IBitacoraRepository,
  type BitacoraCreateData,
  type BitacoraData,
} from '../../domain/repositories/bitacora.repository.interface';

const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'token',
  'secret',
  'jwt',
  'refresh_token',
  'access_token',
  'codigo_reset',
  'credit_card',
]);

@Injectable()
export class BitacoraService {
  private readonly logger = new Logger(BitacoraService.name);

  constructor(
    @Inject(BITACORA_REPOSITORY)
    private readonly bitacoraRepo: IBitacoraRepository,
  ) {}

  sanitizar(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }
    if (typeof data !== 'object') {
      return data;
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizar(item));
    }

    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        cleanObj[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        cleanObj[key] = this.sanitizar(value);
      } else {
        cleanObj[key] = value;
      }
    }
    return cleanObj;
  }

  async registrar(data: BitacoraCreateData): Promise<BitacoraData | null> {
    try {
      const sanitizedAnteriores = this.sanitizar(data.datos_anteriores);
      const sanitizedNuevos = this.sanitizar(data.datos_nuevos);

      return await this.bitacoraRepo.registrar({
        ...data,
        datos_anteriores: sanitizedAnteriores,
        datos_nuevos: sanitizedNuevos,
      });
    } catch (error) {
      this.logger.error(
        `Error registrando evento en bitácora (${data.operacion}): ${error.message}`,
        error.stack,
      );
      return null;
    }
  }
}
