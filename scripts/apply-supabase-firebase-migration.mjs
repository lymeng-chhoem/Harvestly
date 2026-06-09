import { readFile } from "node:fs/promises";
import pg from "pg";
import "./load-next-env.mjs";

const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
const migrationPath = process.argv[2] ?? "supabase/migrations/202606020001_firebase_auth_app_users.sql";

if (!databaseUrl) {
  console.error("Missing SUPABASE_DB_URL or DATABASE_URL.");
  process.exit(1);
}

const sql = await readFile(migrationPath, "utf8");
const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")
    ? undefined
    : { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query("begin");
  await client.query(sql);
  await client.query("commit");
  console.log(`Applied ${migrationPath}`);
} catch (error) {
  await client.query("rollback").catch(() => null);
  if (error?.code === "ENOTFOUND" || error?.code === "EAI_AGAIN") {
    console.error("Unable to resolve the Supabase Postgres host from SUPABASE_DB_URL.");
    console.error("Use the Supabase connection-pooler URL from Project Settings > Database > Connection string.");
  }
  throw error;
} finally {
  await client.end();
}
