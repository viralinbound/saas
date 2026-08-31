import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { planGate } from "@/lib/plan";
import { PLANS } from "@/lib/constants";

export async function GET() {
  const org = await getCurrentOrg();
  if (!org) return NextResponse.json({ gate: planGate("free"), org: null });
  return NextResponse.json({
    gate: planGate(org.plan),
    org: { id: org.id, name: org.name, plan: org.plan, planStatus: org.planStatus },
  });
}

const schema = z.object({
  plan: z.enum(["free", "essential", "pro", "elite", "plus"]),
  // Payment-gateway callback fields. In this build there is no live gateway —
  // the plan is activated directly. Wire Razorpay/Stripe here: verify the
  // signature/session server-side, then call set_organization_plan.
  paymentRef: z.string().optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { plan, paymentRef } = schema.parse(await req.json());
    const amount = (PLANS[plan]?.price ?? 0) * 100; // paise

    const { data, error } = await supabase.rpc("set_organization_plan", {
      p_plan: plan,
      p_payment_ref: paymentRef ?? `demo_${Date.now()}`,
      p_amount_paise: amount,
    });

    if (error) {
      const msg = error.message.includes("NO_ORG_OR_FORBIDDEN")
        ? "Only an owner or admin can change the plan."
        : error.message.includes("INVALID_PLAN")
          ? "Unknown plan."
          : error.message;
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
