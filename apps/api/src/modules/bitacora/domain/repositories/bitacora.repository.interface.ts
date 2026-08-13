import { TipoActorBitacora, EntidadBitacora } from '../entities/bitacora-enums';

export interface BitacoraCreateData {
  tipo_actor?: TipoActorBitacora | string;
  usuario_id?: string | null;
  cliente_id?: string | null;
  request_id?: string | null;
  ip?: string | null;
  user_agent?: string | null;
  entidad: EntidadBitacora | string;
  entidad_id?: string | null;
  operacion: string;
  datos_anteriores?: any;
  datos_nuevos?: any;
}

export interface BitacoraData {
  id: string;
  public_id: string;
  tipo_actor: string;
  usuario_id?: string | null;
  cliente_id?: string | null;
  request_id?: string | null;
  ip?: string | null;
  user_agent?: string | null;
  entidad: string;
  entidad_id?: string | null;
  operacion: string;
  datos_anteriores?: any;
  datos_nuevos?: any;
  creado_en: Date;
}

export const BITACORA_REPOSITORY = 'BITACORA_REPOSITORY';

export interface IBitacoraRepository {
  registrar(data: BitacoraCreateData): Promise<BitacoraData>;
  listarErp(params: {
    offset: number;
    limit: number;
    entidad?: string;
    usuario_id?: string;
    cliente_id?: string;
    operacion?: string;
  }): Promise<{ total: number; data: BitacoraData[] }>;
}
