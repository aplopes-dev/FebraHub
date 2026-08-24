# Contract: Importação de extrato bancário (`erp-api`, mudança de contrato)

## `POST /v1/bank-reconciliation/statements` (rota existente — `import-bank-statement.route.ts`)

**Antes**: `bankAccountId` obrigatório no multipart body.

**Depois**: `bankAccountId` **opcional**. Quando ausente:
1. O backend parseia o arquivo (`parseOfxFile`, já existente) e extrai `bankCode`.
2. Busca `BankAccount` ativas da organização com `bankCode` igual.
3. Se exatamente 1 resultado → usa essa conta (`bankAccountId` resolvido internamente, refletido no `BankStatement.bankAccountId` do resultado).
4. Se 0 ou 2+ resultados → `bankAccountId` do extrato criado fica `null`; segue o fluxo normal de import (transações persistidas, dedupe por `dedupeKey` funciona no escopo da organização, não mais escopado só por conta — ver Open Question abaixo).

Response `201`: mesma forma atual (`ImportBankStatementResult`), com `bankStatement.bankAccountId` podendo vir `null`.

## Novo (opcional, ver `research.md` R8): `POST /v1/bank-reconciliation/statements/preview`

Só para viabilizar a pré-seleção **antes** da confirmação do usuário (Acceptance Scenario 1 da User Story 4). Recebe o mesmo arquivo, não persiste nada, devolve:

```json
{ "data": { "bankCode": "341", "suggestedBankAccountId": "uuid-ou-null" } }
```

O dialog do frontend chama esse endpoint ao selecionar o arquivo (antes de clicar "Importar"), usa `suggestedBankAccountId` para pré-preencher o `Select`, e só then envia o `POST /v1/bank-reconciliation/statements` real (com o `bankAccountId` que o usuário confirmou, pré-selecionado ou trocado manualmente).

**Open Question para `/speckit-tasks`**: confirmar se vale a pena o endpoint de preview separado (2 chamadas ao servidor, mas UX fiel ao Acceptance Scenario) ou se é aceitável simplificar para "auto-detecção só se aplica no import definitivo, sem pré-visualização antes de confirmar" (1 chamada, UX ligeiramente diferente do texto literal da User Story). Não é uma decisão de produto (já resolvida nas Clarifications) — é trade-off de implementação a registrar nas tasks.
