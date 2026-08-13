import { Prisma } from '@prisma/client';

export const COMPRA_REPOSITORY = 'COMPRA_REPOSITORY';

export interface CompraDetalleEntity {
  producto_id: bigint;
  variante_id?: bigint;
  empaque_id?: bigint;
  cantidad: number;
  costo_unitario: number;
}

export interface CompraCreateData {
  proveedor_id?: bigint;
  usuario_id: bigint;
  numero_recibo?: string;
  costo_transporte?: number;
  subtotal?: number;
  total: number;
  estado?: string;
  observaciones?: string;
  detalles: CompraDetalleEntity[];
}

export interface ICompraRepository {
  crear(
    data: CompraCreateData,
    tx?: any,
  ): Promise<Prisma.CompraGetPayload<Record<string, never>>>;
  listar(params: {
    offset: number;
    limit: number;
  }): Promise<{ total: number; data: any[] }>;
  obtenerPorId(id: string): Promise<any>;
}
