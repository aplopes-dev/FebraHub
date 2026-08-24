# Implementation Plan: 022 — Acesso, Scroll e UX do Menu Fiscal

**Feature dir**: `specs/erp/022-fiscal-acesso-scroll-ux` · **Branch**: acumulada em `feat/fiscal-api`

## P1 — CompanyAccessPolicy reconhece `erp.memberships`

`Organization`, `Membership` e `User` do erp-api vivem no schema `erp`, **mesmo
banco Postgres** (`citybox`) que `fiscal.companies`/`platform.members`/
`platform.store_members` — a policy já faz `$queryRaw` cross-schema para o
caminho admin; o caminho ERP é a mesma técnica, schema diferente.

Ponte: `fiscal.companies.store_id` (uuid) == `erp.organizations.platform_store_id`
(text, nullable, unique) == `platform.stores.id` (não consultado aqui).

```sql
-- Caminho A (admin, existente) OR caminho B (ERP, novo) — UNION, não LEFT JOIN,
-- pra não precisar de COALESCE/OR com NULLs cruzados.
SELECT TRUE AS allowed
FROM fiscal.companies c
JOIN platform.store_members sm ON sm.store_id::uuid = c.store_id
JOIN platform.members m ON m.id = sm.member_id
WHERE c.id = $1::uuid AND m.keycloak_sub = $2
UNION
SELECT TRUE AS allowed
FROM fiscal.companies c
JOIN erp.organizations o ON o.platform_store_id::uuid = c.store_id
JOIN erp.memberships ms ON ms.organization_id = o.id
JOIN erp.users u ON u.id = ms.user_id
WHERE c.id = $1::uuid AND u.keycloak_sub = $2 AND ms.active = TRUE
LIMIT 1
```

Decisões:
- **`o.platform_store_id::uuid = c.store_id`** — cast explícito (mesmo padrão
  já usado pro lado `platform`). `platform_store_id` nulo nunca casa (comparação
  com NULL é sempre falsa) — cobre "company sem organização ERP" = nega,
  sem branch extra (FR-P1-002 sai de graça da semântica SQL).
- **`ms.active = TRUE`** — vínculo desativado não dá acesso (mesmo espírito do
  `active` em `Membership`, já usado em toda a autorização do erp-api).
- **`UNION` em vez de duas queries separadas** — uma viagem ao banco, não duas;
  o Postgres já faz short-circuit se o primeiro braço achar linha (não é bem
  short-circuit real com UNION, mas o plano é trivial pra uma tabela pequena
  com índice único em `companies.id`/`store_id` — sem preocupação de perf aqui,
  mesma ordem de grandeza da query atual).
- Erro de qualquer um dos dois caminhos continua caindo no `catch` existente →
  nega (comportamento preservado).
- **Não** declarar `Organization`/`Membership`/`User` no `schema.prisma` da
  fiscal-api (Princípio V) — a query crua já é o padrão aceito aqui.

### Testes obrigatórios (integração, banco real — mesmo padrão dos specs de integração já existentes em `tests/integration/`)
1. Lojista do ERP (`erp.memberships` ativo, sem linha em `platform.store_members`) → `canActFor` `true`.
2. Lojista de **outra** organização (nenhum vínculo com a `Company` alvo) → `false`.
3. Vínculo do ERP **inativo** (`ms.active = false`) → `false`.
4. Token de serviço sem `X-Acting-Sub` (sub `'unknown'`) → `false` (já coberto por `applyActingSub`, reforçar aqui a integração ponta a ponta da policy).
5. Caminho admin (`platform.store_members`) segue funcionando — não-regressão.
6. `Company` sem organização ERP correspondente (`platform_store_id` nulo em todas) → `false`.

## P2 — Scroll: `FiscalScrollableForm` (novo, `packages/mui` ou local)

Em vez de tocar `apps/erp/web/src/proxy` layout/shell (fora de escopo — "não
mexer no overflow do shell/body"), cada página fiscal passa a envelopar seu
conteúdo com o padrão já usado em `/catalogo/produtos/novo`
(`ScrollArea` de `@citybox/mui` dentro de um container full-bleed `m: -3`).

Decisão: extrair um wrapper local `apps/erp/web/src/components/ui/form/fiscal-scrollable-page.tsx`
(`FiscalScrollablePage`, molde do wrapper que `ProductCreatePage` monta
manualmente) em vez de repetir o `Box m:-3 + ScrollArea` cru em ~20 arquivos —
DRY, e um único lugar pra manter se o padrão mudar. Aceita `children` e
opcionalmente reaproveita `PageHeader`/`EntityFormHeader` já usados em cada
página (não substitui esses, só resolve o scroll).

Aplicado em (todas as `pages/*.tsx` das features abaixo, envolvendo o retorno
existente sem mudar a estrutura interna):
`fiscal-certificate`, `fiscal-settings`, `pos-fiscal-document-type`,
`fiscal-default-taxes` (vira o hub em P3 — aplica lá), `fiscal-invoice-series`,
`fiscal-icms-group`/`fiscal-ipi-group`/`fiscal-pis-cofins-group`/
`fiscal-issqn-group` (ou a tela unificada de P3, se essa entrar primeiro —
decisão de sequência: **P3 primeiro nos grupos**, porque criar o scroll duas
vezes nas 4 telas antigas para descartar em seguida é retrabalho; as demais
telas de P2 são feitas na ordem do FR-P2-003), `fiscal-additional-info`,
`fiscal-operation-natures`, `nfse-issuance`.

## P3 — Hub de Padrões Fiscais + Grupos Fiscais unificados

### D1 — Rota unificada `/configuracoes/fiscal/grupos`
Substitui `grupos-icms`, `grupos-ipi`, `grupos-pis-cofins`, `grupos-issqn`.
Abas por tributo (`?tributo=icms|ipi|pis_cofins|issqn` na URL, molde
`fiscal-additional-info` que já usa aba-por-querystring). Cada aba: listagem
rica (nome, situação tributária, alíquota, produtos vinculados, excluir) +
`Novo grupo` abre o formulário já existente daquele tributo (reaproveita os 4
`*-form-view.tsx` já implementados — não reescreve a lógica de formulário, só
a casca de lista/navegação). Rotas antigas (`/grupos-icms` etc.) viram
`redirect()` para a nova rota com o `?tributo=` certo — não quebra link salvo.

### D2 — Listagem rica: quantos produtos usam o grupo
Os 4 módulos (`fiscal-defaults` no erp-api) já expõem
`GET /v1/fiscal-{tributo}-groups/:id/products` (usado pela aba Produtos de
cada form) — a listagem busca a contagem via `products.length` dessa mesma
rota por grupo, ou (mais barato) o backend ganha um campo `productCount` no
presenter da listagem (`ListFiscalGroupsUseCase`) para não fazer N+1 chamadas
do front. **Decisão: contagem no backend** — evita N+1 requests da listagem.

### D3 — Excluir grupo
Nova rota `DELETE /v1/fiscal-{tributo}-groups/:id` em cada um dos 4 módulos
(`fiscal-defaults`), bloqueando com 409 quando: `productCount > 0` **ou** o
grupo é referenciado em `FiscalDefaultTaxes` da organização (padrão atual).
Mensagem de erro nomeia a razão específica.

### D4 — Hub de Padrões fiscais
`fiscal-default-taxes-form.tsx` vira `fiscal-default-taxes-hub.tsx`: 4 cards
(um por tributo) em grid, cada um com nome do grupo padrão / "Nenhum padrão
definido", contagem de grupos, botão "Gerenciar grupos de X" (leva pra
`/configuracoes/fiscal/grupos?tributo=X`) e o próprio `SelectField` de padrão
inline no card (não perde a função de escolher o padrão, só ganha contexto
visual). CFOP padrão + links de Informações adicionais/Naturezas de operação
continuam abaixo dos cards, sem mudança de comportamento.

## Gates & reviewers
- `database-reviewer`: migration não é necessária para P1 (query crua, sem
  schema change) nem D2/D3 (campo derivado, `DELETE` sem nova tabela) — **sem
  migration nesta feature**. Revisar mesmo assim a query SQL crua do P1
  (índices, cast, injeção — tudo parametrizado via Prisma `$queryRaw` template
  tag, já seguro).
- `react-reviewer` + `typescript-reviewer`: todo `.tsx` novo/tocado.
- `security-reviewer`: **obrigatório** em P1 (autorização) — cross-tenant,
  fail-closed, `UNION` não pode virar `OR` que abre brecha com `NULL`.

## Docs-as-code
`apps/erp/web/AGENTS.md` (rota unificada de grupos, hub de padrões, wrapper de
scroll) + `services/fiscal-api/AGENTS.md` (policy) + GUIA.md de
`fiscal-default-taxes` e das 4 features de grupo (viram uma seção só,
apontando pra rota unificada).
