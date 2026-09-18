-- Restaurant calendar and careers. Apply before deploying the matching app release.
create table if not exists public.restaurant_schedule (
  id integer primary key check (id = 1),
  data jsonb not null,
  revision integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.restaurant_schedule enable row level security;
revoke all on public.restaurant_schedule from anon, authenticated;
grant select on public.restaurant_schedule to service_role;
insert into public.restaurant_schedule(id, data) values (1, '{"weekly":[{"closed":false,"opens":"11:00","closes":"15:00","secondOpens":"16:00","secondCloses":"21:00"},{"closed":true,"opens":"","closes":"","secondOpens":"","secondCloses":""},{"closed":false,"opens":"11:00","closes":"15:00","secondOpens":"16:00","secondCloses":"21:00"},{"closed":false,"opens":"11:00","closes":"15:00","secondOpens":"16:00","secondCloses":"21:00"},{"closed":false,"opens":"11:00","closes":"15:00","secondOpens":"16:00","secondCloses":"22:00"},{"closed":false,"opens":"11:00","closes":"22:00","secondOpens":"","secondCloses":""},{"closed":false,"opens":"11:00","closes":"15:00","secondOpens":"16:00","secondCloses":"22:00"}],"exceptions":[]}'::jsonb)
on conflict (id) do nothing;

create or replace function public.admin_update_restaurant_schedule(p_data jsonb, p_expected_revision integer, p_actor_user_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare actor_email text; actor_role text; affected integer;
begin
  select email, role into actor_email, actor_role from public.admin_profiles where user_id = p_actor_user_id and is_active and role in ('owner','admin','manager');
  if not found then return false; end if;
  if jsonb_typeof(p_data->'weekly') <> 'array' or jsonb_array_length(p_data->'weekly') <> 7 or jsonb_typeof(p_data->'exceptions') <> 'array' then return false; end if;
  update public.restaurant_schedule set data = p_data - 'revision', revision = revision + 1, updated_at = now() where id = 1 and revision = p_expected_revision;
  get diagnostics affected = row_count;
  if affected = 0 then return false; end if;
  insert into public.admin_audit_log(actor_user_id,actor_email,actor_role,action,target_type,target_id,metadata)
  values(p_actor_user_id,actor_email,actor_role,'restaurant.schedule.updated','restaurant_schedule','1',jsonb_build_object('revision',p_expected_revision + 1));
  return true;
end $$;
revoke all on function public.admin_update_restaurant_schedule(jsonb,integer,uuid) from public;
grant execute on function public.admin_update_restaurant_schedule(jsonb,integer,uuid) to service_role;

create table if not exists public.career_opportunities (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint career_id_format check (id ~ '^job_[A-Za-z0-9_-]{16,80}$')
);
create index if not exists career_opportunities_created_idx on public.career_opportunities(created_at desc);
alter table public.career_opportunities enable row level security;
revoke all on public.career_opportunities from anon, authenticated;
grant select on public.career_opportunities to service_role;

create or replace function public.admin_save_career_opportunity(p_data jsonb, p_actor_user_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare actor_email text; actor_role text; job_id text;
begin
  select email, role into actor_email, actor_role from public.admin_profiles where user_id = p_actor_user_id and is_active and role in ('owner','admin');
  if not found then return false; end if;
  job_id := p_data->>'id';
  if job_id !~ '^job_[A-Za-z0-9_-]{16,80}$' or p_data->>'status' not in ('draft','published','closed') then return false; end if;
  insert into public.career_opportunities(id,data) values(job_id,p_data)
  on conflict (id) do update set data = jsonb_set(excluded.data,'{createdAt}',coalesce(public.career_opportunities.data->'createdAt',to_jsonb(public.career_opportunities.created_at::text))), updated_at = now();
  insert into public.admin_audit_log(actor_user_id,actor_email,actor_role,action,target_type,target_id,metadata)
  values(p_actor_user_id,actor_email,actor_role,'career.saved','career_opportunity',job_id,jsonb_build_object('status',p_data->>'status'));
  return true;
end $$;
revoke all on function public.admin_save_career_opportunity(jsonb,uuid) from public;
grant execute on function public.admin_save_career_opportunity(jsonb,uuid) to service_role;

insert into public.app_schema_versions(version, description)
values ('2026-09-14-schedule-careers-v7', 'Restaurant opening calendar and career opportunity publishing')
on conflict (version) do nothing;

create or replace function public.order_database_health()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'version', '2026-09-14-schedule-careers-v7',
    'ordersTable', to_regclass('public.orders') is not null,
    'paymentEventsTable', to_regclass('public.order_payment_events') is not null,
    'adminProfilesTable', to_regclass('public.admin_profiles') is not null,
    'adminAuditLogTable', to_regclass('public.admin_audit_log') is not null,
    'reservationsTable', to_regclass('public.table_reservations') is not null,
    'hallEnquiriesTable', to_regclass('public.hall_enquiries') is not null,
    'emailDeliveryLogTable', to_regclass('public.email_delivery_log') is not null,
    'restaurantScheduleTable', to_regclass('public.restaurant_schedule') is not null,
    'careerOpportunitiesTable', to_regclass('public.career_opportunities') is not null
  );
$$;
revoke all on function public.order_database_health() from public;
grant execute on function public.order_database_health() to service_role;
