// Dev helper: create a confirmed email/password user for local testing.
//   node scripts/make-demo-user.mjs
// Remove later with: delete from auth.users where email = 'demo.founder@supershowroom.test';
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const email = process.env.DEMO_EMAIL || "demo.founder@supershowroom.test";
const pw = process.env.DEMO_PASSWORD || "DemoPass123!";

const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
try {
  await c.query("delete from auth.users where email = $1", [email]);
  const { rows } = await c.query(
    `insert into auth.users
       (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
     values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        $1, crypt($2, gen_salt('bf')), now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('name','Demo Founder'))
     returning id`,
    [email, pw]
  );
  const uid = rows[0].id;
  await c.query(
    `insert into auth.identities
       (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
     values (gen_random_uuid(), $1::uuid, $2::text, jsonb_build_object('sub', $2::text, 'email', $3::text), 'email', now(), now(), now())`,
    [uid, uid, email]
  );
  const p = await c.query("select id, name from public.profiles where id = $1", [uid]);
  console.log("user id :", uid);
  console.log("profile :", JSON.stringify(p.rows[0]));
  console.log("login   :", email, "/", pw);
} finally {
  await c.end();
}
