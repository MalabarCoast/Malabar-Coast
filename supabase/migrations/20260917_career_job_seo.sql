-- Stable public vacancy URLs and uniqueness for JobPosting pages.
alter table public.career_opportunities
  add column if not exists slug text generated always as (lower(data->>'slug')) stored;

create unique index if not exists career_opportunities_slug_unique
  on public.career_opportunities(slug)
  where slug is not null and slug <> '';

insert into public.app_schema_versions(version, description)
values ('2026-09-17-career-job-seo-v1', 'Stable vacancy slugs and JobPosting detail pages')
on conflict (version) do nothing;
