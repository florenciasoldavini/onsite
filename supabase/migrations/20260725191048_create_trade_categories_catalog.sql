create table public.trade_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_at timestamp(3) not null default current_timestamp,
  updated_at timestamp(3),
  deleted_at timestamp(3),
  constraint trade_categories_code_format_check
    check (code ~ '^[a-z][a-z0-9_]*$')
);

insert into public.trade_categories (code)
values
  ('general_site_work'),
  ('concrete_masonry_structures'),
  ('carpentry_woodwork'),
  ('building_envelope_roofing_openings'),
  ('interior_construction_finishes'),
  ('plumbing_gas_fire_protection'),
  ('hvac_mechanical_systems'),
  ('electrical_low_voltage_systems'),
  ('elevators_specialty_equipment'),
  ('other_construction_trades');

revoke all on table public.trade_categories from anon, authenticated;
grant select on table public.trade_categories to authenticated;

alter table public.trade_categories enable row level security;

create policy "trade_categories_select_active"
on public.trade_categories
for select
to authenticated
using (
  (select auth.uid()) is not null
  and deleted_at is null
);
