export const CLIENTE_REPOSITORY = 'CLIENTE_REPOSITORY';

export type ClienteCreateData = {
  nombre?: string;
  nombres?: string;
  apellidos?: string;
  documento_id?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  activo?: boolean;
};

export type ClienteUpdateData = Partial<ClienteCreateData>;

export type ClienteConCredenciales = {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  passwordHash: string;
  activo: boolean;
};

export type ClienteCredencialesCreateData = {
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  passwordHash: string;
};

export interface IClienteRepository {
  crear(data: ClienteCreateData): Promise<any>;
  actualizar(id: string, data: ClienteUpdateData): Promise<any>;
  listar(params: {
    offset: number;
    limit: number;
    buscar?: string;
  }): Promise<{ total: number; data: any[] }>;
  obtenerPorId(id: string): Promise<any>;
  buscarPorEmailConCredenciales(
    email: string,
  ): Promise<ClienteConCredenciales | null>;
  crearConCredenciales(
    data: ClienteCredencialesCreateData,
  ): Promise<ClienteConCredenciales>;
  actualizarPassword(id: string, passwordHash: string): Promise<void>;
  obtenerConCredencialesPorId(
    id: string,
  ): Promise<ClienteConCredenciales | null>;
}
