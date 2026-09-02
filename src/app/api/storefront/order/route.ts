import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ERR: Record<string, string> = {
  LOGIN_REQUIRED: "Please sign in to place your order.",
  STORE_NOT_AVAILABLE: "This store isn't taking orders right now.",
  STORE_NOT_FOUND: "Store not found.",
  EMPTY_CART: "Your cart is empty.",
  INVALID_PRODUCT: "One of the items is no longer available.",
  INSUFFICIENT_STOCK: "One of the items just went out of stock.",
  PHONE_REQUIRED: "Add a mobile number so we can send order updates.",
  ADDRESS_REQUIRED: "Add a delivery address.",
};

const item = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().int().nonnegative(), // paise
  quantity: z.number().int().positive(),
  variant: z.string().optional().nullable(),
});

const placeSchema = z.object({
  slug: z.string().min(1),
  token: z.string().min(1),
  paymentMethod: z.string().optional(),
  address: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      line: z.string().optional(),
      city: z.string().optional(),
      pincode: z.string().optional(),
    })
    .optional(),
  items: z.array(item).min(1),
});

function mapError(message: string) {
  const key = Object.keys(ERR).find((k) => message.includes(k));
  return key ? ERR[key] : "Could not place the order. Please try again.";
}

// Place an order — requires a storefront-customer session token.
export async function POST(req: Request) {
  const supabase = await createClient();

  let body: z.infer<typeof placeSchema>;
  try {
    body = placeSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("storefront_place_order", {
    p_slug: body.slug,
    p_token: body.token,
    p_payment_method: body.paymentMethod ?? "cod",
    p_items: body.items,
    p_address: body.address ?? {},
  });

  if (error) {
    const status = error.message.includes("LOGIN_REQUIRED") ? 401 : 400;
    return NextResponse.json({ error: mapError(error.message) }, { status });
  }
  return NextResponse.json(data);
}

// The signed-in shopper's order history for this store.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const token = searchParams.get("token");
  if (!slug || !token) return NextResponse.json({ orders: [] });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("storefront_my_orders", { p_slug: slug, p_token: token });
  if (error) {
    const status = error.message.includes("LOGIN_REQUIRED") ? 401 : 400;
    return NextResponse.json({ error: mapError(error.message), orders: [] }, { status });
  }
  return NextResponse.json({ orders: data ?? [] });
}
