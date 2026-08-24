# Quickstart: Ajustes no módulo Financeiro

Pré-requisitos: `pnpm infra:up`, `pnpm dev` (ou `pnpm dev:varejo` — inclui `admin-api`, `erp-web`, `erp-api`), organização de teste provisionada (dispara o `store-setup` que agora também semeia `PaymentMethod` e os 9 `FinancialGroup` novos da DRE).

## 1. Extrato (`/financas/extratos`) — FR-001..FR-003

```bash
# nenhum comando novo — validar visualmente
```
1. Abrir `/financas/extratos` com lançamentos de teste no período.
2. **Esperado**: resumo mostra só Entradas / Saídas / Saldo do período (sem card de saldo por conta).
3. **Esperado**: grade mostra Competência, Vencimento, Categoria, Método de pagamento, Valor original, Valor final, Status — nessa ordem.

## 2. Lançamentos (`/financas/lancamentos` + `/novo`) — FR-004..FR-006

1. Abrir `/financas/lancamentos` — grade mostra Fornecedor/Cliente, Tipo, Categoria, Data de vencimento, Valor original, Valor final, Status.
2. Abrir `/financas/lancamentos/novo`, seção Pagamentos — 3 campos (Data, Forma de pagamento, Valor) com label visível e alinhado.
3. Abrir `/configuracoes/formas-pagamento`, criar uma forma nova ("Minha forma de teste").
4. Voltar em `/financas/lancamentos/novo` — a forma nova aparece no select de Forma de pagamento sem reload manual de cache (React Query invalidation).

```bash
curl -s "$ERP_API_URL/v1/payment-methods/options" -H "X-Organization-Id: $ORG_ID" -H "Authorization: Bearer $TOKEN" | jq
# esperado: 15 formas de sistema + "Minha forma de teste"
```

## 3. Conciliação bancária (`/financas/conciliacao-bancaria`) — FR-007..FR-009

1. Ter cadastrada exatamente 1 conta bancária ativa para o banco "Itaú" (código `341`).
2. Abrir "Importar Extrato", selecionar um arquivo `.ofx` de teste com `BANKACCTFROM.BANKID = 341`.
3. **Esperado**: campo Conta bancária pré-seleciona a conta Itaú sozinho.
4. Repetir com um arquivo cujo `BANKID` não bate com nenhuma conta cadastrada — **esperado**: campo fica vazio, botão Importar continua habilitado.
5. Tentar selecionar um arquivo `.txt` — **esperado**: rejeitado no client, sem request ao servidor.

```bash
curl -s -X POST "$ERP_API_URL/v1/bank-reconciliation/statements" \
  -H "X-Organization-Id: $ORG_ID" -H "Authorization: Bearer $TOKEN" \
  -F "file=@tests/fixtures/sample.ofx"
# sem bankAccountId no multipart — esperado 201, bankStatement.bankAccountId resolvido ou null
```

## 4. Relatório de Resultados (`/financas/relatorios-de-resultados`) — FR-010..FR-012

1. Abrir a tela para um período com lançamentos em pelo menos 2 categorias do novo modelo.
2. **Esperado**: árvore mostra as 9 categorias na ordem do modelo, mesmo as com valor zero.
3. Expandir "Receitas Operacionais" — 3 subcategorias; expandir "Juros/Multa" — 2 subcategorias.
4. Rolar até o final — total "Resultado Operacional" visível.

```bash
curl -s "$ERP_API_URL/v1/reports/income-statement?from=2026-08-01&to=2026-08-31" \
  -H "X-Organization-Id: $ORG_ID" -H "Authorization: Bearer $TOKEN" | jq '.data.groups | length'
# esperado: 9
```

## 5. Contratos de cartões (`/financas/contratos-de-cartoes-e-outros/novo`) — FR-013..FR-015

1. Abrir o formulário, campo Provedor.
2. **Esperado**: é um select/autocomplete fechado; digitar um valor fora da lista (`"Provedor Inventado"`) não é aceito como opção válida.
3. **Esperado**: as 20 opções especificadas estão todas disponíveis rolando/buscando no campo.

## 6. Contas bancárias (`/financas/contas-bancarias`) — FR-016..FR-017

1. Abrir "Nova conta", campo Banco.
2. **Esperado**: 19 bancos listados, cada um como "`código` — `nome`".
3. Salvar com "Itaú" (`341`), reabrir para edição — **esperado**: "Itaú" continua selecionado.

## 7. Formas de pagamento (`/configuracoes/formas-pagamento`) — FR-018..FR-022

1. Abrir a tela — 15 formas padrão listadas, sem menu de ações (não editável/excluível).
2. Criar uma forma própria, editá-la, e tentar excluí-la enquanto está em uso num lançamento — **esperado**: bloqueado com mensagem clara.
3. Excluir uma forma própria sem uso — **esperado**: sucesso.

## 8. Bandeira do pagamento como select fechado (`/financas/lancamentos/novo` + `/[id]`) — FR-006a..d

1. Abrir `/financas/lancamentos/novo`, seção Pagamentos.
2. **Esperado**: campo Bandeira tem label "Bandeira" visível, alinhado com Data/Forma de pagamento/Valor.
3. Abrir o campo Bandeira — **esperado**: lista fechada (não é possível digitar texto livre); opções incluem no mínimo Visa, MasterCard/Mastercard, American Express, Sorocred, Elo, Hipercard, Credicard, Outros/Outra, Alelo, Ticket, VR Benefícios, Sodexo, Banricompras.
4. Salvar um pagamento sem selecionar Bandeira (ex.: forma de pagamento PIX) — **esperado**: salva normalmente (campo opcional).
5. Abrir um lançamento existente (`/financas/lancamentos/:id`) com pagamento em cartão — **esperado**: mesmo select fechado, mesmo label, valor já persistido continua selecionado (mesmo se o `value` histórico não estiver mais na lista — exibição somente do valor gravado).

## 9. Bloquear exclusão de lançamento com conciliação ativa (`/financas/lancamentos`) — FR-006e/f

Pré-requisito: rota `POST /v1/bank-statements/:bankStatementId/transactions/:transactionId/reconcile/undo` implementada (`research.md` R9 — gap encontrado no grounding de 2026-08-09, não existia até esta fatia).

1. Importar um extrato de teste e conciliar manualmente um lançamento com uma transação (`POST /v1/bank-reconciliation/statements` + fluxo de conciliação em `/financas/conciliacao-bancaria/[id]`).
2. Ir em `/financas/lancamentos`, tentar excluir esse lançamento — **esperado**: bloqueado, mensagem explica que é preciso desfazer a conciliação primeiro (409).

```bash
curl -s -X DELETE "$ERP_API_URL/v1/financial-entries/$ENTRY_ID" \
  -H "X-Organization-Id: $ORG_ID" -H "Authorization: Bearer $TOKEN" -i
# esperado: 409, corpo com mensagem sobre desfazer a conciliação
```

3. Desfazer a conciliação (ação "Desfazer conciliação" na transação, ou diretamente):

```bash
curl -s -X POST "$ERP_API_URL/v1/bank-statements/$STATEMENT_ID/transactions/$TRANSACTION_ID/reconcile/undo" \
  -H "X-Organization-Id: $ORG_ID" -H "Authorization: Bearer $TOKEN" | jq
```

4. Tentar excluir o mesmo lançamento novamente — **esperado**: sucesso (204), comportamento atual de soft-delete preservado.
5. Excluir um lançamento sem nenhum pagamento conciliado — **esperado**: comportamento inalterado (sucesso direto).

## Verificação de regressão (edge cases do spec)

- Um lançamento antigo (pré-migração) com forma de pagamento do enum antigo (`"pix"`, texto cru) continua exibível somente-leitura naquele lançamento específico, mesmo não existindo mais como opção de select.
- Uma conta bancária cadastrada com um código de banco fora da nova lista de 19 (se existir dado de teste assim) continua exibível na edição daquela conta.
- Filtrar o Relatório de Resultados num período sem nenhum lançamento — todas as 9 categorias aparecem com R$ 0,00, `operatingResultCents: 0`.
- Um pagamento antigo com Bandeira em texto livre fora do catálogo fechado (`CARD_BRAND_OPTIONS`) continua exibível somente-leitura naquele pagamento específico.
- Excluir um lançamento cujo único pagamento conciliado já foi desfeito — exclusão permitida, sem exigir nenhuma outra ação.
