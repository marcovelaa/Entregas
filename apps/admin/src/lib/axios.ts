import axios, { type AxiosError } from "axios";
import { apiBaseUrl } from "./api-base-url";
import { clearSession, getAccessToken, redirectToLogin } from "./auth-session";

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearSession();
      redirectToLogin();
    } else if (error.response?.status === 403) {
      const config = error.config as any;
      if (!config?.silentAuthError) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('global-error', { 
              detail: 'Acceso denegado: No tienes permiso para realizar esta acción.' 
            })
          );
        }
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Builds a public asset URL from the configured API origin. API endpoints live
 * below `/api`, while uploaded catalogue assets are served from the origin.
 */
export function getApiAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  const assetOrigin = apiBaseUrl.replace(/\/api\/?$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${assetOrigin}${normalizedPath}`;
}
