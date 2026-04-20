import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';

export function middleware(request: NextRequest) {
  const cookie = request.cookies.get('cortex-session');

  if (cookie && verifySession(cookie.value)) {
    return NextResponse.next();
  }

  const next = request.nextUrl.pathname + request.nextUrl.search;
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', next);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/((?!_next|favicon\\.ico|api/|login(?:[/?]|$)|.*\\.[^/]+$).*)',
  ],
};
