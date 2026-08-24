# Feature Specification: Exclusões fiscais — Natureza de Operação e CSC do Emitente

**Feature Branch**: `024-fiscal-exclusoes`

**Created**: 2026-08-14

**Status**: Draft

**Input**: Duas lacunas de exclusão encontradas na sabatina manual do Menu Fiscal (`specs/erp/023-fiscal-emissao-e-ux/sabatina-2026-08-14.md`): não dá para excluir uma Natureza de Operação, nem para remover o CSC de um Emitente (só substituir).

## Clarifications

### Session 2026-08-14

- Q: Parte A — Excluir Natureza de Operação: hard delete (cascata nas filhas) ou soft delete (`deletedAt`)? → A: Hard delete — cascata já garantida no schema (`onDelete: Cascade`), coerente com o padrão irmão da spec erp/022 e sem `deletedAt` hoje no módulo.
- Q: O diálogo de confirmação de exclusão precisa avisar que a natureza pode ser usada em resoluções de emissão futuras? → A: Sim, aviso específico — explica a consequência em português claro antes de confirmar.
- Q: Parte B — Remover CSC do Emitente: bloquear (409) enquanto o PDV estiver em Modelo 65, ou permitir com aviso? → A: Bloquear com 409, espelhando a regra de grupo fiscal padrão. A checagem mora no proxy `erp-web` (consulta `GET /v1/pos-fiscal-settings/current` na erp-api antes de repassar o `DELETE` à fiscal-api) — a fiscal-api não passa a conhecer `pos_fiscal_settings`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Excluir Natureza de Operação (Priority: P1)

Um lojista cadastrou uma Natureza de Operação para testar ou por engano, ou uma natureza deixou de fazer sentido para o negócio, e quer removê-la da lista. Hoje não existe nenhum caminho — nem na tela, nem na API — para isso.

**Why this priority**: É a lacuna mais simples das duas (sem interlock entre serviços) e o padrão irmão (exclusão de grupo fiscal, spec erp/022) já existe pronto para copiar. Entrega valor sozinha, sem depender da User Story 2.

**Independent Test**: Criar uma Natureza de Operação de teste, excluí-la pela tela (menu da linha → Excluir → confirmar), e verificar que ela some da lista e o card de contagem em Padrões fiscais decrementa.

**Acceptance Scenarios**:

1. **Given** uma Natureza de Operação cadastrada na organização do usuário, **When** o usuário aciona Excluir no menu da linha e confirma no diálogo, **Then** a natureza é removida (junto com suas regras de CFOP e de grupo filhas) e some da listagem.
2. **Given** a exclusão foi concluída, **When** o usuário volta para a aba Padrões fiscais, **Then** o card "Naturezas de operação" mostra a contagem decrementada.
3. **Given** uma Natureza de Operação pertencente a **outra** organização, **When** um usuário tenta excluí-la pelo id (ex.: chamando a rota diretamente), **Then** a API responde 404 (nunca 204) — mesmo isolamento por tenant das demais rotas do módulo.
4. **Given** o diálogo de confirmação de exclusão, **When** ele é exibido, **Then** o texto avisa que a mudança pode afetar a resolução de futuras emissões que usariam essa natureza (a natureza não é referenciada por documentos já emitidos — sua função é só resolver CFOP/grupo em emissões *futuras*).

---

### User Story 2 - Remover o CSC do Emitente (Priority: P2)

Um lojista gravou um CSC (Código de Segurança do Contribuinte) errado, de teste, ou de homologação por engano, e precisa voltar o Emitente ao estado "CSC não configurado" — hoje só existe "Substituir", que exige digitar um CSC novo válido.

**Why this priority**: Depende de uma decisão de fronteira entre dois serviços (fiscal-api guarda o CSC; erp-api guarda se o PDV está em Modelo 65) que só se resolve no `/speckit-clarify` — por isso vem depois da User Story 1, que é autocontida.

**Independent Test**: Com um Emitente que tem CSC configurado e o PDV **não** em Modelo 65, acionar "Remover CSC", confirmar, e verificar que o Emitente volta a `cscConfigured: false` e uma tentativa de emissão de NFC-e nesse Emitente é recusada.

**Acceptance Scenarios**:

1. **Given** um Emitente com CSC configurado e o PDV da organização **não** em Modelo 65, **When** o usuário aciona "Remover CSC" e confirma, **Then** o Emitente volta a `cscConfigured: false` (ambos `cscId` e `cscTokenEncrypted` zerados juntos) e uma tentativa de emitir NFC-e nesse Emitente é recusada por falta de CSC.
2. **Given** um Emitente com CSC configurado e o PDV da organização **em Modelo 65**, **When** o usuário tenta remover o CSC, **Then** a remoção é bloqueada (409) com uma mensagem que explica que o PDV está configurado para NFC-e e precisa trocar de modelo antes.
3. **Given** um Emitente **sem** CSC configurado, **When** a tela é exibida, **Then** não existe nenhum botão de remover (só "Configurar CSC").
4. **Given** a remoção foi concluída, **When** a resposta da API é inspecionada, **Then** o corpo/log nunca ecoa o valor do CSC removido — só o indicador booleano.
5. **Given** um Emitente pertencente a **outra** organização, **When** um usuário tenta remover o CSC pelo id do Emitente, **Then** a API responde 404 (mesma política de acesso do `PUT .../csc`).

---

### Edge Cases

- Excluir uma Natureza de Operação que está sendo referenciada por outra tela aberta em outra aba: a próxima tentativa de resolver essa natureza (emissão futura) falha com "natureza não encontrada" — comportamento aceitável, mesma classe de erro que excluir qualquer outro cadastro em uso alhures.
- Excluir a **última** Natureza de Operação da organização: permitido — o card de contagem mostra 0, e a listagem mostra o estado vazio já existente.
- Remover o CSC durante uma emissão de NFC-e em andamento: a emissão em voo usa o CSC lido no início da transação (mesma garantia de qualquer outro campo do Emitente); a próxima emissão já vê `hasCsc() === false`.
- PDV muda para Modelo 65 depois do CSC já ter sido removido: já é barrado hoje pelo `cscBlock` existente em `pos-fiscal-type-form.tsx` (FR-005) — este bloqueio não muda com esta feature, só passa a ser alcançável nos dois sentidos (remover com PDV em 65 vira 409; configurar PDV em 65 sem CSC já era bloqueado).

## Requirements *(mandatory)*

### Functional Requirements

**A — Excluir Natureza de Operação**

- **FR-001**: A API MUST expor `DELETE /v1/operation-natures/:id`, exigindo a permissão `store.catalog.manage` (mesma das demais rotas de escrita do módulo).
- **FR-002**: A exclusão MUST ser hard delete, removendo em cascata `OperationNatureCfopRule` e `OperationNatureGroupRule` (já garantido por `onDelete: Cascade` no schema — não requer migration).
- **FR-003**: A exclusão MUST ser escopada por organização — excluir o id de uma natureza de outra organização MUST responder 404, nunca 204.
- **FR-004**: A UI MUST oferecer a ação "Excluir" no menu da linha da listagem de Naturezas de Operação, com `ConfirmationDialog` (mesmo padrão do hub de Grupos fiscais) antes de confirmar, e `toast` de sucesso/erro depois.
- **FR-005**: O texto do diálogo de confirmação MUST avisar que a natureza pode ser usada para resolver emissões futuras e que excluí-la afeta esse comportamento a partir de agora.
- **FR-006**: O card "Naturezas de operação" na aba Padrões fiscais MUST refletir a contagem real após a exclusão (reusa a mesma consulta de contagem já existente).

**B — Remover CSC do Emitente**

- **FR-007**: A entidade `Company` (fiscal-api) MUST ganhar `clearCsc()`, zerando `cscId` e `cscTokenEncrypted` juntos — nunca um sem o outro.
- **FR-008**: A fiscal-api MUST expor `DELETE /v1/companies/:id/csc`, exigindo a permissão `fiscal.companies.manage` (mesma do `PUT .../csc`) e a mesma checagem de posse (`CompanyAccessPolicy`) do `SetCscUseCase` — 404 (não 403) quando o Emitente não pertence ao chamador.
- **FR-009**: A remoção do CSC MUST ser bloqueada (409) quando o PDV da organização dona do Emitente estiver configurado em Modelo 65 (NFC-e) — a checagem roda no proxy `erp-web` (`/api/proxy/fiscal`), consultando `GET /v1/pos-fiscal-settings/current` (erp-api) antes de repassar o `DELETE` para a fiscal-api. A fiscal-api não passa a conhecer `pos_fiscal_settings` — mantém o desacoplamento de FR-014/FR-015 já documentado em `services/fiscal-api/AGENTS.md`.
- **FR-010**: A mensagem do bloqueio MUST explicar a causa em português claro (ex.: "O PDV está configurado para emitir NFC-e (Modelo 65) — troque o modelo antes de remover o CSC.").
- **FR-011**: A resposta de `DELETE .../csc` MUST devolver o Emitente com `cscConfigured: false`, e nunca ecoar o valor do CSC removido em corpo ou log — mesma garantia write-only do `PUT`.
- **FR-012**: A UI (`csc-section.tsx`) MUST oferecer um botão "Remover CSC" ao lado de "Substituir CSC" **somente quando `configured === true`**, com `ConfirmationDialog` antes de confirmar.
- **FR-013**: Uma tentativa de emitir NFC-e num Emitente sem CSC (após remoção) MUST continuar recusada pelo mesmo gate já existente (`issue-nfce.use-case.ts:184`, `!company.hasCsc()`) — não requer mudança nesse ponto.

### Key Entities *(include if feature involves data)*

- **OperationNature** (erp-api, schema `erp`): já existe. Ganha capacidade de exclusão; nenhuma mudança de schema (FKs filhas já são `Cascade`, nenhuma FK externa aponta para ela).
- **Company** (fiscal-api, schema `fiscal`): já existe. Ganha `clearCsc()` na entidade; nenhuma mudança de schema (`cscId`/`cscTokenEncrypted` já são nullable).
- **PosFiscalSettings** (erp-api, schema `erp`): não muda — só passa a ser **consultado** (leitura, `GET /v1/pos-fiscal-settings/current`) por um novo consumidor (o proxy `erp-web`) antes de autorizar a remoção do CSC.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um lojista consegue excluir uma Natureza de Operação de teste pela tela, do clique em "Excluir" à confirmação visual (toast + item sumindo da lista), em uma única interação (sem navegação extra).
- **SC-002**: Excluir a natureza de outra organização (tentativa direta via id) nunca retorna 204 — sempre 404.
- **SC-003**: Um lojista com PDV **não** em Modelo 65 consegue remover o CSC do Emitente e ver `cscConfigured: false` refletido na tela imediatamente após a confirmação.
- **SC-004**: Um lojista com PDV **em** Modelo 65 que tenta remover o CSC recebe uma mensagem acionável (não um erro genérico) explicando que precisa trocar o modelo do PDV primeiro, e o CSC continua configurado.
- **SC-005**: Nenhum teste automatizado ou log de produção jamais imprime o valor de um CSC removido.

## Assumptions

- O padrão de UI (menu de linha com "Excluir" + `ConfirmationDialog` + `toast`) e o padrão de backend (use case dedicado + erro de domínio + rota `DELETE` + repo `.delete`) da spec erp/022 (exclusão de grupo fiscal) são reaproveitados sem alterações estruturais — só adaptados às entidades desta feature.
- A checagem de interlock (FR-009) mora no proxy `erp-web`, não na fiscal-api nem via nova chamada fiscal-api→erp-api — decisão tomada no `/speckit-clarify` desta feature (ver `## Clarifications`).
- Não há dado histórico dependente da Natureza de Operação excluída (nenhuma tabela de documento fiscal guarda `operationNatureId`) — confirmado por varredura no schema e no código antes desta spec ser escrita.
- O ambiente de QA usado na sabatina (Emitente `070566ad-c97a-4ce6-9e08-2d0fde8b1249` com CSC de teste `cscId 000001`, e a natureza "QA Devolucao fornecedor") é reaproveitado para validar esta feature manualmente, e deixado limpo ao final.
