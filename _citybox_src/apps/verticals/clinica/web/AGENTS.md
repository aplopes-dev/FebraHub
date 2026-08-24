# AGENTS.md — `@citybox/clinica-web` (frontend da vertical Clínica)

> Fonte de verdade deste escopo. Ao mudar código, rota, env ou dependência aqui,
> atualize este arquivo na mesma operação (política da seção 7 do
> [`AGENTS.md`](../../../../AGENTS.md) raiz).

| | |
|---|---|
| **Pacote** | `@citybox/clinica-web` |
| **Porta** | **3113** (`next dev -p 3113`) |
| **Stack** | Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · `@citybox/ui` |
| **Backend** | [`clinica-api`](../api/AGENTS.md) (`:3172`) via proxy `/api/proxy/clinica` — **único upstream** (Fase 9 do PLAT-001 cortou a dependência do `platform-api`) |
| **Auth** | Keycloak — client `citybox-backoffice`, Authorization Code + PKCE, tokens em cookies `httpOnly` |
| **Origem** | `NEXT_PUBLIC_BACKOFFICE_ORIGIN` (dev: `http://127.0.0.1:3113`; prod: `https://clinica.aplopes.com`) |
| **Deploy prod** | `apps/verticals/clinica/infra/docker-compose.yml` serviço `web` → `clinica_web` :3113; nginx `clinica.aplopes.com` |
| **Testes** | Vitest + Testing Library (`pnpm --filter @citybox/clinica-web test`) |
| **Última atualização** | 2026-08-21 — Fluxo de caixa UX, ícone contrato orçamentos, PDFs, ConfirmDialog |

---

## 1. Por que este app existe

Até 2026-07-29 a clínica era um módulo do ERP multi-vertical legado (`apps/erp`,
rotas `/clinic/*`). Foi extraída para um app próprio, desacoplado: deploy,
dependências e ciclo de release independentes do ERP.

**O ERP multi-vertical legado (com o módulo `clinic`) foi removido em
2026-07-31** — `apps/erp` foi reaproveitado como novo nome de
`apps/erp-comercio` (backoffice de Comércio; ver `apps/erp/AGENTS.md` §9). A
cópia do módulo `clinic` que existia lá não foi portada — esta app
(`apps/verticals/clinica/web`) é a única fonte de verdade da UI da clínica
desde então.

---

## 2. Rotas

Backoffice servido na **raiz** — sem o prefixo `/clinic` do ERP.

| App | ERP (antes) | Aqui |
|---|---|---|
| Visão geral | `/clinic` | `/` |
| Pacientes | `/clinic/pacientes` | `/pacientes` (+ `/[id]/{sobre,tratamentos,orcamentos,anamnese,documentos,financeiro,arquivos}`) |
| Agenda | `/clinic/agenda` | `/agenda` |
| Vendas (CRM) | `/clinic/vendas` | `/vendas` |
| Marketing | `/marketing` | `/marketing` → campaigns; PageNav Comunicação \| Indicações; `/marketing/indicacoes` → `GET /v1/indicacoes/*` |
| Estoque | `/clinic/estoque` | `/estoque` |
| Financeiro | `/clinic/financeiro` | `/financeiro` → redirect `/financeiro/fluxo-de-caixa` (+ `transacoes`, `comissoes`, `configuracoes`) |
| Loja | — | `/loja` (+ `/loja/assinatura-eletronica`) — pacotes, saldo, card histórico de solicitações (`DataTable` paginado), relatório `GET /v1/electronic-signatures`; liberação no admin |
| Configurações | `/clinic/configuracoes` | `/configuracoes` (+ `equipe`, `planos`, `anamneses`, `contrato`, `categoria-paciente`, `categoria-agendamento`) |
| Relatórios / Tarefas | `/clinic/{relatorios,tarefas}` | `/relatorios`, `/tarefas` |

**Rotas fora do shell autenticado:** `/login`, `/auth/callback`, `/auth/sso`,
`/entrada`, `/selecionar-loja`.

**Rotas públicas — caminhos preservados de propósito** (links já circulam com
pacientes e a `clinica-api` gera o path da campanha):

- `/campanha/[clinic]/[slug]` — formulário público de campanha (`form_lead`).
  O path vem da API (`campaign-slug.utils.ts`); **não renomear.**
- `/public/clinic/anamnese/[token]` — preenchimento público de anamnese.
  Montado em `build-patient-anamnesis-public-link.ts` a partir de
  `window.location.origin`.

Todos os caminhos `/api/*` também foram preservados (`/api/proxy/clinica`,
`/api/public/clinic/...`), então os services do domínio não mudaram.

### Estrutura

```
src/app/
├── layout.tsx            ← html/body, fontes, Toaster, AppProviders
├── providers.tsx         ← Session → Permissions → Store → Query
├── icon.tsx              ← favicon gerado com a cor da clínica (#0891b2)
├── globals.css
├── (clinic)/             ← route group: TODO o backoffice autenticado
│   ├── layout.tsx        ← importa clinic-sheets.css + ClinicShell
│   ├── _shell.tsx        ← guarda de auth/permissão/loja + providers da vertical
│   └── …                 ← page.tsx = "/" (dashboard), pacientes/, agenda/, …
├── login/ entrada/ selecionar-loja/ auth/{callback,sso}/
├── campanha/[clinic]/[slug]/       ← público
├── public/clinic/anamnese/[token]/ ← público
└── api/
    ├── auth/{token,session,refresh,logout}/
    ├── proxy/clinica/[...path]/    ← + X-Store-Id (autorização é do ClinicScopeGuard)
    ├── cep/[cep]/                  ← consulta BrasilAPI (dado público, sem auth)
    └── public/clinic/{anamnesis,campaigns}/  ← sem auth
```

`src/features/clinic/**` foi copiado do ERP **com o mesmo caminho de import**
(`@/features/clinic/...`), então todo o domínio migrou sem reescrita de imports.
Ver [`src/app/(clinic)/AGENTS.md`](src/app/%28clinic%29/AGENTS.md) e
`src/features/clinic/AGENTS.md` para o detalhe por módulo de domínio.

---

## 3. Autenticação (Keycloak)

Fluxo idêntico ao do ERP — **tokens nunca chegam ao JavaScript**.

1. `/login` → `beginOAuthAuthorization()` (`src/lib/oauth-pkce.ts`) gera
   `state` + `code_verifier` (S256), guarda em `sessionStorage` e redireciona
   para `${issuer}/protocol/openid-connect/auth`.
2. `/auth/callback` → `POST /api/auth/token` troca `code` + `code_verifier`
   pelo token no Keycloak (server-side, com `client_secret`) e grava os cookies
   `httpOnly` `citybox_bo_{access,refresh,id}`. Devolve só metadados públicos
   (nome, e-mail, `expiresAt`, permissions).
3. `SessionProvider` sincroniza via `GET /api/auth/session` (a cada ~2min, com
   jitter); `resolveAccessTokenForBff` renova o access pelo refresh cookie com
   dedupe in-process. Débito conhecido: sem cache distribuído, N réplicas podem
   invalidar refresh tokens entre si — manter `revokeRefreshToken: false`.
4. `POST /api/auth/logout` limpa os cookies e devolve a `logoutUrl` do SSO.

### Permissões — CASL (`@citybox/clinica-permissions`)

Fonte de verdade: [`../permissions/AGENTS.md`](../permissions/AGENTS.md).

- Gate do app: permission ID `vertical_access`. `hasBackofficeAccess` passa por `resolveBackofficePermissions` — realm roles `platform_admin` / `store_staff` e a role Keycloak `vertical.clinic.view` expandem para `vertical_access` (sem isso o `POST /api/auth/token` devolve `no_backoffice_access` quando o JWT só traz a realm role).
- Loja ativa: IDs CASL vêm de `GET /v1/members/me` (`StoreOption.permissions` + `isOrganizationOwner`). `clinicStrand` / `useStore().clinicStrand` ramifica UI: odontograma/HOF (odonto) vs **mapa anatômico** (fisio) vs **sem mapa** (nutrição, `locationUiType=none`); `locationUiType` por tratamento; **`showImc`** (fisio) → aba **Cálculo de IMC**; **`showNutritionInitializeFlow`** (nutrição) → botão Inicializar → sheet **fullscreen** (`CLINIC_FULLSCREEN_BOTTOM_SHEET_*`) com abas Anamnese / Corporal / Plano de procedimento; **conselho:** odonto CRM/CRO+UF, fisio **só CREFITO**, nutrição **CRN**+UF (Parte 6). Playbook: [`docs/vertentes-clinic-strand-playbook.md`](../docs/vertentes-clinic-strand-playbook.md).
- **Nomenclatura (UI, ago/2026):** a aba da ficha chama-se **Prontuário** (`value`/`rota` ainda `tratamentos`). No restante do produto o copy é **Procedimento(s)** (Adicionar Procedimento, planos, orçamento, comissões, PDFs). Código/Prisma/CASL IDs **não** mudam. Equipe: checkbox **Visualizar prontuário** (`manage` PatientTreatment). Anamnese clínica / LGPD / seeds internos continuam “anamnese”. Aplica-se a todas as vertentes via `clinica-web` compartilhado. Lista do Prontuário **não** exibe valor do procedimento (só Descrição + Ações; valor segue no Financeiro / orçamento). Fora da nutrição: checkboxes para selecionar vários ativos e **Finalizar N procedimentos** via `PATCH …/treatments/finalize` (mesma data/profissional; **uma** evolução no plural, ex. `… do dente 23, … do dente 26 foram finalizados.`); **Finalizar** da linha também usa o mesmo endpoint com 1 id. Nutrição (Inicializar) sem multi-select.
- UI: `useAbility` / `useCan` / `<Can>` em `src/features/clinic/permissions/`.
- Cargos clínicos (`CLINIC_ROLES`): `aluno` | `contador` | `dentista_admin` | `dentista` | `gerente` | `radiologia` | `secretario` | `vendedor` — presets via `permissionsForRole`; horários/agenda só `aluno`/`dentista`/`dentista_admin`.
- Vendas: `sales_access` abre o módulo; funis filtrados por `sales_view_funnel_*` (`canViewSalesFunnel`); mutações exigem `sales_manage_opportunities`.
- Marketing: finalizar campanha = `marketing_campaign_finalize` (`delete` Marketing), distinto de `update`.
- Detalhe Equipe/UX: [`src/features/clinic/AGENTS.md`](src/features/clinic/AGENTS.md) § Equipe.

`src/lib/vertical-permissions.ts` expande roles JWT → IDs CASL (`vertical_access`). Não usar mais `store.clinic.*` no front.

### Configuração no Keycloak

O client `citybox-backoffice` precisa aceitar a origem deste app.
Já adicionado em `infra/keycloak/import/citybox-dev-realm.json`:
`http://127.0.0.1:3113/*`, `https://clinica.citybox.com/*`,
`https://clinica.aplopes.com/*` (+ webOrigins).
Em Keycloak já provisionado, o `sync-realm.sh` mescla `CLINICA_ORIGIN`
(padrão `https://clinica.aplopes.com`) nos redirect URIs / webOrigins do client
`citybox-backoffice` — além do `BACKOFFICE_ORIGIN` do ERP.

---

## 4. Multi-clínica (store scoping)

`StoreProvider` (`src/lib/store-context.tsx`) carrega
`GET /api/proxy/clinica/v1/members/me` — a própria `clinica-api` responde onde o
usuário é `Member`, sem passar pelo `platform-api`. Cada clínica retornada vira uma
`StoreOption` cujo `id` é o **`clinicId`** (que, para a clínica raiz, é o mesmo valor
do antigo `storeId` — a Fase 3 preservou o id).

- 1 clínica → entra direto.
- Várias → `/selecionar-loja` (a escolha vai para `localStorage`
  `citybox-active-store`).
- Trocar de clínica volta para `/` — páginas de detalhe (`/pacientes/:id`)
  apontam para registros da clínica anterior.

Todo request de domínio passa `X-Store-Id` (`clinicaFetch` /
`clinicaUpload` em `src/features/clinic/shared/api/clinica-client.ts`). O proxy
revalida a membership via `assertUserCanAccessStore` antes de repassar.

---

## 5. Máquina de verticais (mantida de propósito)

`src/lib/vertical/*`, `vertical-branding-context`, `vertical-permissions-context`
e `shell/vertical-route-guard` foram mantidos com os **mesmos nomes e caminhos**
do ERP para não reescrever os ~1.100 arquivos de `features/clinic` que os
importam. O que mudou:

| Arquivo | Mudança |
|---|---|
| `lib/vertical/registry.ts` | só o manifest `clinic` |
| `lib/vertical/navigation-utils.ts` | `verticalBasePath()` → `'/'` (era `/${id}`) |
| `lib/store-routing.ts` | `verticalModulePath()` → `'/'`; `filterAccessibleStores` filtra clínica; `CLINIC_VERTICAL_ID` |
| `lib/modules.tsx` | só `CLINIC_MODULE` |
| `shell/lib/resolve-vertical-header.tsx` | sempre `VerticalTopbar` (sem branch do food) |
| `shell/components/erp-topbar.tsx` | header 3 colunas (`1fr` · busca centralizada · ações) |
| `shell/components/clinic-command-search.tsx` | input de busca no header + popover de resultados; atalho `⌘K` / `Ctrl+K` foca o campo |
| `features/search/` | busca global: navegação/atalhos (client) + entidades via FTS (`GET /v1/search` via `clinic-search.api.service`) filtrado por CASL no backend |

Sidebar: `AppSidebar` de **uma coluna** (`features/clinic/layout/clinic-erp-layout.tsx`),
não o `AppSidebarDual` de food/varejo. Tema em `features/clinic/lib/theme.ts`
(primária `#0891b2`).

**Não migrado** (era só de outras verticais): `vertical-erp-layout`,
`vertical-panel-menu`, `build-vertical-sidebar-nav`, `module-icons`,
`parse-vertical`, `create-minimal-navigation`, `session-events`, `lib/registry/*`.

---

## 6. Variáveis de ambiente

| Var | Escopo | Dev | Para quê |
|---|---|---|---|
| `NEXT_PUBLIC_KEYCLOAK_ISSUER` | público | `http://127.0.0.1:8080/realms/citybox-dev` | URL de authorize no browser |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT` | público | `citybox-backoffice` | client_id |
| `NEXT_PUBLIC_BACKOFFICE_ORIGIN` | público | `http://127.0.0.1:3113` | monta `redirect_uri` e `post_logout_redirect_uri` |
| `KEYCLOAK_BACKOFFICE_SECRET` | **server** | `citybox-backoffice-dev-secret` | client secret na troca de token. Obrigatório em produção (lança se ausente) |
| `KEYCLOAK_INTERNAL_ISSUER` | server | igual ao público | issuer server-side (evita hairpin no nginx) |
| `CLINICA_API_URL` | server | `http://127.0.0.1:3172/api` | upstream do proxy clínica |

`NEXT_PUBLIC_*` vai para o bundle do cliente — nunca colocar segredo com esse prefixo.

---

## 7. Comandos

```bash
pnpm --filter @citybox/clinica-web dev        # :3113
pnpm --filter @citybox/clinica-web build
pnpm --filter @citybox/clinica-web typecheck
pnpm --filter @citybox/clinica-web test

# Conjunto completo da clínica
pnpm dev:clinica    # platform-api + clinica-api + clinica-web
```

**Docker:** o `Dockerfile` deve copiar `packages/messaging/package.json` e
`apps/verticals/clinica/permissions/package.json` no stage `deps`, e no stage
`build` rodar **nesta ordem**: `pnpm --filter @citybox/messaging build` →
`pnpm --filter @citybox/clinica-permissions build` → `next build`. O package de
permissões importa `@citybox/messaging/clinic-strand` (exports → `dist/`).

Este app precisa apenas de `clinica-api` + Keycloak + Postgres. A `platform-api` segue
no `dev:clinica` porque é ela que provisiona a organização (via evento) quando o admin
cadastra um cliente — não porque a tela dependa dela em runtime. Ela não sobe sem
RabbitMQ — `pnpm infra:up`.

---

## 8. Débito herdado do ERP (baseline, não regressão)

Copiado junto com `features/clinic`; idêntico ao que existia no módulo `clinic`
do antigo `apps/erp` (removido em 2026-07-31 — ver §1):

- **14 erros de `tsc`** em `features/clinic` (resolvers do react-hook-form com
  `''` no union de cor, `mock-data.ts` desatualizado, casts em testes de
  dashboard). Por isso `next.config.ts` mantém
  `typescript.ignoreBuildErrors: true`, como o ERP. Remover ao zerar o baseline.
- **44 erros de ESLint**, todos dentro de `features/clinic`. A camada de infra
  (`lib/`, `shell/`, `components/`, `app/`) está **limpa**.
- **3 testes falhando** em `dashboard-side-cards.test.tsx` — as mesmas 3 do ERP.

O `eslint.config.mjs` daqui adiciona `argsIgnorePattern: '^_'` ao
`no-unused-vars` (o do ERP não tem), para as assinaturas mantidas por paridade
(ex.: `verticalBasePath(_verticalId)`).

---

## 9. Ao mexer aqui

- Rota nova do backoffice → criar dentro de `src/app/(clinic)/` e adicionar o
  leaf em `src/features/clinic/lib/navigation.ts` (paths **sem** `/clinic`),
  senão o `VerticalRouteGuard` redireciona para o fallback.
- Ícone do leaf → `src/features/clinic/lib/icons.ts`.
- Chamada nova à `clinica-api` → sempre por `clinicaFetch`/`clinicaUpload`
  (nunca `fetch` direto no domínio) para herdar `X-Store-Id`, retry de 401 e
  tradução de erro. **403 de permissão em mutations** (POST/PUT/PATCH/DELETE):
  modal global (`PermissionDeniedDialog`) com OK → reload. GET 403 não abre
  modal. Use `toastClinicaMutationError` nos onError para não duplicar aviso.
- **Agenda — compromisso sobre consulta:** create/update de compromisso pode
  devolver `displacedAppointments[]`; hooks invalidam `fitInQueryKeys` e o form
  mostra toast avisando envio para Gestão de Encaixe.
- **Inicializar (nutrição):** sheet fullscreen com abas Anamnese / Corporal /
  Plano; botão some após o primeiro save. Ao salvar com modelo, a API cria
  também uma `PatientAnamnesis` (`professional`/`issued`) — a query da aba
  Anamnese da ficha é invalidada (`anamnesisKeys`).
  - **Anamnese** — Select opcional dos modelos **ativos** de Configurações →
    Anamneses (`useAnamnesisTemplatesQuery` + perguntas via
    `getTemplateFormQuestions` / `PatientAnamnesisQuestionField`). Sem modelo,
    salva só Corporal/Plano. Motivo da consulta em `RichTextEditor`. Payload:
    `{ templateId, consultationReason, answers }`. Read-only e PDF leem o
    **snapshot** gravado (`parse-nutrition-init-anamnesis.ts`), com fallback
    para o JSON legado (`nutrition-anamnesis-questions.ts`). Tipos novos no
    editor de modelos: `rich_text` e `single_choice`.
  - **Corporal** — blocos separados por `Separator`: distribuição de gordura
    (ginoide/androide), cálculo de IMC, adipometria, perimetria, grau de
    celulite, estrias, observações, teste e tipo de diástase de reto abdominal
    (+ observações) e aparência percebida/desejada; catálogos em
    `lib/nutrition-body-composition.ts`, `lib/nutrition-girths.ts` e
    `lib/nutrition-appearance.ts`, imagens em `public/clinic/nutricao/`.
    Distribuição, grau de celulite, estrias e diástase usam o card cinza
    (`PatientNutritionImageChoice`); aparência usa o seletor por setas
    (`PatientNutritionAppearancePicker`, escala 1–9 por sexo).
  - **Plano de procedimento** — 5 editores (Plano de procedimento, Exames
    laboratoriais, Planejamento, Prescrição, Cuidados e home care); catálogo em
    `lib/nutrition-treatment-plan-fields.ts`.

  Nos catálogos corporais/plano os `id` (e os `value` das opções) **são
  persistidos**; alterá-los descarta conteúdo já gravado — mudar só o `label`
  é seguro.
- **Card da evolução (nutrição):** evoluções `apiSource === 'nutrition_init'`
  usam layout próprio na timeline — nome do tratamento, abas preenchidas
  (`Corporal, Plano de procedimento`) e `qui, 13 de agosto de 2026 • 16:58`
  (data + horário de `finalizedAt`/`initiatedAt`). O `initiatedAt` é montado por
  `toPatientNutritionInitiatedAt` (data do DatePicker + hora do salvamento) —
  não usar `toPatientTreatmentFinalizedAt` aqui, que fixa meio-dia e fazia todo
  atendimento aparecer às `12:00`. Os metadados vêm de
  `GET …/nutrition-inits` (`usePatientNutritionInitiationsQuery`, habilitada
  só na vertente nutrição) e são indexados por `evolutionId` em
  `lib/patient-nutrition-evolution-card.ts`. Esse card **não tem o menu de três
  pontos** — a única ação é o olho, porque tudo mais (nota, PDF, comparar,
  assinar) está no rodapé do sheet de visualização. O ícone de olho reabre o
  mesmo sheet com `readOnly`: campos travados, **sem abas** — Anamnese, Corporal
  e Plano de procedimento saem na mesma página, nessa ordem, separadas por título
  (`NutritionInitSection`) e `Separator` — e rodapé com Fechar, Adicionar
  nota, Baixar PDF, Comparar e Assinar atendimento. O botão de assinar só
  aparece com `signatureStatus === 'unsigned'`; em `pending`/`signed` ele vira
  **Ver assinatura** (sync ZapSign + `PatientSignatureIssuedDialog`), porque
  `POST …/signatures/evolutions` recusa o lote inteiro quando alguma evolução já
  tem assinatura. `handlePrepareSignEvolutions` também filtra por `unsigned`
  antes de gerar o PDF. O status vem da evolução da lista
  (`nutritionViewEvolutionLive`), não do snapshot guardado ao abrir o sheet.
  Com a evolução já `signed`, **Baixar PDF** entrega o documento da ZapSign
  (`fetchSignedPdfBlob` pelo `signatureRequestId`) — é o mesmo PDF que foi
  assinado, agora com as assinaturas; só cai no PDF gerado localmente se esse
  download falhar. Na nutrição, **Baixar PDF**,
  **Emitir evolução** e **Assinar evolução / Assinar atendimento** usam o mesmo
  documento de `build-patient-nutrition-pdf.ts`: carrega o pacote completo e as
  notas da API e inclui Anamnese, Corporal (medidas, resultados e imagens
  selecionadas), Plano de procedimento, notas e anexos (imagem embutida; demais
  arquivos pelo nome). No IMC, os resultados vêm identificados como **Tipo de
  obesidade** e **Grau de risco**. Emissão e assinatura passam pelo mesmo
  `buildEvolutionsPdfBlob` do `PatientTreatmentsTab`: quando **todas** as
  evoluções selecionadas são `nutrition_init`, sai o documento detalhado (um
  atendimento por página); qualquer outra combinação cai no gerador genérico de
  `build-patient-evolution-pdf.ts` (odonto/fisio). Assinar segue no fluxo de
  assinatura em lote — o que muda é só o PDF enviado ao paciente.
- **Comparar atendimentos (nutrição):** o botão Comparar fecha a visualização e
  abre o `PatientNutritionCompareSheet` — sheet fullscreen dividido ao meio por
  uma régua vertical, com um `Select` de atendimento de cada lado (o atendimento
  de origem entra pré-selecionado e o par é ordenado do mais antigo à esquerda
  para o mais recente à direita; a opção escolhida em um lado fica desabilitada
  no outro). Cada lado carrega o pacote completo por
  `usePatientNutritionInitiationQuery` e as métricas são montadas **pelos dois
  lados de uma vez** em `lib/patient-nutrition-compare.ts`, para que a mesma
  métrica caia na mesma altura — inclusive as medidas livres de perimetria, que
  entram pela união dos rótulos. Linhas sem valor nos dois lados (e grupos
  vazios) não são renderizadas; quando as duas células são numéricas, a direita
  ganha a variação em badge (`+1,20` azul / `-0,50` amarelo). Compara só a parte
  **Corporal**: peso,
  altura, IMC, distribuição de gordura, protocolo e medianas das dobras,
  perimetria, celulite, estrias, observações, diástase e aparência.
- **Notas do atendimento (nutrição):** "Adicionar nota" abre o
  `PatientNutritionNoteDialog` (`ModalForm` + `RichTextEditor toolbar="basic"` +
  um anexo opcional). As notas aparecem **no fim do sheet de visualização**,
  depois de Plano de procedimento, em ordem cronológica (mais nova por último),
  cada uma com `sex, 14 de agosto de 2026`, o HTML da nota e o link do anexo.
  Dados por `usePatientNutritionNotesQuery` / `usePatientNutritionNoteMutations`
  (`services/patient-nutrition-notes.service.ts`, upload via `clinicaUpload`;
  o anexo é servido pelo proxy autenticado, como as fotos do paciente).
  **Nota pode ser editada, nunca excluída** — a API não tem DELETE.
- **Tratamento já atendido não repete nem some:** os `treatmentId` das
  inicializações já salvas viram `concludedTreatmentIds` no
  `PatientBudgetTreatmentsPanel` — a linha perde o botão primário
  (Inicializar/Finalizar) e o **Excluir** do menu de ações (Ver débito e Editar
  continuam). **Ver débito** navega para
  `/pacientes/:id/financeiro?budgetItemId=:treatmentItemId` (só aquele item —
  funciona quando o orçamento foi aprovado **sem** parcelamento; com parcelas o
  filtro por item não aplica). A aba Financeiro lê o query param, lista com
  filtro server-side e oferece chip “Limpar filtro”. **Mostrar recebidos** inicia
  ligado por padrão. Lançamentos recebidos mostram badge do meio (Pix, Dinheiro,
  Crédito…) à esquerda do valor. Sem `treatmentItemId`, toast
  de débito inexistente.
  **Editar débito** (menu da tabela): qualquer lançamento `pending` (avulso ou
  `budget_approve`). Modal com abas (sem título extra) trava paciente/vencimento/plano/tratamento/dente;
  editáveis: valor, dentista (quando há card de procedimento), observações e
  Documentos (anexos MinIO via
  `…/financial-entries/:id/attachments`). Parcelas sem `budgetItemId` mostram
  nome RO + valor + obs. Recebidos continuam bloqueados.
  O toggle **Mostrar finalizados** também usa esse set (via
  `filterBudgetTreatmentsForDisplay`): inicializados entram na lista de
  concluídos mesmo com `status=active`. Só vale na vertente nutrição, onde o
  tratamento segue `active` depois do atendimento; um tratamento novo
  (orçamento ou avulso) volta ao normal.
- **Copy por vertente no editar tratamento:** o placeholder do Diagnóstico sai de
  `storeTreatmentDiagnosisPlaceholder` (`@/lib/clinic-strand`) — dente/região na
  odontologia, região na fisioterapia, paciente quando não há mapa (nutrição).
- **Adipometria (aba Corporal):** o IMC vem das funções puras de
  `@/lib/patient-imc` (as mesmas da fisioterapia), calculado no próprio sheet e
  gravado como peso/altura — **não** cria registro em `body-metrics`. O protocolo
  de Petróski é opcional; ao selecioná-lo as dobras obrigatórias mudam por sexo
  (masculino: tricipital, subescapular, ilíaca, panturrilha; feminino: axilar,
  ilíaca, coxa, panturrilha — `other` segue o conjunto masculino, como na
  silhueta do IMC). Cada dobra obrigatória exige **no mínimo 2 medidas** válidas
  (a 3ª é opcional); a mediana é derivada das medidas digitadas e **não** é
  persistida. O cálculo (`lib/nutrition-petroski.ts`, Petroski 1995 + Siri)
  usa idade (`patientBirthDate` → `ageYearsFromBirthDate`), peso, altura e as
  4 medianas → densidade corporal, % gordura, massa gorda e massa magra
  (também não persistidos). Com cálculo válido, abaixo da tabela aparece um
  único bloco **Distribuição de gordura** (`patient-nutrition-petroski-charts.tsx`): barras das medianas
  de **todas** as dobras preenchidas (não só as 4 obrigatórias; o Σ do
  Petróski continua só com as obrigatórias) + pizza magra/gorda em **%**
  (`fatPercent` / `100 − fatPercent`). Sem subtítulo “Massa magra e massa
  gorda” e sem linha “Gordura corporal: X%” — a pizza e a legenda (à direita,
  um item abaixo do outro; nomes em preto, porcentagens `text-primary`)
  cobrem isso. Save do Inicializar bloqueia Petróski incompleto
  (`validatePetroskiBodyForSave`). O sexo chega por `patientGender` e a
  nascimento por `patientBirthDate` vindos do `PatientTreatmentsTab`.
- **Adicionar Procedimento (fisio):** procedimentos `locationUiType=none` **não**
  mostram o aviso “Este procedimento não exige seleção de região anatômica.”
  (só o texto de sessão, se houver). Nutrição já omite mapa e aviso
  (`usesAnatomicLocation = showToothMap || showBodyMap`).
- **PDF de anamnese:** `htmlToPlainText` no motivo da consulta (TipTap) —
  senão a 1ª linha vaza `<p>…</p>`. **Dados do Paciente** em duas colunas:
  nome/telefone/nascimento à esquerda; sexo/endereço à direita. Endereço no
  padrão do letterhead (`Rua, número, complemento, bairro, Cidade /UF, 00000-000`);
  quebra alinhada ao rótulo, sem recuo.
  Nutrição: `htmlToText` no PDF do atendimento. Card **Última evolução** (Sobre)
  mostra sempre o **nome do procedimento** (`evolutionNotes`); na nutrição não
  concatenar Observações das seções. Card **Assinaturas pendentes** (Sobre,
  acima de Última evolução): `GET …/patients/:id/signatures?status=pending`;
  só renderiza se `meta.total > 0`; linhas com data/`kind`/`N dias pendentes`
  (dias civis desde `requestedAt`, fuso clínica) + menu ⋮ Compartilhar
  (`PatientSignatureIssuedDialog` + poll) /
  Ver documento (PDF anamnese / preview contrato / PDF evolução) / Cancelar
  (`PatientCancelSignatureDialog` genérico → `cancelElectronicSignature`).
- **Comparar (nutrição):** badges de delta **+ azul** / **− amarelo**.
- **Perimetria (aba Corporal):** 9 medidas fixas do catálogo
  `lib/nutrition-girths.ts` (em `mm`) mais medidas livres criadas pelo
  profissional (`customGirths`, `id` gerado com `crypto.randomUUID()`; entradas
  sem rótulo são descartadas na leitura). As ilustrações ficam em
  `public/clinic/nutricao/perimetria/`; a `image` do catálogo é **opcional** —
  sem arquivo, o tooltip mostra só o texto.
- **Assinatura eletrônica (ZapSign):**
  - **Anamnese:** menu Emitir assinatura → se saldo 0, modal Loja (`/loja/assinatura-eletronica`);
    senão preview PDF (`PatientAnamnesisPdfSheet`
    mode `request-signature`) → botão Solicitar assinatura → se sem e-mail e sem
    skip local (`citybox.clinic.skip-anamnesis-email-prompt:{patientId}`), modal
    de e-mail opcional + toggle “Não mostrar novamente” →
    `requestAnamnesisSignature` → modal `PatientAnamnesisSignatureIssuedDialog`
    (card 1 signatário, copiar/WhatsApp). Coluna Assinatura: `unsigned` → badge
    cinza **Sem assinatura**; `pending` → **Pendente** + “Emitido: dd/MM/yyyy”
    (`requestedAt` da assinatura); `signed` → **Assinada**. Com `pending`, menu ⋮:
    Ver anamnese / Cancelar assinatura (confirmação → `cancelElectronicSignature`) /
    Compartilhar link assinatura (reabre o modal Issued). Após `signed`, o menu ⋮
    só mostra **Ver anamnese** e o preview usa o PDF
    assinado (MinIO/`signed-pdf`). Lista: sync ZapSign via `by-target` ao carregar
    pending + poll 5s com modal aberto; invalida React Query quando status vira
    `signed`.
  - **Evolução em lote:** Assinar evolução → modal seleção (Emitir documento) →
    preview PDF (`request-signature`) → Solicitar assinatura →
    `requestEvolutionBatchSignature` → `PatientSignatureIssuedDialog`
    (card/WhatsApp/copiar) + poll por `by-target` (`evolution_batch`). Sem modal de e-mail.
    Ao carregar lista, sync ZapSign nas evoluções `pending` (1× por lote).
    Badge na timeline: `unsigned` → **Sem assinatura**; `pending` → Pendente;
    `signed` → **Assinada** (menu ⋮ só Baixar documento + Histórico).
  - **Contrato:** modal `PatientContractSignatureRequestSheet` (política ZapSign +
    editar e-mail) → accordion de signatários no preview; e-mail automático no
    request. Orçamento aprovado: ícone de contrato na tabela → emitir (`budgetId`)
    / ver. PDF gerado no browser (`fileBase64`); 1 doc ZapSign = 1 crédito; cancelar
    não reembolsa. Preview abre accordion com `by-target` **sem** `sync` (rápido);
    poll a cada 5s com `?sync=true`. Termos de consentimento fora de escopo. Detalhe em
    `src/features/clinic/AGENTS.md` §5.12b e `../api/AGENTS.md` (módulo signatures).
  - **Aprovar orçamento:** botão Aprovar no sheet abre `PatientBudgetApproveDialog`
    (confirmação com total, vencimento default=hoje, resumo de receitas e aviso de
    contrato se o toggle estiver ativo). **Sem parcelamento:** um vencimento +
    `dueDate` no PATCH. **Com parcelamento:** select de N parcelas (do sheet, editável
    1–24×), grade Parcela/Vencimento/Valor (só vencimento e valor editáveis; alterar
    valor redistribui nas demais mantendo o saldo); resumo com **Condições de
    pagamento** `Nx`; confirma envia `dueDate` + `installments[{dueDate,valueCents}]`
    no `PATCH …/budgets/:id/status` (`status=approved`).
  - **Lista de procedimentos** (ícone info na tabela de orçamentos): cada item
    com valor unitário cheio; rodapé com **Subtotal / Desconto / Total** (o
    desconto explica a diferença vs. `finalValueCents` / financeiro).
- Listagem tabular → busca/ordenação/paginação **no backend** (seção 8.1 do
  AGENTS raiz).
- Mudou porta, env, dependência ou rota pública → atualize este arquivo **e** o
  `AGENTS.md` raiz (seções 3 e 9).
