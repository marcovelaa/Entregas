import axios from "axios";
import { api } from "@/lib/axios";
import type {
  ApiDataResponse,
  CheckoutSale,
  DiscountEvaluationRequest,
  DiscountEvaluationResponse,
  PaginatedResponse,
  PosApprover,
  PosCategory,
  PosCustomer,
  PosData,
  PosProduct,
  PosRole,
  SaleRequest,
} from "./pos-types";

const listData = <T>(response: { data: PaginatedResponse<T> }): T[] =>
  response.data.data ?? [];

export async function fetchPosData(signal: AbortSignal): Promise<PosData> {
  const approversRequest = Promise.all([
    api.get<PosApprover[]>("/usuarios", { signal }),
    api.get<PosRole[]>("/roles", { signal }),
  ])
    .then(([usuariosResponse, rolesResponse]) => {
      const adminRoleIds = new Set(
        rolesResponse.data
          .filter(
            (role) =>
              role.nombre === "Administrador" ||
              role.nombre === "Super Usuario",
          )
          .map((role) => role.id),
      );
      return usuariosResponse.data.filter(
        (user) => user.activo && adminRoleIds.has(user.rolId),
      );
    })
    .catch((error: unknown) => {
      if (isRequestCancelled(error)) throw error;
      // A seller may not have IAM read permission. Catalog and checkout stay usable;
      // manual price reductions remain unavailable until an approver can be loaded.
      return [];
    });

  const [clientesResponse, categoriasResponse, productosResponse, aprobadores] =
    await Promise.all([
      api.get<PaginatedResponse<PosCustomer>>("/clientes", { signal }),
      api.get<PaginatedResponse<PosCategory>>("/categorias", { signal }),
      api.get<PaginatedResponse<PosProduct>>(
        "/productos?limit=100&visibilidad=publica",
        { signal },
      ),
      approversRequest,
    ]);

  return {
    clientes: listData(clientesResponse),
    categorias: listData(categoriasResponse),
    productos: listData(productosResponse),
    aprobadores,
  };
}

export async function fetchPosProducts(
  signal: AbortSignal,
): Promise<PosProduct[]> {
  const response = await api.get<PaginatedResponse<PosProduct>>(
    "/productos?limit=100&visibilidad=publica",
    { signal },
  );
  return listData(response);
}

export async function evaluateDiscount(
  payload: DiscountEvaluationRequest,
  signal: AbortSignal,
): Promise<DiscountEvaluationResponse> {
  const response = await api.post<DiscountEvaluationResponse>(
    "/descuentos/validar",
    payload,
    { signal },
  );
  return response.data;
}

export async function registerSale(
  payload: SaleRequest,
): Promise<CheckoutSale> {
  const response = await api.post<ApiDataResponse<CheckoutSale>>(
    "/ventas",
    payload,
  );
  return response.data.data;
}

export function isRequestCancelled(error: unknown): boolean {
  return (
    axios.isCancel(error) ||
    (axios.isAxiosError(error) && error.code === "ERR_CANCELED")
  );
}

export function getRequestErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (message) return message;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
