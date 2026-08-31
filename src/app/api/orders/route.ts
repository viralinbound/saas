import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  storeSlug: z.string(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(10),
  customerEmail: z.string().email().optional(),
  address: z.string().min(5),
  city: z.string().optional(),
  pincode: z.string().optional(),
  paymentMethod: z.enum(["cod", "upi", "card"]).default("cod"),
  deliverySlot: z.string().nullish(),
  customEngraving: z.string().nullish(),
  giftWrapped: z.boolean().optional(),
  discountAmount: z.number().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        name: z.string(),
        price: z.number().int(),
        quantity: z.number().int().positive(),
        variant: z.string().nullish(),
        engraving: z.string().nullish(),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const supabase = await createClient();

    const { data: order, error } = await supabase.rpc("place_order", {
      p_store_slug: data.storeSlug,
      p_customer_name: data.customerName,
      p_customer_phone: data.customerPhone,
      p_customer_email: data.customerEmail || null,
      p_address: data.address,
      p_city: data.city || null,
      p_pincode: data.pincode || null,
      p_payment_method: data.paymentMethod,
      p_items: data.items,
    });

    if (error) {
      const msg = error.message.includes("STORE_NOT_AVAILABLE")
        ? "Store not available"
        : error.message.includes("INSUFFICIENT_STOCK")
          ? "Insufficient stock"
          : "Could not place order";
      const status = error.message.includes("STORE_NOT_AVAILABLE") ? 404 : 400;
      return NextResponse.json({ error: msg }, { status });
    }

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
