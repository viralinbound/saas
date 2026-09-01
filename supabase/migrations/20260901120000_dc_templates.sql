-- ═══════════════════════════════════════════════════════════════════════════
-- 20260901120000_dc_templates
-- The six starter templates are now the redesigned .dc layouts
-- (src/lib/layoutPreviews.ts). Refresh the picker metadata — name, accent,
-- thumbnail, promo, one-liner — to match. The full editable config is built
-- at runtime by seedStarterConfig(); `config` here is just a marker.
--
-- Idempotent. Only touches the 6 rows in public.templates — a merchant's
-- store_customizations / products / orders are never affected. Plan tiering
-- (min_plan / tier_label / is_premium) is left exactly as set by
-- 20260827140000_premium_templates.
-- ═══════════════════════════════════════════════════════════════════════════

update public.templates set
  name          = 'apparel & fashion',
  category      = 'retail',
  industry      = 'apparel',
  description   = 'boutiques and labels with size and colour runs, lookbook photography and an exchange policy to explain.',
  thumbnail_url = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&auto=format&fit=crop',
  accent_color  = '#98502F',
  announcement  = 'festive drop · 30% off ethnic',
  config        = '{"starter":true}'::jsonb,
  sort_order    = 1,
  is_active     = true
where key = 'fashion';

update public.templates set
  name          = 'bakery & café',
  category      = 'food',
  industry      = 'bakery',
  description   = 'bakeries and cloud kitchens with a menu that changes daily, slot-based delivery and celebration cake orders.',
  thumbnail_url = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop',
  accent_color  = '#C2410C',
  announcement  = 'order by 9pm for morning delivery',
  config        = '{"starter":true}'::jsonb,
  sort_order    = 2,
  is_active     = true
where key = 'bakery';

update public.templates set
  name          = 'organic skincare',
  category      = 'beauty',
  industry      = 'skincare',
  description   = 'skincare and wellness brands selling on ingredients, routines and repeat refills rather than one-off buys.',
  thumbnail_url = 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&auto=format&fit=crop',
  accent_color  = '#2F6B4F',
  announcement  = 'routine builder · save 15% on any 3',
  config        = '{"starter":true}'::jsonb,
  sort_order    = 3,
  is_active     = true
where key = 'skincare';

update public.templates set
  name          = 'kirana & grocery',
  category      = 'grocery',
  industry      = 'grocery',
  description   = 'grocers and kirana stores with hundreds of skus, weight-based pricing and buyers who reorder every week.',
  thumbnail_url = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop',
  accent_color  = '#3F8F29',
  announcement  = 'order before 2pm · same-day delivery',
  config        = '{"starter":true}'::jsonb,
  sort_order    = 4,
  is_active     = true
where key = 'kirana';

update public.templates set
  name          = 'tech & gadgets',
  category      = 'electronics',
  industry      = 'electronics',
  description   = 'electronics sellers whose buyers compare specs, ask about warranty and want emi before they add to cart.',
  thumbnail_url = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop',
  accent_color  = '#4F7BFF',
  announcement  = 'launch week · flat ₹500 off + no-cost emi',
  config        = '{"starter":true}'::jsonb,
  sort_order    = 5,
  is_active     = true
where key = 'tech';

update public.templates set
  name          = 'gold & jewellery',
  category      = 'jewellery',
  industry      = 'jewellery',
  description   = 'jewellers selling high-ticket pieces where purity proof, try-on and an appointment close the sale.',
  thumbnail_url = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&auto=format&fit=crop',
  accent_color  = '#8A6A17',
  announcement  = 'bis hallmarked · insured delivery · try at home',
  config        = '{"starter":true}'::jsonb,
  sort_order    = 6,
  is_active     = true
where key = 'jewels';

-- retire any non-.dc template rows shipped earlier so the gallery is exactly six
update public.templates set is_active = false
where key not in ('fashion','bakery','skincare','kirana','tech','jewels');

insert into public.schema_meta (key, value)
values ('version', to_jsonb('2026.09.01-01_dc_templates'::text))
on conflict (key) do update set value = excluded.value, updated_at = now();
