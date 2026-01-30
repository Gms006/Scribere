# 📝 Scribere

Portal de notas com visual SaaS, editor rich text completo (TipTap) e **login**.
Armazenamento no Supabase (Postgres) com **Row Level Security (RLS)**.

## Stack
- React + TypeScript (Vite)
- TipTap (rich text)
- Supabase (Auth + Postgres + APIs)
- (Opcional) Dexie/IndexedDB para offline-first

## Setup rápido

### 1) Criar projeto no Supabase
- Crie um projeto
- Vá em **SQL Editor** e rode o arquivo `schema.sql` (template deste chat)
- Confirme que RLS está habilitado e policies criadas

### 2) Variáveis de ambiente (Vite)
Crie `.env.local`:

VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

### 3) Rodar o app
npm install
npm run dev

## Scripts
- npm run dev
- npm run build
- npm run preview

## Roadmap (Stages)
- S0 Setup repo
- S1 Auth (login)
- S2 Notes + RLS + CRUD
- S3 TipTap + toolbar + inline code copiável
- S4 UX TDAH-friendly
- S5 Offline-first (opcional)
- S6 Tags/templates
- S7 Polimento (tema, PWA, a11y)

## Segurança
- A anon key pode ficar no front; a segurança vem do **RLS no Postgres**.
- Nunca exponha `service_role` no client.
