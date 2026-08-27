process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import pg from 'pg';
const { Client } = pg;
const db = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL });
await db.connect();
const { rows } = await db.query(`
  SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN ('projects','campaigns','tasks','content_items','profiles','settings','campaign_members','project_members','archived_projects')
  ORDER BY table_name, ordinal_position
`);
const { rows: tables } = await db.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`);
console.log('TABLES:', tables.map(r=>r.tablename).join(', '));
console.log('COLUMNS:');
rows.forEach(r => console.log(` ${r.table_name}.${r.column_name} (${r.data_type})`));
await db.end();
