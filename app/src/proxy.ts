import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') ?? request.nextUrl.host;
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}

export function proxy(request: NextRequest) {
  const cookie = request.cookies.get('cortex-session');

  if (cookie && verifySession(cookie.value)) {
    return NextResponse.next();
  }

  const next = request.nextUrl.pathname + request.nextUrl.search;
  const loginUrl = new URL('/login', getBaseUrl(request));
  loginUrl.searchParams.set('next', next);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/((?!_next|favicon\\.ico|api/|login(?:[/?]|$)|.*\\.[^/]+$).*)',
  ],
};
