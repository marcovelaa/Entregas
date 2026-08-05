export const DASHBOARD_REPOSITORY = 'DASHBOARD_REPOSITORY';

export type VentasHoy = { total: number; cantidad: number };

export type VentaDelDia = { total: number; creado_en: Date };

export type DistribucionPago = { metodo: string; monto: number };

export type AlertaStock = {
  id: string;
  nombre: string;
  sku: string;
  stock: number;
  stockMinimo: number;
};

export type VentaReciente = {
  id: string;
  ticket: string;
  total: number;
  metodoPago: string;
  fecha: Date;
  clienteNombre: string | null;
};

export interface IDashboardRepository {
  /** Total facturado y cantidad de ventas completadas desde el inicio del día. */
  obtenerVentasHoy(desde: Date): Promise<VentasHoy>;
  /** Ventas completadas desde `desde`, una fila por venta, para agrupar por día. */
  obtenerVentasDesde(desde: Date): Promise<VentaDelDia[]>;
  /** Monto total facturado por método de pago desde `desde`, agregado en la base. */
  obtenerDistribucionPorMetodoPago(desde: Date): Promise<DistribucionPago[]>;
  /** Los `limite` productos con menor stock disponible, hasta `umbral` unidades. */
  obtenerAlertasStock(umbral: number, limite: number): Promise<AlertaStock[]>;
  /** Cantidad de productos activos en el catálogo. */
  contarProductosActivos(): Promise<number>;
  /** Suma total de unidades disponibles en todo el inventario. */
  sumarStockDisponible(): Promise<number>;
  /** Las `limite` ventas completadas más recientes. */
  obtenerVentasRecientes(limite: number): Promise<VentaReciente[]>;
}
