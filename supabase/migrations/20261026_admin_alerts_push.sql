-- Durable staff alerts and leased Web Push outbox. Apply before the matching app.
begin;

create table if not exists public.admin_alerts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('order','reservation','hall')),
  record_id text not null,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid references auth.users(id) on delete set null,
  unique(kind,record_id)
);
create table if not exists public.admin_push_subscriptions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_version integer not null,
  session_hash text not null,
  subscription jsonb not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.admin_push_deliveries (
  alert_id uuid not null references public.admin_alerts(id) on delete cascade,
  subscription_id text not null references public.admin_push_subscriptions(id) on delete cascade,
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  lease_token uuid,
  leased_until timestamptz,
  delivered_at timestamptz,
  primary key(alert_id,subscription_id)
);
alter table public.admin_alerts enable row level security;
alter table public.admin_push_subscriptions enable row level security;
alter table public.admin_push_deliveries enable row level security;
revoke all on public.admin_alerts,public.admin_push_subscriptions,public.admin_push_deliveries from public,anon,authenticated;
grant select,insert,update,delete on public.admin_alerts,public.admin_push_subscriptions,public.admin_push_deliveries to service_role;
create index if not exists admin_alerts_pending_idx on public.admin_alerts(created_at) where acknowledged_at is null;
create index if not exists admin_push_due_idx on public.admin_push_deliveries(available_at) where delivered_at is null;

create or replace function public.admin_alert_is_actionable(p_kind text,p_record_id text)
returns boolean language sql stable security definer set search_path=public as $$
  select case p_kind
    when 'order' then exists(select 1 from public.orders where id=p_record_id and deleted_at is null and status in ('paid','confirmed','preparing','ready','out_for_delivery') and coalesce(data->>'paymentStatus','paid')='paid')
    when 'reservation' then exists(select 1 from public.table_reservations where id=p_record_id and deleted_at is null and status='confirmed' and booking_date >= (now() at time zone 'Europe/London')::date)
    when 'hall' then exists(select 1 from public.hall_enquiries where id=p_record_id and deleted_at is null and status='new')
    else false end;
$$;
revoke all on function public.admin_alert_is_actionable(text,text) from public,anon,authenticated;
grant execute on function public.admin_alert_is_actionable(text,text) to service_role;

create or replace function public.queue_admin_activity_alert()
returns trigger language plpgsql security definer set search_path=public as $$
declare k text;
begin
  if tg_table_name='orders' then
    if new.data->>'paymentStatus' is distinct from 'paid' then return new; end if;
    if tg_op='UPDATE' then
      if old.data->>'paymentStatus'='paid' then return new; end if;
    end if;
    k:='order';
  elsif tg_table_name='table_reservations' then
    if new.status<>'confirmed' then return new; end if;
    k:='reservation';
  else
    if new.status<>'new' then return new; end if;
    k:='hall';
  end if;
  insert into public.admin_alerts(kind,record_id) values(k,new.id) on conflict(kind,record_id) do nothing;
  return new;
end $$;
revoke all on function public.queue_admin_activity_alert() from public,anon,authenticated;
drop trigger if exists queue_paid_order_alert on public.orders;
create trigger queue_paid_order_alert after insert or update on public.orders for each row execute function public.queue_admin_activity_alert();
drop trigger if exists queue_reservation_alert on public.table_reservations;
create trigger queue_reservation_alert after insert on public.table_reservations for each row execute function public.queue_admin_activity_alert();
drop trigger if exists queue_hall_alert on public.hall_enquiries;
create trigger queue_hall_alert after insert on public.hall_enquiries for each row execute function public.queue_admin_activity_alert();

create or replace function public.queue_admin_push_deliveries()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.admin_push_deliveries(alert_id,subscription_id)
    select new.id,s.id from public.admin_push_subscriptions s join public.admin_profiles p on p.user_id=s.user_id
    where p.is_active and p.session_version=s.session_version and s.expires_at>now()
      and (new.kind='order' or p.role in ('owner','admin','manager','viewer'));
  return new;
end $$;
revoke all on function public.queue_admin_push_deliveries() from public,anon,authenticated;
drop trigger if exists queue_push_for_admin_alert on public.admin_alerts;
create trigger queue_push_for_admin_alert after insert on public.admin_alerts for each row execute function public.queue_admin_push_deliveries();

create or replace function public.pending_admin_alerts(p_actor_user_id uuid)
returns jsonb language sql stable security definer set search_path=public as $$
  select coalesce(jsonb_agg(item order by created_at),'[]'::jsonb) from (
    select a.created_at,jsonb_build_object('id',a.id,'kind',a.kind,'recordId',a.record_id,'createdAt',a.created_at,
      'title',case a.kind when 'order' then 'New paid food order' when 'reservation' then 'New table booking' else 'New hall enquiry' end,
      'href',case a.kind when 'order' then '/admin/orders/'||a.record_id when 'reservation' then '/admin/reservations' else '/admin/hall-enquiries' end,
      'canAcknowledge',p.role in ('owner','admin','manager') or (p.role='kitchen' and a.kind='order')) as item
    from public.admin_alerts a join public.admin_profiles p on p.user_id=p_actor_user_id and p.is_active
    where a.acknowledged_at is null and public.admin_alert_is_actionable(a.kind,a.record_id)
      and (a.kind='order' or p.role in ('owner','admin','manager','viewer'))
    order by a.created_at limit 100
  ) pending;
$$;
revoke all on function public.pending_admin_alerts(uuid) from public,anon,authenticated;
grant execute on function public.pending_admin_alerts(uuid) to service_role;

create or replace function public.acknowledge_admin_alert(p_actor_user_id uuid,p_alert_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare actor public.admin_profiles%rowtype; affected integer;
begin
  select * into actor from public.admin_profiles where user_id=p_actor_user_id and is_active;
  if not found then return false; end if;
  update public.admin_alerts set acknowledged_at=now(),acknowledged_by=p_actor_user_id
    where id=p_alert_id and acknowledged_at is null and (actor.role in ('owner','admin','manager') or (actor.role='kitchen' and kind='order'));
  get diagnostics affected=row_count;
  if affected=0 then return false; end if;
  insert into public.admin_audit_log(actor_user_id,actor_email,actor_role,action,target_type,target_id,metadata)
    values(actor.user_id,actor.email,actor.role,'alert.acknowledged','admin_alert',p_alert_id::text,'{}'::jsonb);
  return true;
end $$;
revoke all on function public.acknowledge_admin_alert(uuid,uuid) from public,anon,authenticated;
grant execute on function public.acknowledge_admin_alert(uuid,uuid) to service_role;

create or replace function public.save_admin_push_subscription(p_id text,p_actor_user_id uuid,p_session_version integer,p_session_hash text,p_subscription jsonb,p_expires_at timestamptz)
returns boolean language plpgsql security definer set search_path=public as $$
declare affected integer;
begin
  if not exists(select 1 from public.admin_profiles where user_id=p_actor_user_id and is_active and session_version=p_session_version)
    or p_id !~ '^[a-f0-9]{64}$' or p_session_hash !~ '^[a-f0-9]{64}$' or p_expires_at<=now() or p_expires_at>now()+interval '30 days 1 minute' then return false; end if;
  -- Bound devices per identity. Existing-device renewals do not consume a slot.
  perform pg_advisory_xact_lock(hashtext(p_actor_user_id::text));
  if not exists(select 1 from public.admin_push_subscriptions where id=p_id) and (select count(*) from public.admin_push_subscriptions where user_id=p_actor_user_id and expires_at>now())>=20 then return false; end if;
  insert into public.admin_push_subscriptions(id,user_id,session_version,session_hash,subscription,expires_at)
    values(p_id,p_actor_user_id,p_session_version,p_session_hash,p_subscription,p_expires_at)
    on conflict(id) do update set user_id=excluded.user_id,session_version=excluded.session_version,session_hash=excluded.session_hash,subscription=excluded.subscription,expires_at=excluded.expires_at,updated_at=now()
    where admin_push_subscriptions.user_id=p_actor_user_id or admin_push_subscriptions.expires_at<=now();
  get diagnostics affected=row_count;
  return affected>0;
end $$;
revoke all on function public.save_admin_push_subscription(text,uuid,integer,text,jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.save_admin_push_subscription(text,uuid,integer,text,jsonb,timestamptz) to service_role;

create or replace function public.remove_admin_push_subscriptions(p_actor_user_id uuid,p_session_hash text)
returns void language sql security definer set search_path=public as $$
  delete from public.admin_push_subscriptions where user_id=p_actor_user_id and session_hash=p_session_hash;
$$;
revoke all on function public.remove_admin_push_subscriptions(uuid,text) from public,anon,authenticated;
grant execute on function public.remove_admin_push_subscriptions(uuid,text) to service_role;

create or replace function public.get_admin_push_subscription(p_id text,p_actor_user_id uuid,p_session_hash text)
returns jsonb language sql stable security definer set search_path=public as $$
  select s.subscription from public.admin_push_subscriptions s join public.admin_profiles p on p.user_id=s.user_id
    where s.id=p_id and s.user_id=p_actor_user_id and s.session_hash=p_session_hash
      and s.expires_at>now() and p.is_active and p.session_version=s.session_version;
$$;
revoke all on function public.get_admin_push_subscription(text,uuid,text) from public,anon,authenticated;
grant execute on function public.get_admin_push_subscription(text,uuid,text) to service_role;

create or replace function public.claim_admin_push_deliveries()
returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
  delete from public.admin_push_subscriptions where expires_at<now()-interval '1 day';
  delete from public.admin_alerts where created_at<now()-interval '30 days' and acknowledged_at is not null;
  with candidates as (
    select d.alert_id,d.subscription_id from public.admin_push_deliveries d
    join public.admin_alerts a on a.id=d.alert_id
    join public.admin_push_subscriptions s on s.id=d.subscription_id
    join public.admin_profiles p on p.user_id=s.user_id
    where d.delivered_at is null and d.attempts<8 and d.available_at<=now() and (d.leased_until is null or d.leased_until<=now())
      and a.acknowledged_at is null and a.created_at>now()-interval '24 hours' and public.admin_alert_is_actionable(a.kind,a.record_id)
      and p.is_active and p.session_version=s.session_version and s.expires_at>now()
      and (a.kind='order' or p.role in ('owner','admin','manager','viewer'))
    order by a.created_at limit 20 for update of d skip locked
  ), claimed as (
    update public.admin_push_deliveries d set attempts=attempts+1,lease_token=gen_random_uuid(),leased_until=now()+interval '2 minutes'
    from candidates c where d.alert_id=c.alert_id and d.subscription_id=c.subscription_id returning d.*
  ) select coalesce(jsonb_agg(jsonb_build_object('alertId',c.alert_id,'subscriptionId',c.subscription_id,'leaseToken',c.lease_token,'subscription',s.subscription)),'[]'::jsonb)
    into result from claimed c join public.admin_push_subscriptions s on s.id=c.subscription_id;
  return result;
end $$;
revoke all on function public.claim_admin_push_deliveries() from public,anon,authenticated;
grant execute on function public.claim_admin_push_deliveries() to service_role;

create or replace function public.complete_admin_push_delivery(p_alert_id uuid,p_subscription_id text,p_lease_token uuid,p_success boolean,p_expired boolean default false)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.admin_push_deliveries where alert_id=p_alert_id and subscription_id=p_subscription_id and lease_token=p_lease_token) then return; end if;
  if p_expired then delete from public.admin_push_subscriptions where id=p_subscription_id; return; end if;
  update public.admin_push_deliveries set delivered_at=case when p_success then now() else null end,
    available_at=now()+make_interval(secs=>least(3600,30*power(2,attempts)::integer)),leased_until=null,lease_token=null
    where alert_id=p_alert_id and subscription_id=p_subscription_id and lease_token=p_lease_token;
end $$;
revoke all on function public.complete_admin_push_delivery(uuid,text,uuid,boolean,boolean) from public,anon,authenticated;
grant execute on function public.complete_admin_push_delivery(uuid,text,uuid,boolean,boolean) to service_role;

-- Recover recent actionable records when enabling alerts on an existing restaurant.
insert into public.admin_alerts(kind,record_id,created_at)
select 'order',id,created_at from public.orders where created_at>now()-interval '24 hours' and public.admin_alert_is_actionable('order',id)
union all select 'reservation',id,created_at from public.table_reservations where created_at>now()-interval '24 hours' and public.admin_alert_is_actionable('reservation',id)
union all select 'hall',id,created_at from public.hall_enquiries where created_at>now()-interval '24 hours' and public.admin_alert_is_actionable('hall',id)
on conflict(kind,record_id) do nothing;
create or replace function public.admin_alerts_health()
returns boolean language sql stable security definer set search_path=public as $$
  select to_regclass('public.admin_alerts') is not null
    and to_regclass('public.admin_push_subscriptions') is not null
    and to_regclass('public.admin_push_deliveries') is not null
    and exists(select 1 from pg_trigger where tgrelid='public.orders'::regclass and tgname='queue_paid_order_alert' and tgenabled='O')
    and exists(select 1 from pg_trigger where tgrelid='public.table_reservations'::regclass and tgname='queue_reservation_alert' and tgenabled='O')
    and exists(select 1 from pg_trigger where tgrelid='public.hall_enquiries'::regclass and tgname='queue_hall_alert' and tgenabled='O');
$$;
revoke all on function public.admin_alerts_health() from public,anon,authenticated;
grant execute on function public.admin_alerts_health() to service_role;
insert into public.app_schema_versions(version,description) values('2026-10-26-admin-alerts-push-v1','Durable staff alerts, audited acknowledgement and leased push delivery') on conflict(version) do nothing;
commit;
