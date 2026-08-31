"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

export function TrackView({ storeSlug, productId }: { storeSlug: string; productId?: string }) {
  useEffect(() => {
    track(storeSlug, productId ? "product_view" : "page_view", { productId });
  }, [storeSlug, productId]);
  return null;
}
