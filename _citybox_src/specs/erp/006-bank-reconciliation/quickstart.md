# Quickstart — Conciliação bancária

Guia de validação ponta a ponta. Detalhes de schema em [data-model.md](./data-model.md), de rotas em
[contracts/](./contracts/).

## Pré-requisitos

- `pnpm infra:up` (Postgres, MinIO, Keycloak) rodando.
- `pnpm --filter @citybox/erp-api db:migrate:dev` aplicado (inclui a migration desta feature).
- Uma organização com uma conta bancária cadastrada (`/financas/contas-bancarias`) e ao menos um
  lançamento financeiro pendente nela (`/financas/lancamentos`) — idealmente um recebível **gerado
  por fechamento de venda com contrato de cartão** (`005-card-receivables-engine`), para validar
  research.md D4 (conciliar um lançamento `isReadOnly`).
- Um arquivo `.ofx` de teste contendo pelo menos uma transação com o **mesmo valor e data próxima**
  do lançamento acima (fixture sugerida: `tests/fixtures/sample-1.1x-latin1.ofx`).
- Usuário com `store.finance.manage` (OWNER/ADMIN) para as ações de escrita; um segundo usuário
  `MEMBER` (só `org.view`) para validar os `403`.

## Rodando os apps

```bash
pnpm --filter @citybox/erp-api dev    # :3114
pnpm --filter @citybox/erp-web dev    # :3107
```

## Cenário 1 — Importar e ver as transações (User Story 1)

1. Abrir `/financas/conciliacao-bancaria` → Importar → escolher a conta bancária + o `.ofx` de teste.
2. Esperado: `201`, extrato aparece na lista com instituição/conta/período, contador "Pendentes"
   igual ao número de transações do arquivo.
3. Reimportar o **mesmo arquivo**: esperado `meta.skippedDuplicates` = total de transações, nenhuma
   nova linha na aba Pendentes (data-model.md D11 — dedupe por `(bankAccountId, dedupeKey)`).
4. Importar um arquivo `.txt` renomeado para `.ofx`: esperado `422` com mensagem clara, nada gravado.

## Cenário 2 — Conciliar por sugestão automática (User Story 2)

1. Abrir o extrato importado no Cenário 1 → aba Pendentes.
2. A transação cujo valor/data batem com o lançamento pré-cadastrado deve mostrar o candidato em
   `GET .../suggestions` (`kind: "exact"`).
3. Clicar Conciliar → `200`; transação vai para "Conciliadas"; extrato recalcula status/contadores.
4. **Verificação crítica** (research.md D3/D4/D9): abrir `/financas/lancamentos/:id` do lançamento
   conciliado — `status: paid`, um `payments[]` novo com `paymentMethod: "conciliacao_bancaria"` e
   `paidAt` igual ao `postedAt` da transação (não à data do clique). Abrir
   `/financas/contas-bancarias/:id?view=historico` — uma `BankTransaction` nova aparece no saldo,
   na data da transação do extrato, **sem duplicar** nenhuma movimentação existente.

## Cenário 3 — Desfazer (User Story 6)

1. Na transação recém-conciliada do Cenário 2, clicar "Desfazer conciliação".
2. Esperado: volta para Pendentes; o `payments[]` do lançamento perde a linha adicionada
   (`paidCents`/`status` do lançamento voltam ao valor anterior); a `BankTransaction` gerada some do
   extrato da conta (Cenário 2, passo 4) sem afetar nenhuma outra movimentação.

## Cenário 4 — Soma de N lançamentos (User Story 4)

1. Ter uma transação de extrato de R$ 300 e três lançamentos pendentes de R$ 100 na mesma conta.
2. "Somar lançamentos" → selecionar os três → confirmar → `200`, transação conciliada com os três
   (`matches.length === 3`).
3. Repetir selecionando apenas dois dos três (soma R$ 200 ≠ R$ 300) → esperado `422`, nada vinculado,
   os dois lançamentos continuam disponíveis como candidatos.

## Cenário 5 — Criar lançamento a partir da transação (User Story 5)

1. Em uma transação sem candidato (`kind: "none"` em `/suggestions`), abrir "Criar lançamento".
2. Conferir data/valor/sinal/descrição pré-preenchidos e travados a partir da transação; taxas/
   despesas e multas/juros exibidos como zero, não editáveis.
3. Trocar a conta bancária pré-selecionada por outra conta ativa da organização (D14).
4. Salvar → `201`; o lançamento novo aparece em `/financas/lancamentos` já com `status: paid` e
   vinculado à conta escolhida no passo 3; a transação do extrato vai direto para Conciliadas (sem
   passo extra de conciliar depois de criar).

## Cenário 5b — Filtro de período na lista de transações (FR-035/D15)

1. Com um extrato tendo transações em datas espalhadas dentro do período coberto, aplicar um filtro
   de "Período" (data inicial/final) na aba Pendentes.
2. Confirmar que só as transações com `postedAt` dentro do intervalo aparecem (combinado com a
   busca por descrição, se preenchida).

## Cenário 5c — Busca manual inclui lançamento `paid` (FR-016/D16/D17)

1. Ter um lançamento já `paid` (pago por outro meio, nunca vinculado a nenhuma transação de extrato)
   com `amountCents` igual ao de uma transação pendente sem sugestão. **Precisão 2026-08-14
   (FR-043)**: o lançamento MUST estar na **mesma conta bancária do extrato** — um `paid` de outra
   conta aparece na busca mas não concilia; esse caso é o Cenário 5g.
2. Abrir "Buscar Registros" na transação — o lançamento `paid` MUST aparecer nos resultados de
   `GET .../eligible-entries`, com `eligibleAmountCents === amountCents` do lançamento.
3. Selecionar e confirmar → `200`; a transação vai para Conciliadas; o lançamento continua `paid`
   (nenhum `FinancialEntryPayment` novo criado — conferir `payments.length` inalterado); o
   `BankTransaction` original do pagamento não é duplicado.
4. Repetir com um lançamento `paid` que já tem `BankStatementMatch` ativo com outra transação — MUST
   **não** aparecer nos resultados (FR-033, agora checado explicitamente, já não implícito por
   status).

## Cenário 5d — Ajustes de UI/UX da comparação CPLUG (FR-039/FR-040/D18/D20/D21)

1. Abrir um extrato com transações pendentes. Na linha de ações de cada cartão, conferir a ordem
   **Conciliar → Novo Registro → Buscar registro → Excluir** (FR-039/D20).
2. Numa transação **sem** sugestão, "Conciliar" MUST estar desabilitado; numa **com** sugestão, MUST
   estar habilitado e conciliar em um clique. Com **vários** candidatos, MUST levar o operador à
   escolha em vez de conciliar sozinho (FR-014).
3. Clicar "Novo Registro" → MUST abrir como painel lateral pela **direita**, não como diálogo
   centralizado (FR-040/D21); conferir que as 3 seções e os campos travados somente-leitura
   continuam como antes.
4. Abrir "Buscar Registros" e marcar um lançamento de valor diferente do da transação: MUST **não**
   aparecer alerta de divergência no drawer; o rodapé MUST mostrar o totalizador neutro
   (Selecionado/Transação/Diferença) **sem** cor de erro, e o botão Conciliar MUST seguir desabilitado
   (D18). A sinalização de divergência MUST aparecer no cartão da transação (FR-031/FR-039).
5. Marcar 3 lançamentos cuja soma fecha exatamente → rodapé zera a diferença e Conciliar habilita.

## Cenário 5e — Conta destravada na busca e conta da movimentação (FR-037/FR-029/D19/D22)

1. Num extrato **com** conta resolvida, abrir "Buscar Registros": o filtro Conta MUST vir
   pré-selecionado na conta do extrato e MUST estar **editável** (D19). Trocar para outra conta MUST
   retornar lançamentos dessa conta.
2. Selecionar um lançamento `pending` de **outra** conta, com valor exatamente igual, e conciliar →
   `200`. Conferir: a `BankTransaction` gerada está na **conta do extrato** (não na do lançamento);
   `BankStatementMatch.previousBankAccountId` guarda a conta original; o lançamento agora aponta para
   a conta do extrato (FR-029/D22).
3. Conferir os saldos: a conta do extrato subiu/desceu pelo valor da transação; a conta original
   **não** foi movimentada.
4. Desfazer a conciliação → o lançamento MUST voltar à conta original e o saldo das **duas** contas
   MUST voltar ao valor anterior à conciliação (FR-030/D22). Este é o teste de reversão obrigatório
   do risco sinalizado em D22.
5. Repetir (2) com um lançamento cuja conta **já** é a do extrato → `previousBankAccountId` MUST ser
   `null` e o comportamento MUST ser idêntico ao anterior a esta mudança (sem regressão).

## Cenário 5f — Extrato sem conta bancária definida (FR-042/D23)

1. Importar um OFX cujo código de banco não bata com exatamente 1 conta ativa → o extrato entra com
   `bankAccountId: null` (comportamento da 007).
2. Abrir o extrato: "Buscar registro" MUST estar **habilitado** (não mais desabilitado com o tooltip
   "Este extrato não tem uma conta bancária resolvida") e a busca MUST retornar lançamentos de todas
   as contas da organização (D19).
3. Tentar conciliar qualquer transação → MUST falhar com `422` "Defina a conta bancária deste extrato
   antes de conciliar" (FR-042/D23); nada vinculado, nenhuma movimentação gerada.
4. Usar a ação de definir conta (`PATCH /v1/bank-statements/:id/bank-account`) → `200`; as sugestões
   automáticas (FR-014) passam a aparecer e conciliar passa a funcionar.
5. Tentar `PATCH` num extrato que já tem transações conciliadas → MUST falhar com `422` "Desfaça as
   conciliações deste extrato antes de trocar a conta".

## Cenário 5g — Lançamento `paid` de outra conta não é conciliável (FR-043/D25)

> Fecha o achado F1 do `/speckit-analyze` — a interação entre o ramo `paid` (D16) e a conta
> destravada (D19). Cobre SC-009 no caso que antes ficava sem movimentação nenhuma.

1. Ter um lançamento já `paid` (pago por outro meio, sem `BankStatementMatch` ativo) na **conta B**,
   com `amountCents` igual ao de uma transação pendente de um extrato da **conta A**.
2. Abrir "Buscar Registros" nessa transação e trocar o filtro de conta para a conta B — o lançamento
   MUST **aparecer** nos resultados (a busca serve para investigar, FR-016/D19).
3. Selecionar e confirmar → MUST falhar com `422` "Este lançamento está em outra conta bancária e já
   está pago…" (FR-043). Conferir que **nada** foi escrito: nenhum `BankStatementMatch`, nenhum
   `FinancialEntryPayment` novo, a transação continua `pending`, e o saldo das duas contas está
   inalterado.
4. Repetir com o mesmo lançamento `paid` porém na **conta A** (a do extrato) → MUST conciliar
   normalmente (comportamento de D16, sem regressão).
5. Repetir com um lançamento **`pending`** na conta B → MUST conciliar e cair no fluxo do Cenário 5e
   (movimentação na conta A, `previousBankAccountId` preenchido). Confirma que a restrição vale só
   para `paid`.
6. Soma mista (FR-017): selecionar 1 `pending` da conta B + 1 `paid` da conta B cuja soma feche
   exatamente o valor da transação → MUST ser recusado por causa do `paid` (FR-043), mesmo com a
   soma correta.
7. Conferir que a sugestão automática (FR-014) **não** oferece candidatos de outras contas em nenhum
   dos passos acima — a assimetria com a busca manual é intencional (SC-003 inalterado).

## Cenário 5h — Conta obrigatória na importação (FR-001/D26)

> Nasceu de teste em produção: a busca ficava 100% bloqueada porque o extrato não resolvia a conta.
> Reproduz o caso real (arquivo diz "Banco 1", organização só tem Banco do Brasil).

1. Importar um `.ofx` cujo código de banco **não** corresponda a nenhuma conta cadastrada → o campo
   de conta MUST aparecer **vazio e obrigatório**, sem pré-seleção; o botão de importar MUST ficar
   bloqueado até o operador escolher uma conta.
2. Escolher a conta e importar → `201`; o extrato nasce com `bankAccountId` preenchido, e "Buscar
   registro"/"Conciliar" MUST estar habilitados desde a primeira abertura (era o defeito relatado).
3. Tentar importar sem selecionar conta (forçando o request) → `422` "Selecione a conta bancária
   deste extrato". Nada gravado.
4. Numa organização **sem nenhuma** conta bancária cadastrada, abrir a importação → MUST orientar a
   cadastrar a conta primeiro, em vez de deixar importar e travar depois.
5. Importar um `.ofx` cujo código de banco casa com exatamente 1 conta ativa → o campo MUST vir
   **pré-selecionado** com ela, e MUST continuar editável (o preview sugere, nunca decide).
6. **Legado (FR-042):** abrir um extrato importado antes desta mudança, com conta nula → busca manual
   disponível, conciliação bloqueada, e `PATCH .../bank-account` resolve. Este é agora o **único**
   caminho em que a FR-042 dispara.

## Cenário 5i — Cliente ou fornecedor vem do cadastro (FR-044/D27)

1. Cadastrar um cliente em `/clientes` (ele nasce no estágio `lead` — não há como mudar isso pela
   interface).
2. Abrir `/financas/lancamentos/novo` → o campo Cliente ou fornecedor MUST listar esse cliente. Antes
   desta mudança o select vinha vazio, porque filtrava por `tab=active`.
3. Abrir "Novo Registro" numa transação pendente da conciliação → o campo MUST ser uma **seleção**
   sobre os mesmos cadastros, não um campo de texto livre.
4. Selecionar o cliente e salvar → o lançamento criado MUST ter `customerId` preenchido (não só o
   `partyName` de exibição). Conferir no detalhe do lançamento que o vínculo sobrevive ao reload.
5. Selecionar um **fornecedor** e salvar → `supplierId` preenchido, `customerId` nulo. Enviar os dois
   ids no mesmo request (forçando) → `422`, a exclusividade é validada no servidor.
6. Conferir que clientes em qualquer estágio (`lead`, `opportunity`, `active`, `inactive`) aparecem —
   estágio de CRM não filtra (FR-044).

## Cenário 6 — Isolamento de tenant e permissão (RN-19/FR-025/FR-026)

1. Repetir o Cenário 1 numa segunda organização; confirmar que o extrato da primeira organização não
   aparece em `GET /v1/bank-statements` nem é acessível por `GET /v1/bank-statements/:id` (trocando
   `X-Organization-Id`) — `404`.
2. Logar como usuário `MEMBER` (só `org.view`) e tentar importar/conciliar/excluir/desfazer —
   esperado `403` em todas.

## Gate final

```bash
pnpm --filter @citybox/erp-api build && pnpm --filter @citybox/erp-api lint && pnpm --filter @citybox/erp-api typecheck && pnpm --filter @citybox/erp-api test
pnpm --filter @citybox/erp-web typecheck && pnpm --filter @citybox/erp-web lint
```
