-- ═══════════════════════════════════════════════════════════════════════════
-- 20260827120300_seed_templates
-- Seeds the 6 built-in starter templates (mirrors src/lib/constants.ts THEMES).
-- Idempotent: re-running refreshes copy but never duplicates and never wipes
-- a merchant's customised store_customizations rows.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.templates (key, name, category, industry, description, thumbnail_url, accent_color, announcement, sort_order, config)
values
  ('fashion',  'Luxe Apparel & Fashion',   'retail',      'apparel',     'Editorial hero, lookbook grid, size-guide ready.',
     'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&auto=format&fit=crop', '#0052FF',
     '✨ GET FLAT 15% OFF WITH CODE: LAUNCH15', 1,
     '{"sections":[{"type":"announcement"},{"type":"hero"},{"type":"featured_products"},{"type":"lookbook"},{"type":"newsletter"},{"type":"footer"}]}'::jsonb),
  ('bakery',   'Artisan Bakery & Café',    'food',        'bakery',      'Warm hero, same-day delivery banner, menu grid.',
     'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop', '#B45309',
     '🥐 FRESH BATCH OUT OF OVEN — SAME DAY DELIVERY', 2,
     '{"sections":[{"type":"announcement"},{"type":"hero"},{"type":"menu_grid"},{"type":"story"},{"type":"footer"}]}'::jsonb),
  ('skincare', 'Glow Organic Skincare',    'beauty',      'skincare',    'Ingredient-led layout, routine builder, reviews.',
     'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&auto=format&fit=crop', '#059669',
     '🌿 100% DERMATOLOGIST-FORMULATED · TOXIN-FREE', 3,
     '{"sections":[{"type":"announcement"},{"type":"hero"},{"type":"benefits"},{"type":"featured_products"},{"type":"reviews"},{"type":"footer"}]}'::jsonb),
  ('kirana',   'Fresh Mart & Kirana',      'grocery',     'grocery',     'Category tiles, delivery-slot picker, essentials rail.',
     'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop', '#16A34A',
     '🥦 FARM TO TABLE · 3-HOUR DELIVERY', 4,
     '{"sections":[{"type":"announcement"},{"type":"category_tiles"},{"type":"featured_products"},{"type":"delivery_info"},{"type":"footer"}]}'::jsonb),
  ('tech',     'Cyber Tech & Gadgets',     'electronics', 'electronics', 'Spec-forward cards, EMI badge, comparison block.',
     'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop', '#7C3AED',
     '⚡ OFFICIAL WARRANTY · NO COST EMI', 5,
     '{"sections":[{"type":"announcement"},{"type":"hero"},{"type":"featured_products"},{"type":"spec_compare"},{"type":"footer"}]}'::jsonb),
  ('jewels',   'Royal Gold & Jewellery',   'jewellery',   'jewellery',   'Dark luxe palette, hallmark trust bar, collection carousel.',
     'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&auto=format&fit=crop', '#B8860B',
     '💎 BIS HALLMARKED GOLD · INSURED TRANSIT', 6,
     '{"sections":[{"type":"announcement"},{"type":"hero"},{"type":"collection_carousel"},{"type":"trust_bar"},{"type":"footer"}]}'::jsonb)
on conflict (key) do update set
  name         = excluded.name,
  category     = excluded.category,
  industry     = excluded.industry,
  description  = excluded.description,
  thumbnail_url= excluded.thumbnail_url,
  accent_color = excluded.accent_color,
  announcement = excluded.announcement,
  sort_order   = excluded.sort_order,
  config       = excluded.config,
  updated_at   = now();
