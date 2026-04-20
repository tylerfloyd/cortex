import type { ConnectionOptions } from 'bullmq';

if (!process.env.REDIS_URL && process.env.NEXT_PHASE !== 'phase-production-build') {
  throw new Error('REDIS_URL environment variable is not set');
}

// Parse the Redis URL into a plain options object that BullMQ accepts.
// BullMQ bundles its own ioredis, so we cannot pass an ioredis instance
// from the project's top-level dependency.
function parseRedisUrl(url: string): ConnectionOptions {
  const parsed = new URL(url);
  const options: ConnectionOptions = {
    host: parsed.hostname || '127.0.0.1',
    port: parsed.port ? parseInt(parsed.port, 10) : 6379,
  };
  if (parsed.password) {
    (options as Record<string, unknown>).password = parsed.password;
  }
  if (parsed.pathname && parsed.pathname !== '/') {
    const db = parseInt(parsed.pathname.slice(1), 10);
    if (!isNaN(db)) {
      (options as Record<string, unknown>).db = db;
    }
  }
  // NOTE: parsed.username is intentionally not extracted here. Managed Redis
  // providers that require ACL username authentication (e.g. Redis Cloud,
  // Upstash) will need the connection options updated manually to include a
  // `username` field alongside `password`.
  return options;
}

export const redisConnection: ConnectionOptions = parseRedisUrl(process.env.REDIS_URL ?? 'redis://placeholder');
