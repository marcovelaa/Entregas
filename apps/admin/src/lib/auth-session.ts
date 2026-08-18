import axios from "axios";
import { apiBaseUrl } from "./api-base-url";

export type SessionUser = {
  id: string;
  publicId: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol: string | null;
  permisos?: string[];
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  usuario: SessionUser;
};

const REFRESH_KEY = "erp.refresh_token";
const USER_KEY = "erp.usuario";

// Bare axios instance with NO interceptors. Keeping this separate from
// `lib/axios.ts`'s `api` instance avoids an `axios.ts` <-> `auth-session.ts`
// import cycle, and stops a 401 from `/auth/refresh` from ever re-entering
// the response interceptor's 401 handler (loop-proof by construction).
const authClient = axios.create({ baseURL: apiBaseUrl });

// Module-scoped, cleared on settle: shares one in-flight request across
// React StrictMode's double-invoked effect and any concurrent caller.
let inFlightRefresh: Promise<boolean> | null = null;

function holder(): { token: string | null } | null {
  if (typeof window === "undefined") return null; // SSR: no store, no leak
  const w = window as typeof window & { __erpAuth?: { token: string | null } };
  return (w.__erpAuth ??= { token: null });
}

function store(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export function getAccessToken(): string | null {
  const h = holder();
  return h ? h.token : null;
}

export function getUser(): SessionUser | null {
  const s = store();
  if (!s) return null;
  const raw = s.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setSession(res: LoginResponse): void {
  const h = holder();
  if (h) h.token = res.access_token;

  const s = store();
  if (!s) return;
  // The refresh token ROTATES on every login/refresh call, so persist the
  // FULL response, not just the access token.
  s.setItem(REFRESH_KEY, res.refresh_token);
  s.setItem(USER_KEY, JSON.stringify(res.usuario));
}

export function clearSession(): void {
  const h = holder();
  if (h) h.token = null;

  const s = store();
  if (!s) return;
  s.removeItem(REFRESH_KEY);
  s.removeItem(USER_KEY);
}

export async function login(email: string, password: string): Promise<void> {
  const res = await authClient.post<LoginResponse>("/auth/login", { email, password });
  setSession(res.data);
}

export async function refreshSession(): Promise<boolean> {
  const s = store();
  if (!s) return false;

  const refreshToken = s.getItem(REFRESH_KEY);
  if (!refreshToken) return false;

  if (!inFlightRefresh) {
    inFlightRefresh = authClient
      .post<LoginResponse>("/auth/refresh", { refresh_token: refreshToken })
      .then((res) => {
        setSession(res.data);
        return true;
      })
      .catch(() => {
        clearSession();
        return false;
      })
      .finally(() => {
        inFlightRefresh = null;
      });
  }

  return inFlightRefresh;
}

export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/login")) return;
  window.location.replace("/login");
}

export function getErrorMessage(e: unknown, fallback: string): string {
  if (typeof e === "object" && e !== null && "response" in e) {
    const response = (e as { response?: { data?: { message?: unknown } } }).response;
    const message = response?.data?.message;
    if (typeof message === "string") return message;
  }
  return fallback;
}
