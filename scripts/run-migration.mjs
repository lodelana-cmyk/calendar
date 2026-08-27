// run-migration.mjs — executed via: node --env-file=.env.local scripts/run-migration.mjs
import { readFileSync } from 'fs';
import pg from 'pg';
const { Client } = pg;

const connStr = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!connStr) {
  console.error('No POSTGRES_URL env var found. Run: node --env-file=.env.local scripts/run-migration.mjs');
  process.exit(1);
}

const sql = readFileSync(new URL('./002_v1_migration.sql', import.meta.url), 'utf8');

// Supabase pooler uses self-signed certs in some regions
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const db = new Client({ connectionString: connStr });
await db.connect();
try {
  await db.query(sql);
  console.log('✓ V1 migration complete');
} catch (e) {
  console.error('Migration failed:', e.message);
  process.exit(1);
} finally {
  await db.end();
}
