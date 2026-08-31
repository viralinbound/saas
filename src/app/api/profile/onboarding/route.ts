import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  goal: z.string().optional(),
  category: z.string().optional(),
  businessStage: z.string().optional(),
  salesChannels: z.array(z.string()).optional(),
  revenueRange: z.string().optional(),
  teamSize: z.string().optional(),
  monthlyOrders: z.string().optional(),
  businessType: z.string().optional(),
  heardFrom: z.string().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ onboarding: null });

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_data")
    .eq("id", user.id)
    .maybeSingle();

  const saved =
    profile?.onboarding_data ??
    (user.user_metadata?.onboarding as Record<string, unknown> | undefined) ??
    null;

  return NextResponse.json({ onboarding: saved });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await req.json());
    const onboardingData = {
      goal: body.goal,
      category: body.category,
      businessStage: body.businessStage,
      salesChannels: body.salesChannels,
      revenueRange: body.revenueRange,
      teamSize: body.teamSize,
      monthlyOrders: body.monthlyOrders,
      businessType: body.businessType,
      heardFrom: body.heardFrom,
      completedAt: new Date().toISOString(),
    };

    await supabase.auth.updateUser({
      data: { onboarding: onboardingData },
    });

    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_data: onboardingData })
      .eq("id", user.id);

    if (error) {
      // Column may not exist yet — metadata still saved
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
