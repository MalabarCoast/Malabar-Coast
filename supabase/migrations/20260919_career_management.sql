-- Complete career management: reject stale saves after removal and retain an audited soft-delete record.
create or replace function public.admin_save_career_opportunity(p_data jsonb, p_actor_user_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare actor_email text; actor_role text; job_id text; affected integer;
begin
  select email, role into actor_email, actor_role from public.admin_profiles where user_id = p_actor_user_id and is_active and role in ('owner','admin');
  if not found then return false; end if;
  job_id := p_data->>'id';
  if job_id !~ '^job_[A-Za-z0-9_-]{16,80}$' or p_data->>'status' not in ('draft','published','closed') then return false; end if;
  insert into public.career_opportunities(id,data) values(job_id,p_data)
  on conflict (id) do update set data = jsonb_set(excluded.data,'{createdAt}',coalesce(public.career_opportunities.data->'createdAt',to_jsonb(public.career_opportunities.created_at::text))), updated_at = now()
  where coalesce(public.career_opportunities.data->>'deletedAt','') = '';
  get diagnostics affected = row_count;
  if affected = 0 then return false; end if;
  insert into public.admin_audit_log(actor_user_id,actor_email,actor_role,action,target_type,target_id,metadata)
  values(p_actor_user_id,actor_email,actor_role,'career.saved','career_opportunity',job_id,jsonb_build_object('status',p_data->>'status'));
  return true;
end $$;
revoke all on function public.admin_save_career_opportunity(jsonb,uuid) from public;
grant execute on function public.admin_save_career_opportunity(jsonb,uuid) to service_role;

create or replace function public.admin_delete_career_opportunity(p_career_id text, p_actor_user_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare actor_email text; actor_role text; previous_data jsonb;
begin
  select email, role into actor_email, actor_role from public.admin_profiles where user_id = p_actor_user_id and is_active and role in ('owner','admin');
  if not found then return false; end if;
  select data into previous_data from public.career_opportunities where id = p_career_id and coalesce(data->>'deletedAt','') = '' for update;
  if not found then return false; end if;
  update public.career_opportunities
  set data = jsonb_set(jsonb_set(jsonb_set(data,'{status}',to_jsonb('closed'::text),true),'{deletedAt}',to_jsonb(now()::text),true),'{deletedBy}',to_jsonb(p_actor_user_id::text),true), updated_at = now()
  where id = p_career_id;
  insert into public.admin_audit_log(actor_user_id,actor_email,actor_role,action,target_type,target_id,metadata)
  values(p_actor_user_id,actor_email,actor_role,'career.deleted','career_opportunity',p_career_id,jsonb_build_object('retained',true,'title',previous_data->>'title','previousStatus',previous_data->>'status'));
  return true;
end $$;
revoke all on function public.admin_delete_career_opportunity(text,uuid) from public;
grant execute on function public.admin_delete_career_opportunity(text,uuid) to service_role;

insert into public.app_schema_versions(version, description)
values ('2026-09-19-career-management-v2', 'Audited recoverable removal of career opportunities')
on conflict (version) do nothing;
