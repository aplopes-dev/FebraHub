# Data Model: NFS-e pelo Padrão Nacional

Deriva das entidades do [spec.md](./spec.md) e das decisões de [research.md](./research.md).
Referência de leiaute: [contracts/](./contracts/) e os XSD v1.01 em
[`specs/002-fiscal-api/contracts/NFSe/1.01/`](../002-fiscal-api/contracts/NFSe/1.01/).

**Princípio orientador**: reaproveitar o schema existente. Esta feature acrescenta campos e valores
de enum; **não cria tabela nova**. Toda alteração passa pelo gate `database-reviewer` (Constituição V)
e usa `citybox_uuid_v7()` como default de id.

---

## Como DPS e NFS-e convivem em `FiscalDocument`

O padrão nacional tem dois documentos encadeados: o contribuinte emite a **DPS**, o ambiente
nacional gera a **NFS-e** e a NFS-e retornada **encapsula** a DPS original (`NFSe/infNFSe/DPS/`).

Modelar como duas tabelas criaria uma junção obrigatória em toda leitura sem nenhum caso de uso que
precise da DPS isolada. A decisão (research §1) é usar as colunas que já existem:

| Papel | Coluna existente | Preenchida quando |
|---|---|---|
| Série da DPS | `rpsSeries` | na montagem, antes de transmitir |
| Número sequencial da DPS | `rpsNumber` | na montagem (reserva via `FiscalSequence`) |
| Número da NFS-e | `number` | quando o ambiente nacional gera a nota |
| Chave de acesso da NFS-e | `accessKey` | quando o ambiente nacional gera a nota |
| Série da NFS-e | `series` | quando aplicável ao município |

`rpsSeries`/`rpsNumber` existem no schema desde a entrega anterior e estavam sem uso. O papel
semântico é idêntico: documento de origem que se converte em nota fiscal.

**Invariante**: `rpsNumber` é atribuído **antes** de qualquer transmissão e nunca reatribuído.
`number`/`accessKey` só existem após aceitação. Um documento com `rpsNumber` e sem `accessKey` é uma
DPS transmitida sem desfecho — exatamente o caso que a retomada de idempotência trata.

---

## `FiscalDocument` — alterações

| Campo | Mudança | Motivo |
|---|---|---|
| `documentType` | passa a aceitar `NFSE` (valor já previsto) | — |
| `provider` | novo valor `SEFIN_NACIONAL` no enum `ProviderType` | substitui `ILHEUS_METROPOLIS_NFSE`, que sai de operação (research §7) |
| `rpsSeries`, `rpsNumber` | passam a ser efetivamente usados | identificação da DPS |
| `dpsObjectKey` | **novo**, nullable | chave do XML da DPS assinada no storage, gravada antes de transmitir — é o que torna a retomada possível sem re-assinar (mesmo mecanismo já aplicado à NF-e) |
| `municipalIncidenceCode` | **novo**, nullable, 7 dígitos | `cLocIncid` — localidade de incidência do ISSQN, que pode diferir do município do prestador |

**Não muda**: `status`, `idempotencyKey`, `sourceSystem`, `externalReference`, `totalAmount`,
`xmlObjectKey`, `errorCode`, `errorMessage`, timestamps. A máquina de estados é a mesma.

### Máquina de estados

Idêntica à da NF-e — foi desenhada genérica e comporta o padrão nacional sem alteração:

```
DRAFT → VALIDATING → NUMBER_RESERVED → XML_GENERATED → SIGNED → SENT → PROCESSING
PROCESSING → AUTHORIZED | REJECTED | SYNC_REQUIRED
AUTHORIZED → CANCEL_REQUESTED → CANCEL_AUTHORIZED | CANCEL_REJECTED
```

**Terminal**: `AUTHORIZED`, `REJECTED`, `DENIED`, `CANCEL_AUTHORIZED`, `INUTILIZED`,
`CORRECTION_LETTER_AUTHORIZED`. **Não terminal**: todo o resto — admite retomada de transmissão sem
consumir nova numeração. Essa classificação já existe em código e é reaproveitada.

---

## `FiscalDocumentItem` — alterações

Nenhuma estrutural. Para NFS-e, `itemType = 'SERVICE'`, `serviceCode` preenchido e `ncm`/`cfop`
nulos — o inverso do que a NF-e faz. O `taxJson` acomoda a tributação de serviço (ISSQN, e IBS/CBS
quando aplicável) sem migration.

---

## `FiscalEvent` — alterações

O enum atual (`ISSUE`, `CANCEL`, `CORRECTION_LETTER`, `INUTILIZATION`, `SYNC`) foi desenhado para
NF-e. O padrão nacional define 16 eventos tipificados (research §9).

| Campo | Mudança |
|---|---|
| `eventType` | novos valores: `CANCEL_BY_SUBSTITUTION`, `FISCAL_ANALYSIS_REQUEST`, `FISCAL_ANALYSIS_GRANTED`, `FISCAL_ANALYSIS_DENIED`, `OFFICIAL_CANCEL`, `OFFICIAL_BLOCK`, `OFFICIAL_UNBLOCK` |
| `nationalEventCode` | **novo**, nullable | código oficial do esquema (`e101101`, `e105102`, …) — preserva o código exato mesmo que nosso enum evolua |
| `generatorEnvironment` | **novo**, nullable | `ambGer`: 1 sistema próprio do município, 2 Sefin Nacional, 3 ADN — necessário para distinguir evento que emitimos de evento que apenas lemos |
| `replacedByDocumentId` | **novo**, nullable, FK para `FiscalDocument` | vínculo da substituição: qual nota substituiu esta |

> ### ⚠️ Correções do gate `database-reviewer` (T005, 2026-08-06)
>
> **1. Relação ambígua — bloqueia a geração do client.** `FiscalEvent` já tem uma FK para
> `FiscalDocument` (`fiscalDocumentId`). Adicionar `replacedByDocumentId` cria uma **segunda**
> relação entre o mesmo par de models, e o Prisma exige nome explícito em ambas ou falha com
> "Ambiguous relation detected". Não é preferência de estilo:
>
> ```prisma
> // FiscalEvent
> fiscalDocument     FiscalDocument? @relation("FiscalEventDocument", fields: [fiscalDocumentId], references: [id], onDelete: Cascade)
> replacedByDocument FiscalDocument? @relation("FiscalEventReplacement", fields: [replacedByDocumentId], references: [id])
>
> // FiscalDocument
> events            FiscalEvent[] @relation("FiscalEventDocument")
> replacementEvents FiscalEvent[] @relation("FiscalEventReplacement")
> ```
>
> **2. Índice obrigatório na FK nova**: `@@index([replacedByDocumentId])`. Além da regra do projeto
> de indexar toda FK, há padrão de consulta real — "a partir da nota nova, qual documento ela
> substituiu".
>
> **3. `generatorEnvironment` sem restrição de domínio.** `ambGer` é um conjunto fechado (1, 2, 3).
> Manter `Int?` preserva o valor oficial mesmo que nosso enum evolua, mas não impede lixo na
> coluna. Decisão registrada: validar no adaptador de domínio, **não** no banco — adicionar
> `CHECK` exigiria editar o `migration.sql` gerado, e a robustez extra não compensa sair do fluxo
> padrão para um campo que só nós escrevemos.
>
> **4. Checklist de conformidade** (padrão do resto do schema): `@map` snake_case em todos os
> campos novos, `@@map`/`@@schema("fiscal")` em `MunicipalParameters`, `@updatedAt` no `updatedAt`,
> e `@default(dbgenerated("public.citybox_uuid_v7()"))` **com o prefixo `public.`** — os demais
> models qualificam.

**Eventos que emitimos** nesta fase: cancelamento, cancelamento por substituição, solicitação de
análise fiscal. **Eventos que apenas lemos**: atos de ofício do município e manifestação das partes
— chegam pela consulta e precisam ser persistidos para a linha do tempo (US4), nunca gerados por nós.

---

## `Company` — alterações

| Campo | Mudança | Motivo |
|---|---|---|
| `nationalNfseEnabled` | **novo**, boolean, default `false` | marca se o município do prestador é aderente ao padrão nacional. Sustenta FR-020: recusar antes de transmitir, com mensagem que identifica o município |

`municipalRegistration`, `cityCodeIbge` e `taxRegime` já existem e são suficientes para a DPS.

---

## `MunicipalParameters` — **nova entidade**

Única tabela nova. Cacheia a parametrização consultada do ambiente nacional (research §5), que
determina prazos e exigências por município.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | default `citybox_uuid_v7()` |
| `cityCodeIbge` | String(7) | **único** |
| `parameters` | Json | payload da parametrização, guardado como veio |
| `fetchedAt` | DateTime | base do TTL |
| `createdAt` / `updatedAt` | DateTime | — |

**Por que Json e não colunas tipadas**: a parametrização é definida pelo município e evolui por ato
administrativo. Tipar cada campo agora significa migration a cada mudança de regra municipal. O que
o domínio precisa (prazo de cancelamento, prazo de substituição, exigência de tomador) é lido do
Json por um adaptador tipado na camada de domínio — a fronteira de tipagem fica no código, não no
schema.

**Invalidação**: diária, conforme proposta de research §5.

---

## `Certificate` e `Customer`

Sem alteração. O certificado A1 já é armazenado cifrado, parseado e validado quanto à vigência e à
correspondência de CNPJ — tudo que o padrão nacional exige (`E1200`–`E1209`). `Customer` já comporta
o tomador com inscrição federal e endereço.

---

## `ProviderRequest` — correção pendente

Não é mudança de schema: os campos `requestPayload`/`responsePayload` **já existem** e não são
gravados pelo repositório (research §10.1). A correção é de código, e vale igualmente para NF-e e
NFS-e.

---

## Resumo da migration

```
ALTER  FiscalDocument   + dpsObjectKey, + municipalIncidenceCode
ALTER  FiscalEvent      + nationalEventCode, + generatorEnvironment, + replacedByDocumentId (FK)
ALTER  Company          + nationalNfseEnabled (default false)
ENUM   FiscalEventType  + 7 valores
ENUM   ProviderType     + SEFIN_NACIONAL, − ILHEUS_METROPOLIS_NFSE
CREATE MunicipalParameters
```

Todas aditivas exceto a remoção de `ILHEUS_METROPOLIS_NFSE` do enum `ProviderType`.

### ⚠️ Pré-condições para remover `ILHEUS_METROPOLIS_NFSE` (corrigido pelo gate T005)

**A checagem original estava incompleta.** Eu verificava apenas `fiscal_documents`, mas `provider`
também é coluna de **`provider_requests`** — a tabela de auditoria de toda tentativa de transmissão
(FR-011), incluindo tentativas que nunca viraram documento autorizado. O Postgres rejeita o cast do
valor removido em **qualquer** tabela dependente do tipo, não só na que foi checada.

Rodar as **duas** queries em **cada** ambiente antes de aplicar:

```sql
SELECT provider, count(*) FROM fiscal.fiscal_documents  GROUP BY provider;
SELECT provider, count(*) FROM fiscal.provider_requests GROUP BY provider;
```

**Verificado no banco de dev em 2026-08-06**: `fiscal_documents` → `SEFAZ_BA_NFE: 8`;
`provider_requests` → `SEFAZ_BA_NFE: 1`. Nenhuma linha com `ILHEUS_METROPOLIS_NFSE` em nenhuma das
duas — coerente com o provider municipal sempre ter lançado antes de transmitir.

**A remoção também é mudança de código, não só de dado.** `ILHEUS_METROPOLIS_NFSE` está espelhado
manualmente em dois lugares do domínio (decisão de projeto: o domínio não depende de tipos gerados
pelo Prisma) e usado em mais cinco:

| Arquivo | Papel |
|---|---|
| `shared/domain/fiscal-provider.interface.ts` | `FISCAL_PROVIDER_TYPES` |
| `modules/fiscal-documents/domain/entities/fiscal-document.entity.ts` | `PROVIDER_TYPES` |
| `modules/providers/ilheus-metropolis/ilheus-metropolis.module.ts` | registro no factory |
| `modules/nfse/application/use-cases/issue-nfse/` · `cancel-nfse/` | seleção do provider |
| `modules/nfse/tests/fixtures/issue-nfse-test-context.ts` | fixture de teste |

Divergência entre schema e domínio **não quebra compilação** — quebra no INSERT em runtime. Por isso
a limpeza entra na mesma mudança que remove o valor do enum, não como follow-up.

**Janela de aplicação**: remover valor de enum no Postgres gera criação de tipo novo + `ALTER TABLE`
com rewrite em `fiscal_documents` **e** `provider_requests`, sob lock `ACCESS EXCLUSIVE`. São
tabelas de emissão fiscal ativa — aplicar fora do horário de emissão.
