import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let sharedRatelimit: Ratelimit | null = null;

function getRatelimit() {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Upstash Redis environment variables are not configured.');
  }

  if (!sharedRatelimit) {
    const redis = new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    });

    sharedRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      analytics: true,
      prefix: 'buffcat:api-ratelimit',
    });
  }

  return sharedRatelimit;
}

function getRequestIdentifier(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'anonymous';

  return `${request.nextUrl.pathname}:${ip}`;
}

export async function middleware(request: NextRequest) {
  const ratelimit = getRatelimit();
  const result = await ratelimit.limit(getRequestIdentifier(request));

  if (!result.success) {
    return NextResponse.json(
      { error: 'Too many requests.' },
      {
        status: 429,
        headers: {
          'Cache-Control': 'no-store',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toString(),
        },
      },
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());
  return response;
}

export const config = {
  matcher: ['/api/contract', '/api/token'],
};
