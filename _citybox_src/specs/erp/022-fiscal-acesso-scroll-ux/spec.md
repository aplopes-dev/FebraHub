# Feature Specification: Acesso, Scroll e UX do Menu Fiscal (022)

**Feature Branch**: `022-fiscal-acesso-scroll-ux` (acumulada em `feat/fiscal-api`)

**Created**: 2026-08-14

**Status**: Draft

**Input**: `specs/erp/021-correcoes-fiscal/prompt-fiscal-022.md`, achados de
`reteste-menu-fiscal-2026-08-14.md` (re-teste em produção, logado como lojista comum).

## Contexto

Re-teste do Menu Fiscal em `backoffice.aplopes.com` após o bugfix de `c24f7851a`
(spec 021) encontrou 3 problemas: um bug de autorização que persiste (P1), scroll
quebrado em toda a área fiscal (P2) e um pedido de UX para consolidar o
gerenciamento de grupos fiscais (P3).

## Clarifications

### Session 2026-08-14

- Q: P1 — a `StoreMembershipCompanyAccessPolicy` resolve dono via
  `platform.members`/`store_members` (admin-api), mas lojistas do ERP vivem em
  `erp.users`/`erp.memberships`. Qual caminho? → A: (a) a policy passa a
  reconhecer também o vínculo `erp.memberships`, mantendo a consulta read-only
  cross-schema e o Princípio V (sem tabela de outro serviço no `schema.prisma`).
- Q: P1 — quando a `Company` não tem organização ERP correspondente? → A: negar
  acesso (fail-closed) — não cair de volta no vínculo do admin.
- Q: P3 — Padrões fiscais vira hub ou continua formulário? → A: hub com cards
  por tributo (grupo padrão atual + contagem de grupos + atalho pro CRUD).
- Q: P3 — as 4 telas de grupo (ICMS/IPI/PIS-COFINS/ISSQN) unificam numa tela
  com abas, ou continuam em rotas separadas? → A: unificar numa única rota com
  abas por tributo.
- Q: P3 — que informação aparece na linha de cada grupo na listagem? → A:
  CST/CSOSN, alíquota (quando aplicável) e número de produtos vinculados.
- Q: P3 — falta ação de excluir grupo. Entra no escopo? → A: sim, com bloqueio
  quando o grupo está em uso (vinculado a produto ou é o padrão da organização).

## Requisitos *(mandatory)*

### P1 — Autorização (CRÍTICO)

- **FR-P1-001**: `StoreMembershipCompanyAccessPolicy.canActFor` DEVE permitir o
  acesso quando o `sub` do usuário tem vínculo **ou** em
  `platform.members`→`store_members` (fluxo admin) **ou** em `erp.users`→
  `erp.memberships` (fluxo ERP) com a organização cujo `platformStoreId` bate
  com `fiscal.companies.storeId`.
- **FR-P1-002**: Sem vínculo em nenhum dos dois modelos, a policy DEVE negar
  (fail-closed) — nunca liberar por omissão.
- **FR-P1-003**: `platform_admin` continua com bypass total (comportamento
  existente, não muda).
- **FR-P1-004**: A consulta ao schema `erp` é somente leitura, feita por SQL
  cru (mesmo padrão já usado para `platform.members`/`store_members`) — a
  fiscal-api não ganha um model Prisma para tabelas de outro serviço
  (Princípio V da constitution).
- **FR-P1-005**: Erro de consulta (qualquer um dos dois caminhos) nega, nunca
  libera (comportamento já existente, preservado).

### P2 — Scroll (ALTO)

- **FR-P2-001**: Toda tela fiscal listada abaixo DEVE permitir alcançar, por
  rolagem (mouse/trackpad) e por teclado (Tab), o último elemento da página —
  incluindo o botão de ação principal (Salvar/Enviar) — em viewport 1366×768 e
  1280×720.
- **FR-P2-002**: A correção DEVE adotar o padrão já existente no ERP
  (`apps/erp/web/AGENTS.md` §4.5): formulário full-bleed (`m: -3`) +
  `ScrollArea` de `@citybox/mui` + `EntityFormHeader`/`EntityFormFooter` — não
  inventar um novo padrão nem alterar o overflow do shell/body.
- **FR-P2-003**: Rotas cobertas: as 5 abas de `/configuracoes/fiscal`
  (certificado, geral, pdv, padroes, series); `/configuracoes/fiscal/grupos-*`
  (lista + `/novo` + `/[id]`, ICMS/IPI/PIS-COFINS/ISSQN — ou a rota unificada
  de P3, se implementada antes); `/configuracoes/fiscal/informacoes-adicionais`;
  `/configuracoes/fiscal/naturezas-operacao` (+ `/novo` + `/[id]`);
  `/vendas/nfse`.

### P3 — UX de Padrões Fiscais e Grupos (MÉDIO)

- **FR-P3-001**: `/configuracoes/fiscal?aba=padroes` DEVE virar um hub com um
  card por tributo (ICMS, IPI, PIS/COFINS, ISSQN), cada um mostrando: nome do
  grupo padrão atual (ou estado vazio com CTA), contagem de grupos cadastrados
  do tributo, e atalho para gerenciar. Mantém o CFOP padrão e os links para
  Informações adicionais / Naturezas de operação.
- **FR-P3-002**: As 4 telas de grupo fiscal (ICMS/IPI/PIS-COFINS/ISSQN) DEVEM
  ser unificadas numa única rota `/configuracoes/fiscal/grupos` com abas por
  tributo (lista + criar/editar dentro de cada aba).
- **FR-P3-003**: A listagem de grupos DEVE mostrar, por linha: nome, situação
  tributária (CST/CSOSN conforme o tributo), alíquota (quando aplicável ao
  tributo/CST) e número de produtos vinculados ao grupo.
- **FR-P3-004**: O estado vazio de um tributo sem grupos DEVE ter peso visual
  de ação principal (não apenas legenda cinza) — CTA claro "Novo grupo de X".
- **FR-P3-005**: Grupo fiscal DEVE poder ser excluído, bloqueado (com mensagem
  clara) quando: (a) está vinculado a algum produto (`ProductFiscal`/
  `ProductFiscalBranch`), ou (b) é o padrão fiscal atual da organização
  (`FiscalDefaultTaxes`).
- **FR-P3-006**: GUIA.md de cada feature tocada e `apps/erp/web/AGENTS.md`
  DEVEM ser atualizados na mesma operação.

## Success Criteria

- **SC-P1-001**: Um lojista comum (só `erp.memberships`, sem
  `platform.store_members`) consegue listar/criar/ajustar número/desativar/
  excluir séries fiscais, e gravar o CSC (`cscConfigured` passa a `true`).
- **SC-P1-002**: Um usuário de outra organização continua **sem** acesso ao
  Emitente (cross-tenant fechado).
- **SC-P1-003**: Token de serviço sem `X-Acting-Sub` continua negado.
- **SC-P2-001**: Nas 1366×768 e 1280×720, toda rota listada em FR-P2-003 rola
  até o botão de ação principal, por mouse e por Tab.
- **SC-P3-001**: A partir da aba Padrões fiscais dá para ver, sem clicar em
  mais nada, quantos grupos existem por tributo e qual é o padrão.
- **SC-P3-002**: A partir da listagem de grupos dá para saber a situação
  tributária e o uso do grupo sem abrir o formulário.

## Fora de escopo

- Migração de dados / backfill de `platform.store_members` para lojistas
  existentes (rejeitado na decisão P1-(a) em favor de reconhecer os dois
  modelos).
- Exclusão de Naturezas de Operação / Informações Adicionais (P3 pede exclusão
  só nos 4 grupos fiscais — group rules referenciando o grupo excluído já são
  tratadas via `SetNull` + resolvedor ignora regra órfã, ver spec 020).
- Testes de frontend automatizados (D0, herdado — pacote sem harness).

## Assumptions

- `erp.memberships` tem `organizationId` + `userId` + `keycloakSub` (via
  `erp.users`) — confirmar shape exato no plano.
- `fiscal.companies.storeId` == `organizations.platformStoreId` (confirmado no
  re-teste, os dois batem para o Emitente testado).
- A rota unificada de grupos (`/configuracoes/fiscal/grupos`) substitui as 4
  rotas antigas (`grupos-icms`, `grupos-ipi`, `grupos-pis-cofins`,
  `grupos-issqn`) — decidir no plano se as antigas viram redirect ou somem.
