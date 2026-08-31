import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { resolveActiveStoreId } from "@/lib/activeStore";

const BUCKET = "store-media";
const MAX_BYTES = 50 * 1024 * 1024;
const MIME_KIND: Record<string, "image" | "video" | "file"> = {
  "image/png": "image", "image/jpeg": "image", "image/webp": "image", "image/gif": "image",
  "image/svg+xml": "image", "image/avif": "image",
  "video/mp4": "video", "video/webm": "video", "video/quicktime": "video",
  "application/pdf": "file",
};

async function ctx() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const org = await getCurrentOrg();
  if (!org) return null;
  const storeId = await resolveActiveStoreId();
  if (!storeId) return null;
  return { supabase, user, org, storeId };
}

export async function GET() {
  const c = await ctx();
  if (!c) return NextResponse.json({ error: "No store" }, { status: 404 });
  const { data } = await c.supabase
    .from("store_media")
    .select("id, path, url, kind, mime, bytes, alt, created_at")
    .eq("store_id", c.storeId)
    .order("created_at", { ascending: false });
  return NextResponse.json({ media: data ?? [] });
}

export async function POST(req: Request) {
  const c = await ctx();
  if (!c) return NextResponse.json({ error: "No store" }, { status: 404 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof Blob)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File is larger than 50 MB." }, { status: 413 });

  const mime = file.type || "application/octet-stream";
  const kind = MIME_KIND[mime];
  if (!kind) return NextResponse.json({ error: `Unsupported file type: ${mime}` }, { status: 415 });

  const name = (file as File).name || "upload";
  const ext = (name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  // path: <org>/<store>/<uuid>.<ext> — the storage RLS policy checks folder[1] = org id
  const path = `${c.org.id}/${c.storeId}/${crypto.randomUUID()}.${ext}`;

  const buf = new Uint8Array(await file.arrayBuffer());
  const up = await c.supabase.storage.from(BUCKET).upload(path, buf, { contentType: mime, upsert: false });
  if (up.error) return NextResponse.json({ error: up.error.message }, { status: 400 });

  const { data: pub } = c.supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data: row, error } = await c.supabase
    .from("store_media")
    .insert({
      store_id: c.storeId,
      organization_id: c.org.id,
      path,
      url: pub.publicUrl,
      kind,
      mime,
      bytes: file.size,
      created_by: c.user.id,
    })
    .select("id, path, url, kind, mime, bytes, alt, created_at")
    .single();
  if (error) {
    await c.supabase.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, media: row });
}

export async function DELETE(req: Request) {
  const c = await ctx();
  if (!c) return NextResponse.json({ error: "No store" }, { status: 404 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: row } = await c.supabase
    .from("store_media")
    .select("id, path")
    .eq("id", id)
    .eq("store_id", c.storeId)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await c.supabase.storage.from(BUCKET).remove([row.path]);
  await c.supabase.from("store_media").delete().eq("id", row.id);
  return NextResponse.json({ ok: true });
}
