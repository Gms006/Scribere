create table if not exists public.municipios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  uf char(2) not null,
  site_prefeitura text,
  created_at timestamptz not null default now()
);

create table if not exists public.tipos_processo (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  categoria text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.guias_processo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  tipo_id uuid not null references public.tipos_processo(id),
  como_funciona text,
  documentos jsonb not null default '[]'::jsonb,
  etapas jsonb not null default '[]'::jsonb,
  dependencia_tipo_ids jsonb not null default '[]'::jsonb,
  prazo_estimado text,
  custo_estimado numeric(10, 2),
  orgao_responsavel text,
  contato_orgao text,
  validade_tipo text not null default 'Definitivo',
  validade_prazo_anos integer,
  observacoes text,
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, municipio_id, tipo_id)
);

alter table public.municipios drop column if exists orgao_responsavel;
alter table public.guias_processo add column if not exists orgao_responsavel text;
alter table public.guias_processo add column if not exists validade_tipo text;
alter table public.guias_processo add column if not exists validade_prazo_anos integer;
alter table public.guias_processo add column if not exists dependencia_tipo_ids jsonb;
update public.guias_processo set dependencia_tipo_ids = '[]'::jsonb where dependencia_tipo_ids is null;
alter table public.guias_processo alter column dependencia_tipo_ids set default '[]'::jsonb;
alter table public.guias_processo alter column dependencia_tipo_ids set not null;
update public.guias_processo set validade_tipo = 'Definitivo' where validade_tipo is null;
alter table public.guias_processo alter column validade_tipo set default 'Definitivo';
alter table public.guias_processo alter column validade_tipo set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'guias_processo_validade_tipo_check'
  ) then
    alter table public.guias_processo
      add constraint guias_processo_validade_tipo_check
      check (validade_tipo in ('Definitivo', 'Condicionado'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'guias_processo_dependencias_json_array_check'
  ) then
    alter table public.guias_processo
      add constraint guias_processo_dependencias_json_array_check
      check (jsonb_typeof(dependencia_tipo_ids) = 'array');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'guias_processo_validade_prazo_check'
  ) then
    alter table public.guias_processo
      add constraint guias_processo_validade_prazo_check
      check (
        (validade_tipo = 'Definitivo' and validade_prazo_anos is null)
        or
        (validade_tipo = 'Condicionado' and validade_prazo_anos is not null and validade_prazo_anos > 0)
      );
  end if;
end $$;

create index if not exists municipios_user_id_idx on public.municipios(user_id);
create index if not exists guias_processo_user_id_idx on public.guias_processo(user_id);
create index if not exists guias_processo_municipio_id_idx on public.guias_processo(municipio_id);
create index if not exists guias_processo_tipo_id_idx on public.guias_processo(tipo_id);

create or replace function public.set_guias_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_guias_atualizado_em on public.guias_processo;
create trigger set_guias_atualizado_em
before update on public.guias_processo
for each row execute function public.set_guias_atualizado_em();

alter table public.municipios enable row level security;
alter table public.guias_processo enable row level security;
alter table public.tipos_processo enable row level security;

drop policy if exists "Usuário acessa seus municípios" on public.municipios;
create policy "Usuário acessa seus municípios"
  on public.municipios for all
  using (user_id = auth.uid());

drop policy if exists "Usuário acessa suas guias" on public.guias_processo;
create policy "Usuário acessa suas guias"
  on public.guias_processo for all
  using (user_id = auth.uid());

drop policy if exists "Leitura pública de tipos" on public.tipos_processo;
create policy "Leitura pública de tipos"
  on public.tipos_processo for select
  using (true);

insert into public.tipos_processo (nome, categoria) values
  ('Alvará de Funcionamento', 'Licenciamento'),
  ('Licença de Uso do Solo', 'Licenciamento'),
  ('Licença Sanitária', 'Vigilância Sanitária'),
  ('Habite-se', 'Construção'),
  ('Alvará de Construção', 'Construção'),
  ('Licença Ambiental', 'Meio Ambiente'),
  ('Inscrição Municipal (ISS)', 'Tributário'),
  ('Regularização de Imóvel', 'Regularização')
on conflict (nome) do nothing;
