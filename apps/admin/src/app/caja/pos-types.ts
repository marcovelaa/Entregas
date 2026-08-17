import type { VentaData } from "@/components/molecules/TicketImpresion/TicketImpresion";

export type Identifier = string;
export type Numeric = number | string;
export type PaymentMethod = "EFECTIVO" | "TARJETA" | "QR";
export type ProductState = "VENCIDO" | "AGOTADO" | string;
export type ProductType = "COMBO" | string;

export interface PaginatedResponse<T> {
  data: T[];
  meta?: Record<string, number>;
}

export interface ApiDataResponse<T> {
  data: T;
}

export interface InventoryItem {
  variante_id: Identifier | null;
  cantidad_disponible: Numeric;
  reservado: Numeric;
}

export interface ProductImage {
  url: string;
}

export interface ProductPackage {
  id: Identifier;
  nombre: string;
  precio: Numeric;
  sku: string;
  multiplicador_unidades?: Numeric;
}

export interface ProductVariant {
  id: Identifier;
  nombre?: string | null;
  sku_base?: string | null;
  imagen_url?: string | null;
  precio_adicional?: Numeric | null;
  empaques?: ProductPackage[];
}

export interface ProductImagePresentation {
  badge_estilo?:
    "red" | "emerald" | "blue" | "amber" | "slate" | "indigo" | "none";
  badge_texto?: string | null;
  mostrar_badge?: boolean;
  mostrar_desglose_pos?: boolean;
  modo_imagen?: "PROPIA" | string;
}

export interface ComboComponentProduct {
  nombre: string;
  precio_base: Numeric;
  imagenes?: ProductImage[];
  Inventario?: InventoryItem[];
}

export interface ProductComboComponent {
  cantidad: Numeric;
  variante_id?: Identifier | null;
  componente_producto?: ComboComponentProduct | null;
}

export interface PosProduct {
  id: Identifier;
  categoria_id?: Identifier | null;
  nombre: string;
  sku?: string | null;
  precio_base: Numeric;
  tipo_producto?: ProductType;
  estado_venta?: ProductState;
  stock_vendible?: number;
  atributos?: { presentacion_visual?: ProductImagePresentation | null } | null;
  Inventario?: InventoryItem[];
  imagenes?: ProductImage[];
  variantes?: ProductVariant[];
  componentes_combo?: ProductComboComponent[];
}

export interface PosCategory {
  id: Identifier;
  nombre: string;
}

export interface PosCustomer {
  id: Identifier;
  nombre: string;
  documento_id?: string | null;
}

export interface PosRole {
  id: Identifier;
  nombre: string;
}

export interface PosApprover {
  id: Identifier;
  rolId: Identifier;
  nombres: string;
  apellidos: string;
  email: string;
  activo: boolean;
}

export interface PosData {
  productos: PosProduct[];
  clientes: PosCustomer[];
  categorias: PosCategory[];
  aprobadores: PosApprover[];
}

export interface CartItem {
  cart_id: string;
  id: Identifier;
  variante_id: Identifier | null;
  empaque_id: Identifier | null;
  multiplicador: number;
  nombre: string;
  sku: string;
  precio_catalogo: number;
  precio: number;
  cantidad: number | "";
  maxStock: number;
  aprobador_id?: Identifier;
  motivo_ajuste?: string;
}

export interface DiscountPreview {
  id: Identifier;
  nombre: string;
  montoDescontado: number;
}

export interface DiscountInfo {
  message: string;
  isCouponError: boolean;
}

export interface DiscountEvaluationRequest {
  cupon?: string;
  canal: "POS";
  clienteId?: Identifier;
  items: Array<{
    productoId: Identifier;
    varianteId?: Identifier;
    empaqueId?: Identifier;
    cantidad: number;
    precioUnitario: number;
  }>;
}

export interface DiscountEvaluationResponse {
  success: boolean;
  data?: DiscountPreview | null;
  error?: string;
  message?: string;
}

export interface SaleRequest {
  cliente_id?: Identifier;
  idempotency_key: string;
  metodo_pago: PaymentMethod;
  monto_pagado: number;
  descuento_id?: Identifier;
  descuento_total?: number;
  codigo_cupon?: string;
  aprobador_usuario_id?: Identifier;
  motivo_ajuste?: string;
  detalles: Array<{
    producto_id: Identifier;
    variante_id?: Identifier;
    empaque_id?: Identifier;
    cantidad: number;
    precio_unitario: number;
    motivo_ajuste?: string;
  }>;
}

export type CheckoutSale = VentaData;
