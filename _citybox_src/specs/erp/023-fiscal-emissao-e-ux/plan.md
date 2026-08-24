# Implementation Plan: 023 — Fiscal: emissão, deploy, scroll e novas seções

**Feature dir**: `specs/erp/023-fiscal-emissao-e-ux` · **Branch**: acumulada em `feat/fiscal-api`

## Ordem de execução (conforme prompt, justificada)

1. **N2** — deploy da `erp-api` (nada mais é validável em produção sem isso; é o único item puramente operacional).
2. **N1** — permissão de escrita de Séries (desbloqueia o produto).
3. **N3 + N4 + N5** — baratos, mesmas telas de N7.
4. **N7** — UX de Outros cadastros fiscais.
5. **N6** — Justificativas padrão (maior fatia, mexe em 2 serviços + migration).

## N2 — Deploy da erp-api

Achado confirmado: a sessão anterior (spec 022) rebuildou e redeployou `fiscal-api` e `erp-web`, mas **esqueceu `erp-api`** — exatamente o serviço que ganhou `toHttpRichList`/`DELETE /v1/fiscal-{tributo}-groups/:id`. Não há bug de código a corrigir; é `docker compose --env-file ../platform-apps.env build erp-api && ... up -d erp-api` a partir de `services/platform/`.

**Gate de processo proposto** (achado do prompt: "a UI nova não deveria subir antes da API que ela consome"): não há suporte automático de deploy condicionado neste pipeline (não é um orquestrador com dependência de grafo entre apps — é `docker compose up -d <serviços escolhidos à mão>`). Mitigação aceita nesta feature: documentar no `AGENTS.md` raiz (seção de deploy) a regra "ao subir uma imagem nova de frontend que consome uma API alterada na mesma sessão, sempre subir as duas juntas — nunca só o app visível" + adicionar um checklist manual ao final desta feature (T-DEPLOY) que builda **todos** os apps tocados na sessão antes de reportar conclusão. Automatizar isso (ex.: script de deploy que lê o diff e decide quais serviços subir) fica fora de escopo — proposto como follow-up, não implementado aqui.

## N1 — Permissão de escrita de Séries

Decisão do usuário: `fiscal.sequences.manage` é permissão nova e legítima.

```ts
const FISCAL_PERMISSIONS = [
  'fiscal.companies.manage',
  'fiscal.certificates.manage',
  'fiscal.documents.manage',
  'fiscal.documents.view',
  'fiscal.sequences.manage',       // novo
] as const;

fiscal_operator: [
  'fiscal.companies.manage',
  'fiscal.certificates.manage',
  'fiscal.documents.manage',
  'fiscal.documents.view',
  'fiscal.sequences.manage',       // novo
];
```

`platform_admin`/`platform_admin_client` herdam automaticamente via `...FISCAL_PERMISSIONS`.

### Achado extra durante a auditoria (FR-002)

Ao levantar toda string usada em `@RequirePermission(...)` na fiscal-api para escrever o teste de exaustividade, apareceu uma **segunda permissão fantasma**: `modules/nfse/.../list-nfse-events.route.ts` usa `@RequirePermission('fiscal.documents.read')` — que também não existe em `FISCAL_PERMISSIONS`/`ROLE_PERMISSIONS`. É uma rota `GET` (leitura), e toda outra rota de leitura da fiscal-api usa `fiscal.documents.view` — claramente o mesmo padrão de erro de digitação que causou N1. Correção: trocar `fiscal.documents.read` → `fiscal.documents.view` (não criar uma terceira grafia). Sem esse teste, este segundo bug ficaria dormente até alguém sem `platform_admin` tentar ver a timeline de eventos de uma NFS-e.

### Teste de exaustividade (FR-002, prioridade alta pedida no prompt)

Novo spec `permissions.exhaustive.spec.ts`: usa `ts-morph` ou uma regex simples sobre os arquivos `**/*.route.ts` para extrair todo literal passado a `@RequirePermission(...)`, e afirma que cada um está presente em `FISCAL_PERMISSIONS` **ou** é `platform.admin`. Decisão: regex sobre o código-fonte (não reflection em runtime) — mais simples, roda sem subir o Nest, e é exatamente o tipo de checagem estática que pega o erro no CI antes do deploy.

## N3 — Scroll dos formulários de grupo

`FiscalScrollablePage` (já existe, `apps/erp/web/src/components/ui/form/fiscal-scrollable-page.tsx`) aplicado nos `page.tsx`/componentes de:
- `grupos-icms/novo` + `grupos-icms/[id]` (via `IcmsGroupCreatePage`/`IcmsGroupEditPage`)
- `grupos-ipi/novo` + `grupos-ipi/[id]`
- `grupos-issqn/novo` + `grupos-issqn/[id]`
- `grupos-pis-cofins/novo` + `grupos-pis-cofins/[id]`
- `fiscal-additional-info-list-page.tsx` — na verdade **já tem** o padrão manual (`m:-3` + `ScrollArea`) desde a spec 022, confirmado por leitura de código; o achado do re-teste ("hoje não corta porque a lista está vazia, mas é latente") está desatualizado — **sem ação aqui**, só confirmar e registrar.

Varredura completa do Menu Fiscal (T-N3-SCAN): grep por toda página em `app/(app)/configuracoes/fiscal/**` e `app/(app)/vendas/nfse` que NÃO importe `FiscalScrollablePage` nem já tenha o padrão manual `ScrollArea`, para achar qualquer tela esquecida além das 4 já identificadas.

## N4 — `rateLabel`/`taxSituationLabel`

```ts
// antes
export function rateLabel(rate: number | null): string {
  return rate === null ? "—" : `${rate}%`;
}
// depois — cobre null E undefined (a causa real do "undefined%" em produção
// era o campo nem existir na resposta antiga da API, pré-deploy de N2)
export function rateLabel(rate: number | null | undefined): string {
  return rate == null ? "—" : `${rate}%`;
}
```

Mesma checagem `== null` em `taxSituationLabel` (já tem `if (!taxSituation) return "—"` — `!taxSituation` já cobre `undefined`/`null`/`""`, então essa função está correta; só o tipo do parâmetro é estreitado, sem checagem nova).

## N5 — Erro "Forbidden" cru

`apps/erp/web/src/lib/api/business-error-message.ts` ganha um branch para status 401/403 (a mesma função que já filtra `ValidatorDomainError`/5xx). Mensagem: "Seu usuário não tem permissão para realizar esta ação." — genérica o bastante para servir a todo formulário fiscal que a usa (10 já usam o helper), sem hardcodar "séries" nela.

## N7 — Outros cadastros fiscais vira cards

D1: contagem de Informações adicionais e Naturezas de operação.
- Naturezas de operação: `GET /v1/operation-natures` já devolve a lista inteira sem paginação (confirmado em `operation-nature-list-page.tsx` — `naturesQuery.data`) → `.length` no cliente, sem endpoint novo.
- Informações adicionais: `GET /v1/fiscal-additional-infos` é **por tipo de documento** (`?documentType=`) — para mostrar "quantas ao todo" seria preciso 3 chamadas (NFE/NFCE/NFSE) ou um endpoint agregado novo. Decisão: **endpoint novo** `GET /v1/fiscal-additional-infos/count` (erp-api, `{ data: { NFE: n, NFCE: n, NFSE: n, total: n } }`) — uma query `groupBy` por `documentType`, mesmo padrão de `countProductsByGroup` da spec 022. Evita 3 round-trips do cliente pra um número.

D2: `fiscal-default-taxes-hub.tsx` ganha 2 cards novos no mesmo grid dos 4 de tributo (6 cards ao todo, grid mantém `repeat(2, 1fr)` — cabe bem em 3 linhas de 2). Cada card: título, contagem (ou estado vazio explicando a finalidade), botão "Gerenciar X" apontando para a rota existente (`/configuracoes/fiscal/informacoes-adicionais`, `/configuracoes/fiscal/naturezas-operacao`).

## N6 — Justificativas padrão

Escopo (decisão do usuário): só os 2 campos de justificativa. "Vendas e base de cálculo" e "Outras configurações" continuam "Em breve" — **sem mudança nelas nesta feature**.

### Persistência — `fiscal-api`, entidade `Company`

```prisma
// Company, novas colunas nuláveis
inutilizationJustification String? @map("inutilization_justification")
cancellationJustification  String? @map("cancellation_justification")
```

Migration nova em `services/fiscal-api/prisma/`. `CompanyProps`/`UpdateCompanyInput` ganham os 2 campos; `CompanyValidatorFactory` ganha a regra 15–255 caracteres **quando preenchido** (campo é opcional — `Company` pode não ter justificativa padrão ainda), mesma mensagem já usada em `InutilizeNfeHttpDto`/`CancelNfeHttpDto` (extrair para uma constante compartilhada `JUSTIFICATION_LENGTH` em vez de duplicar o literal 15/255 uma terceira vez).

`UpdateCompanyDto`/`update-company.route.ts` (já usados pela aba Configurações gerais) ganham os 2 campos no payload aceito.

### Limitação declarada (não implementada nesta feature)

`InutilizeNfeUseCase`/`CancelNfeUseCase` (e os equivalentes NFC-e/NFS-e) **não são alterados** para usar a justificativa padrão como fallback — hoje **não existe nenhuma tela em `erp-web` que chame essas rotas** (inutilizar/cancelar documento é 100% backend, sem frontend ainda; confirmado por busca no código). Pré-preencher um formulário que não existe não é um requisito executável. Os 2 campos ficam persistidos e disponíveis via `GET /v1/companies/:id` para o dia em que esse frontend for construído — valor de "padrão salvo" sem o "aplicado automaticamente ao emitir", que fica registrado como fora de escopo (Assumptions do spec.md atualizadas).

### Frontend — `fiscal-settings`

`disabled-soon-sections.tsx` perde a seção "Justificativas padrão" (os 2 `SoonField`); ela migra para `fiscal-settings-tab.tsx`/`fiscal-settings-form.tsx` como campos reais (`Input` multiline, validação de 15 caracteres no `onBlur`/submit, mesmo padrão dos demais campos da aba), no mesmo `PATCH` que já salva regime/IE/IM.

## Gates & reviewers

- `database-reviewer`: migration de `Company` (N6) — colunas nuláveis, sem dado a migrar, seguro.
- `security-reviewer`: **obrigatório** em N1 (mapa de permissões).
- `react-reviewer` + `typescript-reviewer`: todo `.tsx`/`.ts` tocado.
- Nenhuma outra migration nesta feature.

## Docs-as-code

`services/fiscal-api/AGENTS.md` (permissão nova + achado da segunda permissão fantasma + campos novos de `Company`), `apps/erp/web/AGENTS.md` (scroll nos 4 formulários de grupo, N7, N6), `apps/erp/api/AGENTS.md` (endpoint de contagem de informações adicionais, se acabar vivendo lá — decidir na implementação: como `fiscal-additional-info` já é módulo do erp-api, o count fica lá), `AGENTS.md` raiz (gate de deploy proposto em N2), GUIA.md de `fiscal-settings`, `fiscal-default-taxes`, `fiscal-additional-info`, `fiscal-operation-natures`.
