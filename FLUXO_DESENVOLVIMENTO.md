# Fluxo de desenvolvimento (Stages) — com login + Postgres

## Stage 0 — Setup do repo ✅

**Status:** CONCLUÍDO

**Entregas obrigatórias**

- Vite + React + TS
- Tailwind + UI base (SaaS)
- ESLint/Prettier
- Rotas simples (`/login`, `/app`)

**Critérios de aceite (automatizáveis)**

- `npm install`
- `npm run dev` (abre sem erro)
- Rotas `/login` e `/app` renderizam
- `npm run build` passa
- `npm run lint` passa
- `npm run format` executa

**Validação/Evidências**

- Checklist de arquivos: `package.json` contém scripts `dev`, `build`, `preview`, `lint`, `format`. (validação manual)
- Comandos executados (validação manual já executada):
  - `npm ci`
  - `npx prettier -c .` → "All matched files use Prettier code style!"
  - `npx tsc --noEmit` → sem erros
  - `npm run lint` → sem erros
  - `npm run build` → `dist/` gerado (warning de chunk > 500kb é aceitável)
  - `npm run preview` → http://localhost:4173/ (subiu e respondeu)

## Stage 1 — Supabase + Auth (login) ✅

**Status:** CONCLUÍDO

- Criar projeto no Supabase
- Configurar Auth (email/senha)
- Session gate no React
- Logout
- (Opcional) tabela `profiles`

**Validação/Evidências**

- Checklist de arquivos:
  - `supabase/notes.sql` presente (schema + RLS + policies + trigger). (validação manual)
  - `src/lib/supabaseClient.ts` presente (client com persistência de sessão). (validação manual)
  - Auth/guard/login: `src/context/AuthContext.tsx`, `src/components/ProtectedRoute.tsx`, `src/pages/Login.tsx`. (validação manual)
- SQL (validação manual já executada):
  - Tabela `public.notes` criada com `user_id`
  - RLS habilitado (rls_enabled = true, rls_forced = false)
  - Policies:
    - SELECT: "Users can view their notes" qual: `(auth.uid() = user_id)`
    - INSERT: "Users can insert their notes" with_check: `(auth.uid() = user_id)`
    - UPDATE: "Users can update their notes" qual: `(auth.uid() = user_id)`
    - DELETE: "Users can delete their notes" qual: `(auth.uid() = user_id)`
  - Trigger: `set_notes_updated_at`
- Teste funcional manual: nota criada persistiu após refresh (F5) e relogin.

## Stage 2 — Banco + RLS + CRUD Notes ✅

- Rodar o SQL do template (notes + policies)
- Implementar `notesApi.ts` e listagem básica
- Criar/editar/excluir nota no banco
- Pin/unpin, ordenação

## Stage 3 — Editor robusto (TipTap) ✅

**Status:** VALIDADO (headings/listas/sublistas + fontes; toolbar aplicada com `onMouseDown` + `focus`, sem perda de seleção)

- TipTap + toolbar completa:
- H1/H2/H3, listas, sublistas (Tab/Shift+Tab), bold/italic/underline/strike
- alinhamento, inline code, fontes (font-family)
- Salvar `content_json` + gerar `content_text` para busca
- Inline code copiável com 1 clique (como você pediu)

**Validação/Evidências (S3)**

- Comandos (PowerShell):
  - `npm ci`
  - `npx tsc --noEmit`
  - `npm run lint`
  - `npm run build`
  - `npm run dev` (teste manual)

**Checklist de validação manual (S3)**

- H1/H2/H3 atualiza o JSON (debug em dev + `can().toggleHeading`) e renderiza visualmente.
- Bullet/ordered list aplicam corretamente e sublistas funcionam com Tab/Shift+Tab.
- 2º nível de lista usa marcador "-" via CSS.
- Dropdown de fonte aplica e persiste no conteúdo.
- Seleção não é perdida ao clicar nos botões (sem blur).
- Alinhamento (left/center/right/justify) aplica corretamente.

## Stage 4 — UX TDAH-friendly ✅

- Modo foco
- Command palette (Ctrl+K)
- Atalhos (Ctrl+N, Ctrl+P…)
- Feedback “salvando/salvo” com debounce

## Stage 5 — Offline-first (opcional, mas eu recomendo)

- Dexie/IndexedDB como cache local
- Sync com Supabase (fila de mudanças)
- Estratégia de conflito: “last write wins” por `updated_at`

## Stage 6 — Organização

- Tags
- Templates
- Filtros avançados e busca melhor

## Stage 7 — Polimento SaaS

- Tema claro/escuro
- PWA installable
- Acessibilidade + performance
