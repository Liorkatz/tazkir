create table if not exists public.memos (
  id bigint generated always as identity primary key,
  serial_number text not null,
  inspection_date date,
  next_inspection_date date,
  customer text,
  inspection_type text,
  result text,
  summary text,
  items jsonb not null default '[]'::jsonb,
  defects jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dictionary_items (
  id bigint generated always as identity primary key,
  kind text not null,
  label text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(kind,label)
);

insert into public.dictionary_items(kind,label) values
('inspection_types','בדיקה תקופתית'),
('inspection_types','בדיקה ראשונית'),
('results','תקין'),
('results','לא תקין')
on conflict do nothing;

alter table public.memos enable row level security;
alter table public.dictionary_items enable row level security;

create policy "public read memos" on public.memos for select to anon using (true);
create policy "public insert memos" on public.memos for insert to anon with check (true);
create policy "public update memos" on public.memos for update to anon using (true) with check (true);
create policy "public delete memos" on public.memos for delete to anon using (true);

create policy "public read dictionary" on public.dictionary_items for select to anon using (true);
create policy "public insert dictionary" on public.dictionary_items for insert to anon with check (true);
create policy "public update dictionary" on public.dictionary_items for update to anon using (true) with check (true);
create policy "public delete dictionary" on public.dictionary_items for delete to anon using (true);

alter publication supabase_realtime add table public.memos;
alter publication supabase_realtime add table public.dictionary_items;