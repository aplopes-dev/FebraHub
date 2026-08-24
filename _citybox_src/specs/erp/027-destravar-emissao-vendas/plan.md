# Implementation Plan: Destravar emissão de NF-e/NFS-e (URL base da fiscal-api)

**Branch**: `027-destravar-emissao-vendas` | **Date**: 2026-08-15 | **Spec**: `specs/erp/027-destravar-emissao-vendas/spec.md`

**Input**: Feature specification from `specs/erp/027-destravar-emissao-vendas/spec.md`

## Summary

Bug de configuração isolado: `FISCAL_API_URL` do serviço `erp-api` — tanto em produção
(`services/platform/docker-compose.yml`) quanto no molde (`apps/erp/api/.env.example`) — está
sem o sufixo `/api` que o prefixo global da fiscal-api exige (`app.setGlobalPrefix('api')`).
Toda chamada de resolução do Emitente (`GET {FISCAL_API_URL}/v1/companies?cnpj=`) cai em 404,
que o `HttpFiscalApiClient` traduz para "Não foi possível resolver o Emitente fiscal da
organização" — travando as duas telas de emissão (NF-e e NFS-e) antes mesmo delas tentarem
falar com o órgão fiscal. Causa e evidência já vieram prontas no diagnóstico original
(`prompt-fiscal-027.md`) e foram reconfirmadas nesta sessão via log de produção (9 ocorrências
de `[FiscalBusiness] ... HTTP 404`). Correção: 2 arquivos de configuração + normalização
defensiva no client HTTP (decisão do clarify: normalizar + logar aviso, não falhar o boot) +
2 ajustes triviais de UX nas mesmas telas.

## Technical Context

**Language/Version**: TypeScript 5.8, NestJS 11 (`apps/erp/api`), Next.js 16 + React 19 (`apps/erp/web`)

**Primary Dependencies**: Nenhuma nova. Reusa `HttpFiscalApiClient` já existente em
`modules/nfse-issuance` e `modules/nfe-issuance` (spec 025/026).

**Storage**: N/A — nenhuma mudança de schema/dado. `FISCAL_API_URL` é variável de ambiente.

**Testing**: Jest (erp-api) — teste da função de normalização da URL base; sem teste de
frontend novo (segue o gap já documentado no `AGENTS.md`).

**Target Platform**: `apps/erp/api` (:3114) + `apps/erp/web` (:3107); deploy via
`services/platform/docker-compose.yml`.

**Project Type**: Correção de configuração + pequeno hardening defensivo, dentro do monorepo
Turborepo existente.

**Performance Goals**: N/A.

**Constraints**: Correção mínima e cirúrgica — **não** tocar lógica de negócio, autenticação,
guarda de ambiente PRODUCTION, avisos de fallback fiscal nem o padrão visual `EntityFormFooter`
já validados e funcionando (FR-005 da spec, lista explícita do que não regredir).

**Scale/Scope**: 2 pacotes (`apps/erp/api`, `apps/erp/web`), ~6 arquivos.

## Constitution Check

Sem `.specify/memory/constitution.md` custom — gates efetivos são os do `CLAUDE.md`/`AGENTS.md`
raiz. Nenhuma migration, nenhuma rota nova, nenhuma superfície de auth tocada — `security-reviewer`
não é obrigatório por essas regras, mas como a correção toca o client que resolve o Emitente
fiscal (superfície sensível por natureza, mesmo sem mudança de lógica de auth), rodar de qualquer
forma como checagem barata. Nenhuma violação identificada.

## Project Structure

### Documentation (this feature)

Convenção do repositório (specs 022-026): **um único `plan.md` consolidado**, sem
`research.md`/`data-model.md`/`contracts/`/`quickstart.md` separados.

```text
specs/erp/027-destravar-emissao-vendas/
├── spec.md
├── plan.md              # este arquivo
├── tasks.md              # gerado por /speckit-tasks
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
services/platform/docker-compose.yml
  # linha ~137, env do serviço `erp-api`: FISCAL_API_URL: http://fiscal-api:3116
  # → http://fiscal-api:3116/api (FR-002)

apps/erp/api/
├── .env.example                                     # linha 53 (FR-003)
└── src/modules/
    ├── nfse-issuance/infrastructure/providers/
    │   ├── http-fiscal-api-client.ts                # baseUrl() normaliza (FR-004)
    │   └── http-fiscal-api-client.spec.ts            # ESTENDER: casos de normalização
    ├── nfe-issuance/infrastructure/providers/
    │   ├── http-fiscal-api-client.ts                # baseUrl() normaliza (FR-004)
    │   └── http-fiscal-api-client.spec.ts            # ESTENDER: casos de normalização
    └── shared? — ver Design D2 abaixo (decisão: duplicar 3 linhas, não extrair função)

apps/erp/web/
└── src/features/
    ├── nfse-issuance/pages/nfse-issuance-page.tsx     # subtítulo dinâmico (FR-006)
    └── nfe-issuance/pages/nfe-issuance-page.tsx        # noOptionsText do Autocomplete (FR-008)
                                                          # + conferir subtítulo (FR-007, provável no-op)
```

**Structure Decision**: correção cirúrgica dentro dos módulos já existentes (`nfse-issuance`,
`nfe-issuance`) — nenhum módulo/feature novo, nenhuma migration.

## Design — decisões por item

### D1. `FISCAL_API_URL` — correção de valor (FR-001, FR-002, FR-003)

- `services/platform/docker-compose.yml`: `FISCAL_API_URL: http://fiscal-api:3116` →
  `http://fiscal-api:3116/api` (mesmo valor que o `erp-web` já usa corretamente na mesma linha
  de baixo do arquivo, `:247` — só copiar o padrão certo).
- `apps/erp/api/.env.example:53`: `FISCAL_API_URL=http://127.0.0.1:3116` →
  `FISCAL_API_URL=http://127.0.0.1:3116/api`.
- Sem mudança no default do código (`DEFAULT_FISCAL_API_URL` já está certo nos dois
  `http-fiscal-api-client.ts`).

### D2. Normalização defensiva em `baseUrl()` (FR-004 — decisão do clarify: normalizar, não falhar boot)

Cada `HttpFiscalApiClient` (`nfse-issuance` e `nfe-issuance`, hoje dois arquivos separados por
decisão da ADR C-17/spec 026 — não consolidar em pacote comum) ganha a mesma lógica pequena em
`baseUrl()`:

```ts
private baseUrl(): string {
  const raw = process.env.FISCAL_API_URL ?? DEFAULT_FISCAL_API_URL;
  const trimmed = raw.replace(/\/+$/, ''); // remove barra(s) final(is)
  if (trimmed.endsWith('/api')) return trimmed;
  this.logger.warn(
    `[FiscalConfig] FISCAL_API_URL="${raw}" não termina em "/api" — normalizando para "${trimmed}/api". Corrija a variável de ambiente.`,
  );
  return `${trimmed}/api`;
}
```

**Por que duplicar em vez de extrair uma função compartilhada**: os dois arquivos já são
cópias paralelas intencionais (mesmo padrão do token de serviço, spec 026 D2/Structure
Decision) — soma 8 linhas cada, extrair uma função de 8 linhas para um terceiro arquivo
compartilhado dentro da mesma erp-api é over-engineering pra esse tamanho de correção
(YAGNI). Se um terceiro client fiscal aparecer no futuro, aí sim vale extrair.

**Log novo**: prefixo `[FiscalConfig]`, distinto de `[FiscalAuth]`/`[FiscalTransport]`/
`[FiscalBusiness]` já existentes — é uma quarta categoria (erro de configuração, detectado e
autocorrigido, não uma falha de request). Preserva a disciplina de log que já ajudou a
diagnosticar este bug.

**Edge case (spec, Edge Cases §3)**: valor claramente inválido (string vazia) — `raw` vazio
faz `trimmed = ''`, `''.endsWith('/api')` é `false`, então o código tentaria devolver
`'/api'` (URL relativa inválida). Ajuste: se `trimmed` ficar vazio após o trim, cair direto no
`DEFAULT_FISCAL_API_URL` (já correto) em vez de montar `/api` sozinho — com o mesmo log de
aviso.

### D3. Subtítulo dinâmico da tela de NFS-e (FR-006)

`nfse-issuance-page.tsx:134` — `description="Emissão de nota fiscal de serviço (Padrão
Nacional) — ambiente de homologação."` perde a menção fixa a "ambiente de homologação" (o
selo abaixo, já dinâmico desde a spec 025, é quem informa isso — duplicar a informação em
dois lugares foi o que criou a contradição quando divergem). Nova descrição: "Emissão de nota
fiscal de serviço (Padrão Nacional)." — sem menção a ambiente.

### D4. Conferência da tela de NF-e (FR-007)

Inspecionado nesta sessão de planejamento: `nfe-issuance-page.tsx:152` já não menciona
ambiente no subtítulo ("Emissão de NF-e a partir de um pedido de venda, com a parametrização
fiscal real do produto.") — o selo de ambiente já é a única fonte dessa informação nessa
tela. **Achado**: FR-007 é um no-op — nenhuma mudança necessária, só confirmar e documentar
(evita a tarefa de implementação achar um problema que não existe).

### D5. `noOptionsText` em português (FR-008, FR-009)

`Autocomplete` de `@citybox/mui` (`packages/mui/src/molecules/autocomplete/autocomplete.tsx`)
já repassa qualquer prop do MUI `Autocomplete` via `...props`, incluindo `noOptionsText` — sem
mudança no design system, só passar a prop no uso:

- `nfe-issuance-page.tsx` (`Autocomplete` de pedido de venda, ~linha 224): adicionar
  `noOptionsText` com texto explicando o pré-requisito + link para
  `/vendas/pedidos-de-venda` (mesmo padrão de `EmptyState` com link já usado em
  `nfse-issuance-page.tsx` para o Grupo de ISSQN vazio, spec 025). Como `noOptionsText` do MUI
  aceita `ReactNode`, pode ser um texto com `<Link>` embutido, não só string.
- Varredura (FR-009): grep por `noOptionsText`/`Autocomplete` nas duas telas — o
  `Autocomplete` de cliente/tomador em `nfse-issuance-page.tsx` (~linha 210) também não define
  `noOptionsText`; avaliar na implementação se merece o mesmo tratamento (lista de clientes
  vazia é um caso bem mais raro que lista de pedidos fechados vazia, mas a spec pede varrer
  "outros achados").

## Complexity Tracking

Nenhuma violação de constituição. Escopo é deliberadamente pequeno — 2 arquivos de config, 2
pequenas normalizações de URL (uma por client, sem extração especulativa), 2 ajustes de texto.
