export const CLIENTE_REPOSITORY = 'CLIENTE_REPOSITORY';

export type ClienteCreateData = {
  nombres: string;
  apellidos?: string;
  documento_id?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
};

export type ClienteUpdateData = Partial<ClienteCreateData> & { activo?: boolean };

export interface IClienteRepository {
  crear(data: ClienteCreateData): Promise<any>;
  actualizar(id: string, data: ClienteUpdateData): Promise<any>;
  listar(params: { offset: number; limit: number; buscar?: string }): Promise<{ total: number; data: any[] }>;
  obtenerPorId(id: string): Promise<any>;
}
