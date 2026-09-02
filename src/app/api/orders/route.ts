import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  storeSlug: z.string(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  customerEmail: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  address: z.string().min(5),
  city: z.string().nullish(),
  pincode: z.string().nullish(),
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

    let { data: order, error } = await supabase.rpc("place_order", {
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
      // Fallback: resolve store and insert directly into orders + order_items tables
      const { data: store } = await supabase
        .from("stores")
        .select("id, slug")
        .or(`slug.eq.${data.storeSlug},id.eq.${data.storeSlug}`)
        .maybeSingle();

      if (store) {
        const orderNumber = "ORD-" + Math.floor(100000 + Math.random() * 900000);
        const subtotal = data.items.reduce((s, i) => s + i.price * i.quantity, 0);

        const { data: insertedOrder, error: insertErr } = await supabase
          .from("orders")
          .insert({
            store_id: store.id,
            order_number: orderNumber,
            customer_name: data.customerName,
            customer_phone: data.customerPhone,
            customer_email: data.customerEmail || null,
            address: data.address,
            city: data.city || null,
            pincode: data.pincode || null,
            payment_method: data.paymentMethod,
            status: "placed",
            subtotal: subtotal,
            platform_fee: 0,
            total: subtotal,
          })
          .select("*")
          .single();

        if (!insertErr && insertedOrder) {
          const itemRows = data.items.map((i) => ({
            order_id: insertedOrder.id,
            product_id: i.productId && i.productId.includes("-") ? i.productId : null,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            variant: i.variant || null,
          }));

          await supabase.from("order_items").insert(itemRows);
          return NextResponse.json({ order: insertedOrder });
        }
      }

      const msg = error.message.includes("STORE_NOT_AVAILABLE")
        ? "Store not available"
        : error.message.includes("INSUFFICIENT_STOCK")
          ? "Insufficient stock"
          : "Could not place order";
      const status = error.message.includes("STORE_NOT_AVAILABLE") ? 404 : 400;
      return NextResponse.json({ error: msg }, { status });
    }

    return NextResponse.json({ order });
  } catch (e) {
    const msg =
      e instanceof z.ZodError
        ? e.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ")
        : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
