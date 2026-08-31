import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/constants";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("slug") || "";
  const slug = slugify(raw);
  if (!slug || slug.length < 3) {
    return NextResponse.json({ available: false, slug, error: "URL must be at least 3 characters" });
  }

  const supabase = await createClient();
  const { data: available, error } = await supabase.rpc("is_slug_available", { p_slug: slug });
  if (error) {
    return NextResponse.json({ available: false, slug, error: error.message });
  }
  return NextResponse.json({ available: !!available, slug });
}
