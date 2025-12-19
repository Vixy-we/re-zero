import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL not set. Running in in-memory mode.",
  );
}

export const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
export const db = sql ? drizzle({ client: sql, schema }) : null;
