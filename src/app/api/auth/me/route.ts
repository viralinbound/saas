import { NextResponse } from "next/server";
import { getAuthState } from "@/lib/auth-state";

export async function GET() {
  const state = await getAuthState();
  return NextResponse.json(state);
}
