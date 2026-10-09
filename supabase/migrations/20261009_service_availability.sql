-- Private, audited controls for customer booking and ordering channels.
create table if not exists public.service_availability (
  id integer primary key check (id = 1),
  data jsonb not null,
  revision integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.service_availability enable row level security;
revoke all on table public.service_availability from anon, authenticated;
grant select on table public.service_availability to service_role;

insert into public.service_availability(id, data)
select 1, jsonb_build_object(
  'channels', jsonb_build_object(
    'table', jsonb_build_object(
      'enabled', coalesce((select booking_enabled from public.restaurant_booking_settings where id = 1), true),
      'message', case when not coalesce((select booking_enabled from public.restaurant_booking_settings where id = 1), true) then 'Online table booking is temporarily paused. Please contact the restaurant.' else '' end
    ),
    'hall', jsonb_build_object('enabled', true, 'message', ''),
    'collection', jsonb_build_object('enabled', true, 'message', ''),
    'delivery', jsonb_build_object('enabled', true, 'message', '')
  ),
  'closures', '[]'::jsonb
)
on conflict (id) do nothing;

-- Service availability is now the single operational switch. Preserve a legacy
-- paused table state above, then keep this older capacity-settings flag enabled.
update public.restaurant_booking_settings set booking_enabled = true where id = 1;

create or replace function public.admin_update_service_availability(
  p_data jsonb,
  p_expected_revision integer,
  p_actor_user_id uuid
)
returns boolean language plpgsql security definer set search_path = public as $$
declare actor_email text; actor_role text; affected integer;
begin
  select email, role into actor_email, actor_role from public.admin_profiles
    where user_id = p_actor_user_id and is_active and role in ('owner','admin','manager');
  if not found then return false; end if;
  if jsonb_typeof(p_data->'channels') <> 'object'
    or jsonb_typeof(p_data->'closures') <> 'array'
    or not (p_data->'channels' ?& array['table','hall','collection','delivery']) then
    return false;
  end if;
  update public.service_availability
    set data = p_data - 'revision', revision = revision + 1, updated_at = now()
    where id = 1 and revision = p_expected_revision;
  get diagnostics affected = row_count;
  if affected = 0 then return false; end if;
  insert into public.admin_audit_log(actor_user_id,actor_email,actor_role,action,target_type,target_id,metadata)
    values(p_actor_user_id,actor_email,actor_role,'service.availability.updated','service_availability','1',jsonb_build_object('revision',p_expected_revision + 1,'channels',p_data->'channels','closureCount',jsonb_array_length(p_data->'closures')));
  return true;
end $$;
revoke all on function public.admin_update_service_availability(jsonb,integer,uuid) from public;
grant execute on function public.admin_update_service_availability(jsonb,integer,uuid) to service_role;

insert into public.app_schema_versions(version, description)
values ('2026-10-09-service-availability-v9', 'Audited immediate and scheduled controls for table, hall, collection and delivery channels')
on conflict (version) do nothing;

create or replace function public.order_database_health()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'version', '2026-10-09-service-availability-v9',
    'ordersTable', to_regclass('public.orders') is not null,
    'paymentEventsTable', to_regclass('public.order_payment_events') is not null,
    'adminProfilesTable', to_regclass('public.admin_profiles') is not null,
    'adminAuditLogTable', to_regclass('public.admin_audit_log') is not null,
    'reservationsTable', to_regclass('public.table_reservations') is not null,
    'hallEnquiriesTable', to_regclass('public.hall_enquiries') is not null,
    'emailDeliveryLogTable', to_regclass('public.email_delivery_log') is not null,
    'restaurantScheduleTable', to_regclass('public.restaurant_schedule') is not null,
    'careerOpportunitiesTable', to_regclass('public.career_opportunities') is not null,
    'discountCodesTable', to_regclass('public.discount_codes') is not null,
    'serviceAvailabilityTable', to_regclass('public.service_availability') is not null
  );
$$;
revoke all on function public.order_database_health() from public;
grant execute on function public.order_database_health() to service_role;

