export const INVENTARIO_REPOSITORY = 'INVENTARIO_REPOSITORY';

export interface IInventarioRepository {
  listarStock(params: {
    offset: number;
    limit: number;
  }): Promise<{ total: number; data: any[] }>;
  listarMovimientos(params: {
    offset: number;
    limit: number;
  }): Promise<{ total: number; data: any[] }>;
  registrarMovimiento(
    data: {
      producto_id: bigint;
      variante_id?: bigint;
      empaque_id?: bigint;
      tipo_movimiento: string;
      cantidad: number;
      motivo?: string;
      usuario_id?: bigint;
    },
    tx?: any,
  ): Promise<any>;
}
