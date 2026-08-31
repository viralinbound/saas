import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const samples = JSON.parse(readFileSync(resolve(__dirname, "../supabase/demo-products.json"), "utf8"));

async function main() {
  const { data: existing } = await admin.from("stores").select("id").eq("slug", "green-basket").maybeSingle();
  if (existing) {
    console.log("Demo store green-basket already exists");
    return;
  }

  // Demo store needs an owner — create via auth admin or skip if no users
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1 });
  const owner = users?.users?.[0];
  if (!owner) {
    console.log("No users yet. Sign up first, then re-run seed or create store via onboarding.");
    return;
  }

  const { data: store, error } = await admin.from("stores").insert({
    owner_id: owner.id,
    name: "Green Basket",
    slug: "green-basket",
    industry: "grocery",
    theme: "kirana",
    plan: "free",
    status: "live",
    accent_color: "#24457A",
  }).select().single();

  if (error) {
    console.error("Store create failed:", error.message);
    process.exit(1);
  }

  await admin.from("products").insert(
    samples.map((p: { name: string; price: number; image: string; description?: string; category?: string }) => ({
      store_id: store.id,
      name: p.name,
      description: p.description || null,
      price: p.price,
      image: p.image,
      category: p.category || "all",
      stock: 100,
      published: true,
    }))
  );

  console.log("✅ Demo store seeded at /s/green-basket");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
