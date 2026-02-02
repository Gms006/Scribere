-- Notes table
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Sem título',
  content_json jsonb,
  content_text text,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_id_idx on public.notes(user_id);

alter table public.notes enable row level security;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_notes_updated_at on public.notes;

create trigger set_notes_updated_at
before update on public.notes
for each row
execute function public.set_updated_at();

-- Policies
create policy "Users can view their notes" on public.notes
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their notes" on public.notes
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their notes" on public.notes
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their notes" on public.notes
  for delete
  using (auth.uid() = user_id);
