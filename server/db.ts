import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL not set. Running in in-memory mode.",
  );
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(process.env.DATABASE_URL!, { prepare: false, ssl: 'require' });
export const db = drizzle(client, { schema });
