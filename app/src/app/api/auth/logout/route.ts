import { NextRequest, NextResponse } from 'next/server';

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') ?? request.nextUrl.host;
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', getBaseUrl(request)), 303);
  response.cookies.set('cortex-session', '', {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return response;
}
