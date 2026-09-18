-- Apply the confirmed opening hours without overwriting a schedule that staff
-- have already configured. Existing dated holiday exceptions are preserved.
update public.restaurant_schedule
set data = jsonb_set(data, '{weekly}', '[{"closed":false,"opens":"11:00","closes":"15:00","secondOpens":"16:00","secondCloses":"21:00"},{"closed":true,"opens":"","closes":"","secondOpens":"","secondCloses":""},{"closed":false,"opens":"11:00","closes":"15:00","secondOpens":"16:00","secondCloses":"21:00"},{"closed":false,"opens":"11:00","closes":"15:00","secondOpens":"16:00","secondCloses":"21:00"},{"closed":false,"opens":"11:00","closes":"15:00","secondOpens":"16:00","secondCloses":"22:00"},{"closed":false,"opens":"11:00","closes":"22:00","secondOpens":"","secondCloses":""},{"closed":false,"opens":"11:00","closes":"15:00","secondOpens":"16:00","secondCloses":"22:00"}]'::jsonb),
    revision = revision + 1,
    updated_at = now()
where id = 1 and not exists (
  select 1 from jsonb_array_elements(data->'weekly') as day
  where coalesce(day->>'opens', '') <> '' or coalesce(day->>'closes', '') <> ''
);

insert into public.app_schema_versions(version, description)
values ('2026-09-18-official-split-hours-v1', 'Confirmed split lunch and dinner opening hours')
on conflict (version) do nothing;
