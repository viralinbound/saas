import { NextResponse } from "next/server";

export async function GET() {
  try {
    const headers = {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    };
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers,
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      return NextResponse.json({ email: true, phone: false });
    }
    const data = await res.json();
    return NextResponse.json({
      email: data.external?.email !== false,
      phone: data.external?.phone === true,
      smsProvider: data.sms_provider || null,
    });
  } catch {
    return NextResponse.json({ email: true, phone: false });
  }
}
