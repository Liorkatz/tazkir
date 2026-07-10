-- Tazkir v2: customer, equipment and memo snapshot foundation
-- Run once in the Supabase SQL editor after supabase-schema.sql.

create table if not exists public.customers (
  id bigint generated always as identity primary key,
  name text not null,
  phone text,
  email text,
  address text,
  vehicle_number text,
  notes text,
  details text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_name_idx on public.customers using btree (name);
create index if not exists customers_phone_idx on public.customers using btree (phone);
create index if not exists customers_vehicle_idx on public.customers using btree (vehicle_number);

create table if not exists public.equipment_types (
  id bigint generated always as identity primary key,
  name text not null unique,
  category text,
  requires_serial boolean not null default true,
  angle_capacity_enabled boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.equipment_items (
  id bigint generated always as identity primary key,
  equipment_type_id bigint references public.equipment_types(id),
  name text not null,
  serial_number text,
  manufacturer text,
  model text,
  catalog_number text,
  working_load numeric,
  load_unit text not null default 'kg',
  length_value numeric,
  diameter_value numeric,
  branches_count integer,
  material_grade text,
  capacity_30 numeric,
  capacity_45 numeric,
  capacity_60 numeric,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint equipment_items_serial_unique unique (serial_number)
);

create index if not exists equipment_items_name_idx on public.equipment_items using btree (name);
create index if not exists equipment_items_serial_idx on public.equipment_items using btree (serial_number);

alter table public.memos add column if not exists memo_number bigint;
alter table public.memos add column if not exists customer_id bigint references public.customers(id);
alter table public.memos add column if not exists customer_snapshot jsonb not null default '{}'::jsonb;
alter table public.memos add column if not exists report_snapshot jsonb not null default '{}'::jsonb;
alter table public.memos add column if not exists report_generated_at timestamptz;

create sequence if not exists public.memo_number_seq start 1;

create or replace function public.assign_memo_number()
returns trigger
language plpgsql
as $$
begin
  if new.memo_number is null then
    new.memo_number := nextval('public.memo_number_seq');
  end if;
  return new;
end;
$$;

drop trigger if exists set_memo_number on public.memos;
create trigger set_memo_number
before insert on public.memos
for each row execute function public.assign_memo_number();

insert into public.equipment_types(name,category,requires_serial,angle_capacity_enabled) values
('מענב שרשרת','אביזרי הרמה',true,true),
('מענב כבל פלדה','אביזרי הרמה',true,true),
('רצועת הרמה שטוחה','אביזרי הרמה',true,false),
('מענב עגול סינתטי','אביזרי הרמה',true,false),
('שאקל','אביזרי הרמה',true,false),
('וו הרמה','אביזרי הרמה',true,false),
('טבעת הרמה','אביזרי הרמה',true,false),
('נקודת הרמה מסתובבת','אביזרי הרמה',true,false),
('קורת הרמה','ציוד הרמה',true,false),
('תפסן הרמה','ציוד הרמה',true,false),
('גלגלת או בלוק','ציוד הרמה',true,false),
('כננת או מותחן','ציוד הרמה',true,false),
('מגבה','ציוד הרמה',true,false)
on conflict (name) do nothing;

alter table public.customers enable row level security;
alter table public.equipment_types enable row level security;
alter table public.equipment_items enable row level security;

drop policy if exists "public read customers" on public.customers;
drop policy if exists "public insert customers" on public.customers;
drop policy if exists "public update customers" on public.customers;
drop policy if exists "public delete customers" on public.customers;
create policy "public read customers" on public.customers for select to anon using (true);
create policy "public insert customers" on public.customers for insert to anon with check (true);
create policy "public update customers" on public.customers for update to anon using (true) with check (true);
create policy "public delete customers" on public.customers for delete to anon using (true);

drop policy if exists "public read equipment types" on public.equipment_types;
drop policy if exists "public insert equipment types" on public.equipment_types;
drop policy if exists "public update equipment types" on public.equipment_types;
create policy "public read equipment types" on public.equipment_types for select to anon using (true);
create policy "public insert equipment types" on public.equipment_types for insert to anon with check (true);
create policy "public update equipment types" on public.equipment_types for update to anon using (true) with check (true);

drop policy if exists "public read equipment items" on public.equipment_items;
drop policy if exists "public insert equipment items" on public.equipment_items;
drop policy if exists "public update equipment items" on public.equipment_items;
drop policy if exists "public delete equipment items" on public.equipment_items;
create policy "public read equipment items" on public.equipment_items for select to anon using (true);
create policy "public insert equipment items" on public.equipment_items for insert to anon with check (true);
create policy "public update equipment items" on public.equipment_items for update to anon using (true) with check (true);
create policy "public delete equipment items" on public.equipment_items for delete to anon using (true);
