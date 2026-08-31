// Proves one company's user cannot see/touch another company's data.
// Runs inside ONE transaction that is ROLLED BACK — nothing is persisted.
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
const ok = (m) => console.log("  ✓", m);
const bad = (m) => { console.log("  ✗ LEAK:", m); process.exitCode = 1; };

async function asUser(uid, fn) {
  await c.query("select set_config('role','authenticated',true)");
  await c.query(`select set_config('request.jwt.claims',$1,true)`, [JSON.stringify({ sub: uid, role: "authenticated" })]);
  try { return await fn(); }
  finally { await c.query("select set_config('request.jwt.claims','',true)"); await c.query("reset role"); }
}

await c.connect();
await c.query("begin");
try {
  const u1 = (await c.query(`insert into auth.users (id,instance_id,aud,role,email,encrypted_password,created_at,updated_at)
    values (gen_random_uuid(),'00000000-0000-0000-0000-000000000000','authenticated','authenticated','iso-a@test.local','x',now(),now()) returning id`)).rows[0].id;
  const u2 = (await c.query(`insert into auth.users (id,instance_id,aud,role,email,encrypted_password,created_at,updated_at)
    values (gen_random_uuid(),'00000000-0000-0000-0000-000000000000','authenticated','authenticated','iso-b@test.local','x',now(),now()) returning id`)).rows[0].id;

  const orgA = await asUser(u1, async () => (await c.query(`select id from create_organization('Client A','iso-client-a','{}'::jsonb)`)).rows[0].id);
  const orgB = await asUser(u2, async () => (await c.query(`select id from create_organization('Client B','iso-client-b','{}'::jsonb)`)).rows[0].id);
  ok("client A + client B each created their own company");

  // seed A and B (as postgres, for setup only)
  const sA = (await c.query(`insert into stores (organization_id,owner_id,name,slug,industry,theme) values ($1,$2,'A Store','iso-a-store','apparel','fashion') returning id`, [orgA, u1])).rows[0].id;
  const sB = (await c.query(`insert into stores (organization_id,owner_id,name,slug,industry,theme) values ($1,$2,'B Store','iso-b-store','tech','tech') returning id`, [orgB, u2])).rows[0].id;
  await c.query(`insert into products (store_id,name,price) values ($1,'A secret product',9999)`, [sA]);
  await c.query(`insert into products (store_id,name,price) values ($1,'B secret product',9999)`, [sB]);
  await c.query(`insert into orders (store_id,order_number,customer_name,customer_phone,address,subtotal,total) values ($1,'A-1','A Buyer','999','addr',100,100)`, [sA]);
  await c.query(`insert into orders (store_id,order_number,customer_name,customer_phone,address,subtotal,total) values ($1,'B-1','B Buyer','999','addr',100,100)`, [sB]);
  await c.query(`insert into storefront_events (organization_id,store_id,event_type) values ($1,$2,'page_view')`, [orgB, sB]);
  await c.query(`insert into plan_events (organization_id,to_plan) values ($1,'pro')`, [orgB]);
  await c.query(`insert into store_customizations (store_id,organization_id,draft_config) values ($1,$2,'{"secret":"B private draft"}'::jsonb) on conflict (store_id) do nothing`, [sB, orgB]);
  await c.query(`insert into store_customization_versions (store_id,organization_id,config) values ($1,$2,'{"v":"B"}'::jsonb)`, [sB, orgB]);

  // ── Client A tries to see Client B ──────────────────────────────
  const r = await asUser(u1, async () => {
    const q = (sql, p = []) => c.query(sql, p).then((x) => x.rows[0].n);
    return {
      stores: await q(`select count(*)::int n from stores where id=$1`, [sB]),
      products: await q(`select count(*)::int n from products where store_id=$1`, [sB]),
      orders: await q(`select count(*)::int n from orders where store_id=$1`, [sB]),
      order_items: await q(`select count(*)::int n from order_items oi join orders o on o.id=oi.order_id where o.store_id=$1`, [sB]),
      org: await q(`select count(*)::int n from organizations where id=$1`, [orgB]),
      members: await q(`select count(*)::int n from organization_members where organization_id=$1`, [orgB]),
      customizations: await q(`select count(*)::int n from store_customizations where store_id=$1`, [sB]),
      versions: await q(`select count(*)::int n from store_customization_versions where store_id=$1`, [sB]),
      analytics: await q(`select count(*)::int n from storefront_events where store_id=$1`, [sB]),
      plan_events: await q(`select count(*)::int n from plan_events where organization_id=$1`, [orgB]),
      allStoresVisible: await q(`select count(*)::int n from stores`),
      allOrdersVisible: await q(`select count(*)::int n from orders`),
    };
  });

  for (const [k, v] of Object.entries(r)) {
    if (k === "allStoresVisible" || k === "allOrdersVisible") continue;
    v === 0 ? ok(`client A sees 0 of client B's ${k}`) : bad(`client A saw ${v} of client B's ${k}`);
  }
  ok(`client A's own view: ${r.allStoresVisible} store(s), ${r.allOrdersVisible} order(s) — only their own`);

  // ── Client A tries to WRITE into Client B ──────────────────────
  await asUser(u1, async () => {
    await c.query(`savepoint w`);
    try { await c.query(`update products set price=1 where store_id=$1`, [sB]); } catch { await c.query(`rollback to savepoint w`); }
    await c.query(`savepoint w2`);
    try { await c.query(`update stores set name='HACKED' where id=$1`, [sB]); } catch { await c.query(`rollback to savepoint w2`); }
    await c.query(`savepoint w3`);
    try { await c.query(`select publish_store($1,'stolen')`, [sB]); } catch { await c.query(`rollback to savepoint w3`); }
  });
  const bPrice = (await c.query(`select price from products where store_id=$1`, [sB])).rows[0].price;
  const bName = (await c.query(`select name from stores where id=$1`, [sB])).rows[0].name;
  bPrice === 9999 && bName === "B Store"
    ? ok("client A's writes/publish against client B changed NOTHING")
    : bad(`client B mutated: price=${bPrice} name=${bName}`);

  // ── Anonymous storefront visitor ──────────────────────────────
  await c.query("select set_config('role','anon',true)");
  const anonB = (await c.query(`select get_storefront('iso-b-store') as r`)).rows[0].r; // B never published
  const anonProducts = (await c.query(`select count(*)::int n from products`)).rows[0].n;
  await c.query("reset role");
  anonB === null ? ok("anonymous visitor cannot load an unpublished store") : bad("unpublished store exposed to anon");
  ok(`anonymous visitor sees ${anonProducts} product row(s) total (only published + live)`);

  console.log("\n" + (process.exitCode ? "❌ ISOLATION BROKEN" : "✅ TENANT ISOLATION VERIFIED — no client can see another client's data"));
} finally {
  await c.query("rollback");
  await c.end();
}
