import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a comparison to avoid short-circuit timing leak from length check
    timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function validateApiKey(request: NextRequest): NextResponse | null {
  const apiKey = request.headers.get('x-api-key');
  const expected = process.env.API_KEY;

  if (!apiKey || !expected || !safeCompare(apiKey, expected)) {
    return NextResponse.json(
      { error: 'Unauthorized: missing or invalid API key' },
      { status: 401 }
    );
  }

  return null;
}

type RouteHandler<T extends object = object> = (
  request: NextRequest,
  context: T
) => Promise<NextResponse> | NextResponse;

export function withApiKey<T extends object = object>(
  handler: RouteHandler<T>
): RouteHandler<T> {
  return async (request: NextRequest, context: T) => {
    const authError = validateApiKey(request);
    if (authError) return authError;
    return handler(request, context);
  };
}
