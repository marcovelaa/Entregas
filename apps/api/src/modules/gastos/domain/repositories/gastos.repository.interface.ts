export const GASTOS_REPOSITORY = 'GASTOS_REPOSITORY';

export interface GastoData {
  id: string;
  usuario_id: string;
  categoria: string;
  descripcion: string;
  monto: number;
  fecha_gasto: Date;
  usuario?: { nombres: string; apellidos: string | null };
}

export interface IGastosRepository {
  listar(params: { offset: number; limit: number; categoria?: string }): Promise<{ total: number; data: GastoData[] }>;
  crear(params: { usuario_id: string; categoria: string; descripcion: string; monto: number; fecha_gasto?: Date }): Promise<GastoData>;
  eliminar(id: string): Promise<void>;
}
