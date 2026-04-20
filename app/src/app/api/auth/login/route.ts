import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const authPassword = process.env.AUTH_PASSWORD;
  const authSecret = process.env.AUTH_SECRET;

  if (!authPassword || !authSecret) {
    return NextResponse.json(
      { error: 'Server misconfiguration: AUTH_PASSWORD or AUTH_SECRET is not set' },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const password = formData.get('password');
  const next = formData.get('next');

  const rawNext = typeof next === 'string' ? next : '';
  let redirectTo = '/';
  if (rawNext.startsWith('/') && !rawNext.startsWith('//')) {
    try {
      const resolved = new URL(rawNext, request.url);
      if (resolved.origin === new URL(request.url).origin) {
        redirectTo = rawNext;
      }
    } catch {
      // malformed URL — fall through to '/'
    }
  }

  const failUrl = new URL('/login', request.url);
  failUrl.searchParams.set('error', '1');
  failUrl.searchParams.set('next', redirectTo);

  if (typeof password !== 'string' || password.length === 0) {
    return NextResponse.redirect(failUrl, 303);
  }

  // Always run timingSafeEqual even on length mismatch to prevent timing oracle.
  let valid = false;
  try {
    const a = Buffer.from(password);
    const b = Buffer.from(authPassword);
    if (a.length !== b.length) {
      timingSafeEqual(a, a); // dummy comparison — keeps timing consistent
      valid = false;
    } else {
      valid = timingSafeEqual(a, b);
    }
  } catch {
    valid = false;
  }

  if (!valid) {
    return NextResponse.redirect(failUrl, 303);
  }

  const sessionValue = createSession();
  const response = NextResponse.redirect(new URL(redirectTo, request.url), 303);
  response.cookies.set('cortex-session', sessionValue, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });

  return response;
}
