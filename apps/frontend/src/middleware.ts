import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has('cliente_access_token');

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/ingresar';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/mi-cuenta/:path*'],
};
