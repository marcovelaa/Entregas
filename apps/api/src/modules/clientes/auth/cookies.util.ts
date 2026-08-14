import type { Response } from 'express';

const ACCESS_COOKIE = 'cliente_access_token';
const REFRESH_COOKIE = 'cliente_refresh_token';

const isProduction = () => process.env.NODE_ENV === 'production';

export function setClienteAuthCookies(
  res: Response,
  tokens: { access_token: string; refresh_token: string },
): void {
  res.cookie(ACCESS_COOKIE, tokens.access_token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000, // 8h, igual que la expiración del propio JWT
  });
  res.cookie(REFRESH_COOKIE, tokens.refresh_token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
  });
}

export function clearClienteAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
}
