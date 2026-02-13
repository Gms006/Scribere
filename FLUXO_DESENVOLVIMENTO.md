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

**Status:** VALIDADO (headings/listas/sublistas + fontes; toolbar aplicada com `onMouseDown` + `focus`, sem perda de seleção; autosave com debounce + dirty)

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
  - `npm run dev` (servidor iniciado para validação manual)

**Checklist de validação manual (S3)**

- H1/H2/H3 atualiza o JSON (debug em dev + `can().toggleHeading`) e renderiza visualmente.
- Bullet/ordered list aplicam corretamente e sublistas funcionam com Tab/Shift+Tab.
- 2º nível de lista usa marcador "-" via CSS.
- Dropdown de fonte aplica e persiste no conteúdo.
- Seleção não é perdida ao clicar nos botões (sem blur).
- Alinhamento (left/center/right/justify) aplica corretamente.
- Autosave só dispara quando há mudanças (dirty) e respeita debounce.
- Trocar de nota não sobrescreve conteúdo (A/B/C).

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

## Stage 8 — Backlinks + Wiki Links + Graph View

**Objetivo**

- Transformar notas em “rede de conhecimento” (estilo Zettelkasten).

**Escopo (MVP)**

- Links `[[...]]` entre notas
- Backlinks automáticos
- Painel de backlinks na nota
- Busca de links (digitar `[[` e sugerir notas)
- Visualização “Graph” simples (MVP)

**Entregáveis**

- Requisitos funcionais:
  - Criar link `[[título]]` e navegar entre notas
  - Backlinks atualizam automaticamente ao editar links
  - Painel de backlinks mostra notas que referenciam a atual
  - Busca/sugestão de notas ao digitar `[[`
  - Graph view exibe nós (notas) e arestas (links)
- Requisitos não-funcionais:
  - Atualização de links sem travar editor
  - Consistência ao renomear notas (link resolvido por ID)
  - Desempenho aceitável com 1k+ notas
- Itens técnicos:
  - Parser `[[...]]` (sincronização incremental)
  - Persistência de links (tabela/índices)
  - Index de backlinks
  - UI: painel de backlinks + Graph view (MVP)

**Validação/Evidências**

- Checklist de arquivos: schema de links/backlinks + UI do painel + view de graph. (validação manual)
- Registros de teste: links persistem e são reprocessados após renomear nota. (validação manual)

**Checklist de validação manual**

- Criar nota A e B, linkar A -> `[[B]]`, abrir B e ver backlink de A.
- Remover o link em A e confirmar remoção do backlink em B.
- Renomear B para “B2” e confirmar que `[[B]]` resolve para B2 (ID mantém).
- Abrir Graph view e ver A e B conectadas.
- Digitar `[[` no editor e ver sugestões de notas existentes.

## Stage 9 — IA (Copiloto) sobre notas

**Objetivo**

- Recursos de IA que realmente diferenciam (sem “chat genérico”).

**Escopo (MVP)**

- Ações por nota/seleção:
  - Resumir
  - Reescrever
  - Gerar checklist/tarefas
  - Extrair tópicos
- “Perguntar às minhas notas” (RAG básico)

**Requisitos**

- Privacidade: enviar apenas trechos necessários
- Controle de custo/limites (rate limit + quotas)
- UX de “1 clique” (botões/ações prontas)

**Entregáveis**

- Checklist técnico:
  - Embeddings + indexação
  - Pipeline de busca (top-k + filtros)
  - Prompts padronizados por ação
  - Cache de respostas (por nota/seleção)
  - Logs mínimos para auditoria

**Validação/Evidências**

- Teste de fluxo: ação “Resumir” funciona em nota longa e gera saída coerente. (validação manual)
- RAG retorna resposta com referências a trechos de origem. (validação manual)

**Checklist de validação manual**

- Selecionar trecho e clicar “Resumir”: saída curta e pertinente.
- Selecionar trecho e clicar “Reescrever”: mantém sentido, muda estilo.
- Selecionar 3 notas e usar “Perguntar às minhas notas”: resposta com citações/trechos.
- Verificar que apenas trechos necessários foram enviados (log/inspector).
- Confirmar limites de uso (rate limit/quotas) em chamadas consecutivas.

## Stage 10 — Compartilhamento + Publicação + Export

**Objetivo**

- Tornar o Scribere compartilhável/comercial.

**Escopo (MVP)**

- Link compartilhável read-only por nota
- Permissões básicas
- Export (Markdown/PDF) + import (Markdown)

**Entregáveis**

- Checklist funcional:
  - Gerar link read-only para nota
  - Desativar link e revogar acesso
  - Exportar nota em Markdown e PDF
  - Importar Markdown e criar nota
- Checklist de segurança:
  - Token com expiração
  - Escopo por nota
  - Rate limit para links públicos
  - Proteção contra enumeração de IDs

**Validação/Evidências**

- Link anônimo abre sem login e com read-only. (validação manual)
- Export de MD/PDF gera arquivo legível e fiel ao conteúdo. (validação manual)
- Import MD cria nota com título e conteúdo corretos. (validação manual)

**Checklist de validação manual**

- Gerar link público e abrir em janela anônima (read-only).
- Tentar editar pelo link público e confirmar bloqueio.
- Revogar link e confirmar acesso negado.
- Exportar MD e PDF e conferir layout básico.
- Importar MD e confirmar criação da nota.

## Roadmap pós-Stage 10 (ideias)

- Publicação com domínio customizado
- Colaboração em tempo real (multiuser)
- Templates avançados + marketplace
- Relatórios e insights (tags, produtividade)
- Integração com calendário/tarefas
- Extensões/plug-ins de editor
