-- ═══════════════════════════════════════════════════════════════════════════
-- 20260829150000_refresh_template_copy
-- Align the templates table (accent colour + one-line description shown in the
-- picker) with the finished code presets in src/lib/templatePresets.ts.
-- Idempotent; never touches a merchant's store_customizations.
-- ═══════════════════════════════════════════════════════════════════════════

update public.templates set accent_color = '#101010',
  description = 'Editorial monochrome layout for a considered apparel wardrobe.'
  where key = 'fashion';

update public.templates set accent_color = '#B4531E',
  description = 'Warm, hand-made bakery look with same-day delivery messaging.'
  where key = 'bakery';

update public.templates set accent_color = '#2F7D5B',
  description = 'Clean ingredient-led skincare layout with clinical trust cues.'
  where key = 'skincare';

update public.templates set accent_color = '#1E8E3E',
  description = 'Bright everyday-essentials grocery store with fast-delivery banners.'
  where key = 'kirana';

update public.templates set accent_color = '#6D28D9',
  description = 'Sharp spec-forward electronics store with warranty & EMI badges.'
  where key = 'tech';

update public.templates set accent_color = '#8A6D1D',
  description = 'Refined hallmarked jewellery layout with transparent pricing.'
  where key = 'jewels';

insert into public.schema_meta (key, value)
values ('version', to_jsonb('2026.08.29-14_refresh_template_copy'::text))
on conflict (key) do update set value = excluded.value, updated_at = now();
