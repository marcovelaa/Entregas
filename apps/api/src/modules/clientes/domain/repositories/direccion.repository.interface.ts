export const DIRECCION_REPOSITORY = 'DIRECCION_REPOSITORY';

export type DireccionData = {
  id: string;
  alias: string;
  destinatario_nombre: string;
  destinatario_apellidos: string;
  direccion_completa: string;
  ciudad: string;
  telefono: string;
  referencia: string | null;
  es_principal: boolean;
};

export type DireccionCreateData = {
  alias: string;
  destinatario_nombre: string;
  destinatario_apellidos: string;
  direccion_completa: string;
  ciudad: string;
  telefono: string;
  referencia?: string;
};

export type DireccionUpdateData = Partial<DireccionCreateData>;

export interface IDireccionRepository {
  listarPorCliente(clienteId: string): Promise<DireccionData[]>;
  crear(clienteId: string, data: DireccionCreateData): Promise<DireccionData>;
  actualizar(clienteId: string, direccionId: string, data: DireccionUpdateData): Promise<DireccionData | null>;
  eliminar(clienteId: string, direccionId: string): Promise<boolean>;
  marcarPrincipal(clienteId: string, direccionId: string): Promise<boolean>;
}
