import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!dbUrl || dbUrl.startsWith("file:")) {
  console.error(`
❌ Missing Supabase database URL.

Add this to your .env (from Supabase Dashboard → Project Settings → Database → Connection string → URI):

  SUPABASE_DB_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"

Then run: npm run supabase:setup
`);
  process.exit(1);
}

const sql = readFileSync(resolve(__dirname, "../supabase/schema.sql"), "utf8");

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  console.log("Connecting to Supabase Postgres...");
  await client.connect();
  console.log("Applying schema...");
  await client.query(sql);
  console.log("✅ Schema applied successfully!");
  console.log("   Tables: profiles, stores, products, orders, order_items");
  console.log("   Functions: is_slug_available, place_order");
  console.log("   RLS policies enabled");
} catch (err) {
  console.error("❌ Schema apply failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
