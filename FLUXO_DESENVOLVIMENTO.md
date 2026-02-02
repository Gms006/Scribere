# Fluxo de desenvolvimento (Stages) — com login + Postgres

## Stage 0 — Setup do repo ✅

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

## Stage 1 — Supabase + Auth (login) ✅

- Criar projeto no Supabase
- Configurar Auth (email/senha)
- Session gate no React
- Logout
- (Opcional) tabela `profiles`

## Stage 2 — Banco + RLS + CRUD Notes ✅

- Rodar o SQL do template (notes + policies)
- Implementar `notesApi.ts` e listagem básica
- Criar/editar/excluir nota no banco
- Pin/unpin, ordenação

## Stage 3 — Editor robusto (TipTap) ✅

- TipTap + toolbar completa:
- H1/H2/H3, listas, bold/italic/underline/strike
- alinhamento, inline code
- Salvar `content_json` + gerar `content_text` para busca
- Inline code copiável com 1 clique (como você pediu)

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
