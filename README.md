# 📝 Scribere

Portal de notas com visual SaaS, editor rich text completo (TipTap) com headings/listas/sublistas e fontes, e **login**.
Armazenamento no Supabase (Postgres) com **Row Level Security (RLS)**.

## Stack

- React + TypeScript (Vite)
- TailwindCSS
- React Router
- TipTap (rich text)
- Supabase (Auth + Postgres + APIs)
- (Opcional) Dexie/IndexedDB para offline-first

## Setup local

```bash
npm install
npm run dev
```

A versão recomendada do Node é **>= 20**. (Para Windows, use nvm-windows.)

A aplicação estará disponível em `http://localhost:5173` e possui as rotas:

- `/login`
- `/app`

Para build e preview:

```bash
npm run build
npm run preview
```

## Variáveis de ambiente (Supabase)

Copie o arquivo `.env.example` para `.env.local` e preencha:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_APP_NAME=Scribere
```

## Estrutura do projeto

```
src/
  components/        # UI reutilizável (Toast, NoteEditor)
  context/           # AuthProvider e sessão
  lib/               # Supabase client + APIs
  pages/             # /login e /app
  routes/            # React Router
  types/             # Tipos compartilhados
supabase/            # SQL e políticas (RLS)
```

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run format`

## Supabase (Auth + Notes)

1. Crie um projeto no Supabase.
2. Configure Auth (email/senha) e crie um usuário de teste.
3. Rode o SQL de `supabase/notes.sql` para criar a tabela `notes` e as policies RLS.

## Roadmap (Stages)

- S0 Setup repo ✅
- S1 Auth (login) ✅
- S2 Notes + RLS + CRUD ✅
- S3 TipTap + toolbar + listas/sublistas + fontes + inline code copiável ✅
- S4 UX TDAH-friendly ✅
- S5 Offline-first (opcional)
- S6 Tags/templates
- S7 Polimento (tema, PWA, a11y)

## Segurança

- A anon key pode ficar no front; a segurança vem do **RLS no Postgres**.
- Nunca exponha `service_role` no client.
