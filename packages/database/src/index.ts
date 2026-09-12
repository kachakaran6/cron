import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://cron_user:super_secure_postgres_pass_2026@localhost:5432/cron_saas';

// Disable prefetch for serverless/worker compatibility
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

export * from './schema';
