import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

const mocks = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
  clearSession: vi.fn(),
  redirectToLogin: vi.fn(),
}));

vi.mock("./auth-session", () => ({
  getAccessToken: mocks.getAccessToken,
  clearSession: mocks.clearSession,
  redirectToLogin: mocks.redirectToLogin,
}));

import { api } from "./axios";

function requestFulfilled() {
  const requestInterceptor = api.interceptors.request as any;
  const handler = requestInterceptor.handlers[0];
  if (!handler?.fulfilled) throw new Error("request interceptor not registered");
  return handler.fulfilled as (
    config: InternalAxiosRequestConfig,
  ) => InternalAxiosRequestConfig;
}

function responseRejected() {
  const responseInterceptor = api.interceptors.response as any;
  const handler = responseInterceptor.handlers[0];
  if (!handler?.rejected) throw new Error("response interceptor not registered");
  return handler.rejected as (error: AxiosError) => Promise<never>;
}

function fakeConfig(): InternalAxiosRequestConfig {
  return { headers: {} } as unknown as InternalAxiosRequestConfig;
}

function fakeError(status?: number): AxiosError {
  return {
    response: status === undefined ? undefined : { status },
  } as unknown as AxiosError;
}

describe("axios request interceptor", () => {
  beforeEach(() => {
    mocks.getAccessToken.mockReset();
    mocks.clearSession.mockReset();
    mocks.redirectToLogin.mockReset();
  });

  it("attaches Authorization: Bearer <token> when an access token exists", () => {
    mocks.getAccessToken.mockReturnValue("token-123");

    const result = requestFulfilled()(fakeConfig());

    expect(result.headers.Authorization).toBe("Bearer token-123");
  });

  it("does not attach Authorization when there is no access token", () => {
    mocks.getAccessToken.mockReturnValue(null);

    const result = requestFulfilled()(fakeConfig());

    expect(result.headers.Authorization).toBeUndefined();
  });
});

describe("axios response interceptor", () => {
  beforeEach(() => {
    mocks.getAccessToken.mockReset();
    mocks.clearSession.mockReset();
    mocks.redirectToLogin.mockReset();
  });

  it("clears the session and redirects to /login on a 401", async () => {
    const error = fakeError(401);

    await expect(responseRejected()(error)).rejects.toBe(error);

    expect(mocks.clearSession).toHaveBeenCalledTimes(1);
    expect(mocks.redirectToLogin).toHaveBeenCalledTimes(1);
  });

  it("passes other statuses through without clearing the session", async () => {
    const error = fakeError(500);

    await expect(responseRejected()(error)).rejects.toBe(error);

    expect(mocks.clearSession).not.toHaveBeenCalled();
    expect(mocks.redirectToLogin).not.toHaveBeenCalled();
  });

  it("passes network errors without a response through unchanged", async () => {
    const error = fakeError(undefined);

    await expect(responseRejected()(error)).rejects.toBe(error);

    expect(mocks.clearSession).not.toHaveBeenCalled();
    expect(mocks.redirectToLogin).not.toHaveBeenCalled();
  });
});
