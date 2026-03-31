-- Contacts table
create table if not exists public.contacts (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  name         text        not null default '',
  role         text        not null default '',
  municipality text        not null default '',
  sector       text        not null default '',
  phones       jsonb       not null default '[]'::jsonb,
  emails       jsonb       not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists contacts_user_id_idx      on public.contacts(user_id);
create index if not exists contacts_municipality_idx on public.contacts(municipality);
create index if not exists contacts_sector_idx       on public.contacts(sector);

alter table public.contacts enable row level security;

-- Reuses set_updated_at() already created by notes.sql
drop trigger if exists set_contacts_updated_at on public.contacts;
create trigger set_contacts_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

-- Policies
create policy "Users can view their contacts" on public.contacts
  for select using (auth.uid() = user_id);

create policy "Users can insert their contacts" on public.contacts
  for insert with check (auth.uid() = user_id);

create policy "Users can update their contacts" on public.contacts
  for update using (auth.uid() = user_id);

create policy "Users can delete their contacts" on public.contacts
  for delete using (auth.uid() = user_id);