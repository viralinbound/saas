// Applies every supabase/migrations/*.sql file in filename order.
// Each file is idempotent, so re-running is safe. A ledger table records
// what ran so future migrations only add NEW files — existing data is never
// touched by a re-apply.
//
//   node scripts/apply-migrations.mjs            # apply pending
//   node scripts/apply-migrations.mjs --all      # re-apply every file
//
// Requires SUPABASE_DB_URL in .env (Supabase Studio → Project Settings →
// Database → Connection string → URI, port 5432 "session" or 6543 "pooler").

import { readFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const dbUrl = process.env.SUPABASE_DB_URL;
const reapplyAll = process.argv.includes("--all");

if (!dbUrl || dbUrl.startsWith("file:")) {
  console.error(`
❌ Missing SUPABASE_DB_URL.

Add to .env (Supabase Studio → Project Settings → Database → Connection string → URI):

  SUPABASE_DB_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"

Then: npm run supabase:migrate
`);
  process.exit(1);
}

const dir = resolve(__dirname, "../supabase/migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(`
    create table if not exists public.schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
    alter table public.schema_migrations enable row level security;
    revoke all on public.schema_migrations from anon, authenticated;
  `);

  const { rows } = await client.query("select filename from public.schema_migrations");
  const done = new Set(rows.map((r) => r.filename));

  let applied = 0;
  for (const file of files) {
    if (!reapplyAll && done.has(file)) {
      console.log(`•  skip     ${file}`);
      continue;
    }
    const sql = readFileSync(resolve(dir, file), "utf8");
    process.stdout.write(`▸  applying ${file} ... `);
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query(
        `insert into public.schema_migrations (filename) values ($1)
         on conflict (filename) do update set applied_at = now()`,
        [file]
      );
      await client.query("commit");
      console.log("done");
      applied++;
    } catch (err) {
      await client.query("rollback");
      throw new Error(`${file} failed: ${err.message}`);
    }
  }
  console.log(`\n✅ ${applied} migration(s) applied, ${files.length - applied} already current.`);
} catch (err) {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
} finally {
  await client.end();
}
