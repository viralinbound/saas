-- ═══════════════════════════════════════════════════════════════════════════
-- 20260827140000_premium_templates
-- Template access is tiered by plan. Every company sees all templates in the
-- gallery, but can only APPLY / PUBLISH ones at or below its plan. New premium
-- templates shipped later become available automatically to plans that qualify.
--
-- Isolation reminder: a template a company applies is written to
-- store_customizations (organization_id, RLS = is_org_member). One company's
-- edits, drafts, published config, products and orders are all partitioned by
-- organization_id and unreachable by any other company.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.templates add column if not exists min_plan   text not null default 'free';
alter table public.templates add column if not exists tier_label text;

do $$ begin
  alter table public.templates
    add constraint templates_min_plan_check
    check (min_plan in ('free','essential','pro','elite','plus'));
exception when duplicate_object then null; end $$;

-- ─── plan ranking helpers ────────────────────────────────────────────────
create or replace function public.plan_rank(p_plan text)
returns int
language sql
immutable
as $$
  select case coalesce(p_plan,'free')
    when 'free' then 0 when 'essential' then 1 when 'pro' then 2
    when 'elite' then 3 when 'plus' then 4 else 0 end;
$$;

create or replace function public.can_use_template(p_template_key text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_min text;
  v_plan text;
begin
  select min_plan into v_min from public.templates where key = p_template_key and is_active = true;
  if v_min is null then return false; end if;

  select o.plan into v_plan
  from public.organizations o
  join public.organization_members m on m.organization_id = o.id
  where m.user_id = auth.uid() and m.status = 'active'
  order by o.created_at asc
  limit 1;

  return public.plan_rank(coalesce(v_plan,'free')) >= public.plan_rank(v_min);
end;
$$;

grant execute on function public.plan_rank(text)          to anon, authenticated;
grant execute on function public.can_use_template(text)   to anon, authenticated;

-- ─── save_store_draft: block applying a template the plan can't use ──────
create or replace function public.save_store_draft(
  p_store_id uuid,
  p_draft_config jsonb,
  p_theme_tokens jsonb default null,
  p_template_key text default null
)
returns public.store_customizations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org uuid;
  v_row public.store_customizations;
begin
  select organization_id into v_org from public.stores where id = p_store_id;
  if v_org is null then raise exception 'STORE_NOT_FOUND'; end if;
  if not public.is_org_member(v_org) then raise exception 'FORBIDDEN'; end if;

  if p_template_key is not null
     and exists (select 1 from public.templates where key = p_template_key)
     and not public.can_use_template(p_template_key) then
    raise exception 'TEMPLATE_LOCKED';
  end if;

  insert into public.store_customizations (
    store_id, organization_id, template_key, draft_config, theme_tokens, draft_updated_by
  ) values (
    p_store_id, v_org, p_template_key, coalesce(p_draft_config, '{}'::jsonb),
    coalesce(p_theme_tokens, '{}'::jsonb), auth.uid()
  )
  on conflict (store_id) do update set
    draft_config     = coalesce(p_draft_config, public.store_customizations.draft_config),
    theme_tokens     = coalesce(p_theme_tokens, public.store_customizations.theme_tokens),
    template_key     = coalesce(p_template_key, public.store_customizations.template_key),
    draft_updated_by = auth.uid(),
    updated_at       = now()
  returning * into v_row;

  update public.stores
    set draft_updated_at = now(),
        template_key = coalesce(p_template_key, template_key)
    where id = p_store_id;

  return v_row;
end;
$$;

grant execute on function public.save_store_draft(uuid, jsonb, jsonb, text) to authenticated;

-- ─── tier the seeded templates ─────────────────────────────────────────
update public.templates set min_plan = 'free',      tier_label = null      where key in ('fashion','bakery');
update public.templates set min_plan = 'essential', tier_label = 'Essential', is_premium = true where key in ('skincare','kirana');
update public.templates set min_plan = 'pro',       tier_label = 'Pro',       is_premium = true where key = 'tech';
update public.templates set min_plan = 'elite',     tier_label = 'Elite',     is_premium = true where key = 'jewels';

insert into public.schema_meta (key, value)
values ('version', to_jsonb('2026.08.27-06_premium_templates'::text))
on conflict (key) do update set value = excluded.value, updated_at = now();
