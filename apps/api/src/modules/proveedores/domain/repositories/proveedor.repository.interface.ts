export const PROVEEDOR_REPOSITORY = 'PROVEEDOR_REPOSITORY';

export interface ProveedorEntity {
  id: bigint;
  nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  email?: string | null;
  activo: boolean;
  creado_en?: Date;
  actualizado_en?: Date;
}

export interface IProveedorRepository {
  crear(proveedor: Partial<ProveedorEntity>): Promise<ProveedorEntity>;
  listar(params: { offset: number; limit: number }): Promise<{ total: number; data: ProveedorEntity[] }>;
  buscarPorId(id: bigint): Promise<ProveedorEntity | null>;
  actualizar(id: bigint, datos: Partial<ProveedorEntity>): Promise<ProveedorEntity>;
}
