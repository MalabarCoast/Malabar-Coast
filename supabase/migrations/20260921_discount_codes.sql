-- Private, administrator-managed checkout discount codes.
create table if not exists public.discount_codes (
  id text primary key,
  code text not null,
  percent_off smallint not null check (percent_off between 1 and 99),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null,
  constraint discount_codes_id_format check (id ~ '^dsc_[A-Za-z0-9_-]{16,80}$'),
  constraint discount_codes_code_format check (code ~ '^[A-Z0-9]{3,32}$')
);
create unique index if not exists discount_codes_active_code_uidx on public.discount_codes(code) where deleted_at is null;
create index if not exists discount_codes_active_updated_idx on public.discount_codes(is_active, updated_at desc) where deleted_at is null;
alter table public.discount_codes enable row level security;
revoke all on table public.discount_codes from anon, authenticated;
grant select on table public.discount_codes to service_role;

create or replace function public.admin_save_discount_code(
  p_id text,
  p_code text,
  p_percent_off integer,
  p_is_active boolean,
  p_actor_user_id uuid
)
returns boolean language plpgsql security definer set search_path = public as $$
declare actor_email text; actor_role text; affected integer; normalized_code text;
begin
  select email, role into actor_email, actor_role from public.admin_profiles
    where user_id = p_actor_user_id and is_active and role in ('owner','admin');
  if not found then return false; end if;
  normalized_code := upper(trim(p_code));
  if p_id !~ '^dsc_[A-Za-z0-9_-]{16,80}$' or normalized_code !~ '^[A-Z0-9]{3,32}$' or p_percent_off not between 1 and 99 then return false; end if;
  begin
    insert into public.discount_codes(id, code, percent_off, is_active)
    values(p_id, normalized_code, p_percent_off, p_is_active)
    on conflict (id) do update set code = excluded.code, percent_off = excluded.percent_off, is_active = excluded.is_active, updated_at = now()
      where public.discount_codes.deleted_at is null;
  exception when unique_violation then
    return false;
  end;
  get diagnostics affected = row_count;
  if affected = 0 then return false; end if;
  insert into public.admin_audit_log(actor_user_id,actor_email,actor_role,action,target_type,target_id,metadata)
    values(p_actor_user_id,actor_email,actor_role,'discount.saved','discount_code',p_id,jsonb_build_object('code',normalized_code,'percentOff',p_percent_off,'active',p_is_active));
  return true;
end $$;
revoke all on function public.admin_save_discount_code(text,text,integer,boolean,uuid) from public;
grant execute on function public.admin_save_discount_code(text,text,integer,boolean,uuid) to service_role;

create or replace function public.admin_delete_discount_code(p_id text, p_actor_user_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare actor_email text; actor_role text; previous_code text; previous_percent integer;
begin
  select email, role into actor_email, actor_role from public.admin_profiles
    where user_id = p_actor_user_id and is_active and role in ('owner','admin');
  if not found then return false; end if;
  select code, percent_off into previous_code, previous_percent from public.discount_codes where id = p_id and deleted_at is null for update;
  if not found then return false; end if;
  update public.discount_codes set is_active = false, deleted_at = now(), deleted_by = p_actor_user_id, updated_at = now() where id = p_id;
  insert into public.admin_audit_log(actor_user_id,actor_email,actor_role,action,target_type,target_id,metadata)
    values(p_actor_user_id,actor_email,actor_role,'discount.deleted','discount_code',p_id,jsonb_build_object('code',previous_code,'percentOff',previous_percent,'retained',true));
  return true;
end $$;
revoke all on function public.admin_delete_discount_code(text,uuid) from public;
grant execute on function public.admin_delete_discount_code(text,uuid) to service_role;

insert into public.app_schema_versions(version, description)
values ('2026-09-21-discount-codes-v8', 'Private administrator discount-code CRUD and checkout redemption')
on conflict (version) do nothing;

create or replace function public.order_database_health()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'version', '2026-09-21-discount-codes-v8',
    'ordersTable', to_regclass('public.orders') is not null,
    'paymentEventsTable', to_regclass('public.order_payment_events') is not null,
    'adminProfilesTable', to_regclass('public.admin_profiles') is not null,
    'adminAuditLogTable', to_regclass('public.admin_audit_log') is not null,
    'reservationsTable', to_regclass('public.table_reservations') is not null,
    'hallEnquiriesTable', to_regclass('public.hall_enquiries') is not null,
    'emailDeliveryLogTable', to_regclass('public.email_delivery_log') is not null,
    'restaurantScheduleTable', to_regclass('public.restaurant_schedule') is not null,
    'careerOpportunitiesTable', to_regclass('public.career_opportunities') is not null,
    'discountCodesTable', to_regclass('public.discount_codes') is not null
  );
$$;
revoke all on function public.order_database_health() from public;
grant execute on function public.order_database_health() to service_role;
