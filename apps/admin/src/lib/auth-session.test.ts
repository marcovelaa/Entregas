import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }));

vi.mock("axios", () => ({
  default: {
    create: () => ({ post: mockPost }),
  },
}));

import {
  clearSession,
  getAccessToken,
  getErrorMessage,
  getUser,
  login,
  redirectToLogin,
  refreshSession,
  setSession,
  type LoginResponse,
} from "./auth-session";

function createFakeSessionStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    clear: () => {
      data.clear();
    },
    key: (index: number) => Array.from(data.keys())[index] ?? null,
  };
}

function installFakeWindow(pathname = "/") {
  const replace = vi.fn();
  const sessionStorage = createFakeSessionStorage();
  const fakeWindow = { sessionStorage, location: { pathname, replace } };
  Object.defineProperty(globalThis, "window", {
    value: fakeWindow,
    writable: true,
    configurable: true,
  });
  return { replace, sessionStorage };
}

function removeWindow() {
  Object.defineProperty(globalThis, "window", {
    value: undefined,
    writable: true,
    configurable: true,
  });
}

const sampleUser = {
  id: "1",
  publicId: "pub-1",
  nombres: "Ada",
  apellidos: "Lovelace",
  email: "ada@entregas.com.bo",
  rol: "admin",
};

function loginResponse(overrides: Partial<LoginResponse> = {}): LoginResponse {
  return {
    access_token: "access-1",
    refresh_token: "refresh-1",
    usuario: sampleUser,
    ...overrides,
  };
}

describe("auth-session", () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  afterEach(() => {
    removeWindow();
  });

  describe("setSession / getAccessToken round-trip", () => {
    it("stores the access token in memory and the user/refresh token in sessionStorage", () => {
      const { sessionStorage } = installFakeWindow();

      setSession(loginResponse());

      expect(getAccessToken()).toBe("access-1");
      expect(getUser()).toEqual(sampleUser);
      expect(sessionStorage.getItem("erp.refresh_token")).toBe("refresh-1");
    });

    it("clears the in-memory token and the sessionStorage entries", () => {
      const { sessionStorage } = installFakeWindow();
      setSession(loginResponse());

      clearSession();

      expect(getAccessToken()).toBeNull();
      expect(getUser()).toBeNull();
      expect(sessionStorage.getItem("erp.refresh_token")).toBeNull();
    });
  });

  it("persists refresh-token rotation across calls", () => {
    const { sessionStorage } = installFakeWindow();
    setSession(loginResponse({ refresh_token: "refresh-1" }));
    expect(sessionStorage.getItem("erp.refresh_token")).toBe("refresh-1");

    setSession(loginResponse({ access_token: "access-2", refresh_token: "refresh-2" }));

    expect(getAccessToken()).toBe("access-2");
    expect(sessionStorage.getItem("erp.refresh_token")).toBe("refresh-2");
  });

  describe("SSR path (no window)", () => {
    it("returns null and performs no writes when window is undefined", () => {
      // Triangulation skipped: pure `typeof window === 'undefined'` guard,
      // a single code path with one possible output shared by every accessor.
      removeWindow();

      expect(getAccessToken()).toBeNull();
      expect(getUser()).toBeNull();
      expect(() => setSession(loginResponse())).not.toThrow();
      expect(() => clearSession()).not.toThrow();
    });
  });

  describe("redirectToLogin", () => {
    it("does not navigate when already on /login", () => {
      const { replace } = installFakeWindow("/login");

      redirectToLogin();

      expect(replace).not.toHaveBeenCalled();
    });

    it("performs a hard navigation to /login from any other route", () => {
      const { replace } = installFakeWindow("/caja");

      redirectToLogin();

      expect(replace).toHaveBeenCalledWith("/login");
    });
  });

  describe("refreshSession", () => {
    it("resolves to false without calling the API when no refresh token is stored", async () => {
      installFakeWindow();

      const result = await refreshSession();

      expect(result).toBe(false);
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("rotates both the access and refresh tokens on success", async () => {
      const { sessionStorage } = installFakeWindow();
      sessionStorage.setItem("erp.refresh_token", "refresh-1");
      mockPost.mockResolvedValueOnce({
        data: loginResponse({ access_token: "access-2", refresh_token: "refresh-2" }),
      });

      const result = await refreshSession();

      expect(result).toBe(true);
      expect(getAccessToken()).toBe("access-2");
      expect(sessionStorage.getItem("erp.refresh_token")).toBe("refresh-2");
    });

    it("shares a single in-flight request across concurrent callers", async () => {
      const { sessionStorage } = installFakeWindow();
      sessionStorage.setItem("erp.refresh_token", "refresh-1");
      let resolvePost!: (value: { data: LoginResponse }) => void;
      mockPost.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
      );

      const first = refreshSession();
      const second = refreshSession();

      expect(mockPost).toHaveBeenCalledTimes(1);
      resolvePost({ data: loginResponse() });

      const [firstResult, secondResult] = await Promise.all([first, second]);
      expect(firstResult).toBe(true);
      expect(secondResult).toBe(true);
    });

    it("resolves to false and clears any stale session when the refresh call fails", async () => {
      const { sessionStorage } = installFakeWindow();
      sessionStorage.setItem("erp.refresh_token", "refresh-1");
      mockPost.mockRejectedValueOnce(new Error("401"));

      const result = await refreshSession();

      expect(result).toBe(false);
      expect(sessionStorage.getItem("erp.refresh_token")).toBeNull();
    });
  });

  describe("getErrorMessage", () => {
    it("prefers the API-provided message", () => {
      const error = { response: { data: { message: "Credenciales inválidas" } } };

      expect(getErrorMessage(error, "fallback")).toBe("Credenciales inválidas");
    });

    it("falls back to the provided default when no API message exists", () => {
      expect(
        getErrorMessage(new Error("network down"), "No pudimos iniciar sesión."),
      ).toBe("No pudimos iniciar sesión.");
    });
  });

  describe("login", () => {
    it("posts credentials and establishes the session from the response", async () => {
      installFakeWindow();
      mockPost.mockResolvedValueOnce({ data: loginResponse() });

      await login("ada@entregas.com.bo", "secret");

      expect(mockPost).toHaveBeenCalledWith("/auth/login", {
        email: "ada@entregas.com.bo",
        password: "secret",
      });
      expect(getAccessToken()).toBe("access-1");
    });
  });
});
