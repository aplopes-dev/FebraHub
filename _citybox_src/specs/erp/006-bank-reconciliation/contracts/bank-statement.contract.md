# Contrato — Extratos bancários (`/v1/bank-statements`)

Permissões: leitura `org.view`; escrita `store.finance.manage` (FR-025). Todas as rotas escopadas
pela organização ativa (`@OrganizationId()` do contexto de tenant, nunca o header cru) — FR-026.

## `POST /v1/bank-statements`

Importa um extrato. `multipart/form-data` (`FileInterceptor('file')`, mesmo padrão de
`upload-financial-entry-attachment`).

**Campos do form**: `bankAccountId` (string, obrigatório), `file` (arquivo, obrigatório).

> **Nota 2026-08-14 (research.md D26, FR-001).** Este contrato sempre especificou `bankAccountId`
> como obrigatório — foi a implementação da `007-financeiro-ajustes-ui` (FR-007) que o tornou
> opcional, e é essa divergência que a decisão de 2026-08-14 reverte, não o contrato. Motivo: o
> cadastro `BankAccount` guarda só `bankCode`, o OFX traz agência e conta, e não há chave confiável
> entre os dois — o operador é a única fonte de verdade. A rota `POST /v1/bank-statements/preview`
> (introduzida pela 007) **permanece**, agora com papel exclusivo de **pré-selecionar** a conta
> quando o `bankCode` do arquivo casar com exatamente uma conta ativa; ela nunca decide a importação.

**Validações → erro**:
| Condição | Status | Corpo |
|---|---|---|
| `bankAccountId` ausente — NOVO 2026-08-14, FR-001/D26 | 422 | `{ message: "Selecione a conta bancária deste extrato" }` |
| Organização não tem nenhuma conta bancária cadastrada — NOVO 2026-08-14 | 422 | `{ message: "Cadastre uma conta bancária antes de importar um extrato" }` |
| `bankAccountId` não existe ou não é da organização | 404 | `{ message: "Conta bancária não encontrada" }` |
| Extensão/`content-type` não é `.ofx`-compatível | 422 | `{ message: "Arquivo precisa ser um extrato OFX (.ofx)" }` |
| Arquivo > 10 MB (`MAX_BANK_STATEMENT_BYTES`) | 413 | corpo padrão do `FileInterceptor` |
| Conteúdo não parseável por `parseOfxFile` | 422 | `{ message: "Não foi possível ler o arquivo OFX" }` |

**Sucesso — `201`**:
```json
{
  "data": {
    "id": "uuid",
    "bankAccountId": "uuid",
    "bankName": "Banco do Brasil",
    "bankCode": "001",
    "branchNumber": "1234",
    "accountNumber": "56789-0",
    "periodStart": "2026-07-01",
    "periodEnd": "2026-07-31",
    "status": "not_reconciled",
    "counts": { "pending": 42, "reconciled": 0, "discarded": 0 },
    "fileName": "extrato-julho.ofx",
    "createdAt": "2026-08-06T12:00:00.000Z"
  },
  "meta": { "totalInFile": 45, "imported": 42, "skippedDuplicates": 3 }
}
```
`meta.totalInFile`/`imported`/`skippedDuplicates` satisfazem o critério de aceite "resumo (total,
importadas, ignoradas por duplicidade)".

## `GET /v1/bank-statements`

Lista paginada (FR-010, FR-020 do projeto — busca/paginação sempre no backend).

**Query**: `page` (default 1), `perPage` (default 10), `bankAccountId?`, `status?`
(`not_reconciled|partially_reconciled|reconciled`).

**Sucesso — `200`**:
```json
{
  "data": [ { /* mesmo shape do item de POST, sem `meta.*` de importação */ } ],
  "meta": { "page": 1, "perPage": 10, "total": 3, "totalPages": 1 }
}
```

## `GET /v1/bank-statements/:id`

Detalhe (cabeçalho da tela — instituição, conta, período, status, contadores). `404` se não existir
ou for de outra organização (FR-026).

## `PATCH /v1/bank-statements/:id/bank-account`

**Novo — decisão de `/speckit-plan` 2026-08-14, research.md D23 / FR-042.** Define ou corrige a
conta bancária de um extrato já importado.

> **Escopo revisto na 2ª rodada de 2026-08-14 (D26):** com `bankAccountId` obrigatório na importação
> (FR-001), nenhum extrato **novo** nasce sem conta — esta rota deixa de ser caminho principal e passa
> a ser **reparo de legado**, para os extratos importados enquanto a 007 permitia conta vazia. Não é
> descartada: sem ela, esses extratos ficariam permanentemente inconciliáveis. Continua útil também
> para corrigir uma conta escolhida por engano, desde que o extrato ainda não tenha conciliações.

**Permissão**: `store.finance.manage` (escrita, FR-025).

**Corpo**: `{ "bankAccountId": "uuid" }`.

**Validações → erro**:
| Condição | Status | Mensagem |
|---|---|---|
| Extrato não existe / é de outra organização | 404 | "Extrato não encontrado" |
| Conta não existe ou não pertence à organização ativa (mesma regra de FR-004) | 422 | "Conta bancária inválida" |
| Extrato já tem ao menos 1 transação `reconciled` | 422 | "Desfaça as conciliações deste extrato antes de trocar a conta" |

A última validação existe porque conciliações já feitas geraram movimentação na conta antiga —
trocar a conta do extrato sem desfazê-las deixaria o saldo das duas contas incoerente. Trocar a
conta de um extrato **sem** conciliações é seguro e é o caso de uso principal (extrato importado sem
conta resolvida).

**Sucesso — `200`**: extrato atualizado, mesmo shape de `GET /v1/bank-statements/:id`. As sugestões
automáticas (FR-014) passam a ficar disponíveis para as transações pendentes desse extrato.

## `GET /v1/bank-statements/:id/file`

Download do arquivo original (RN-14/FR-024) — proxy/stream, nunca signed URL (mesmo padrão de
`get-financial-entry-attachment.route.ts`). `Content-Type: application/x-ofx`,
`Content-Disposition: attachment; filename="<fileName original>"`. `404` se o extrato não existir na
organização ativa.
