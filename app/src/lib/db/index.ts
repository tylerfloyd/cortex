import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const url = process.env.DATABASE_URL;

// During `next build`, Next.js imports every route for page-data collection
// without runtime env vars. We skip the throw and use a placeholder so the
// module loads; any actual DB query at runtime will fail fast with a clear error
// if DATABASE_URL is truly missing.
if (!url && process.env.NEXT_PHASE !== 'phase-production-build') {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString: url ?? 'postgresql://placeholder' });

export const db = drizzle(pool, { schema });

export type DB = typeof db;
