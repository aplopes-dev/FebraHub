# Contrato HTTP — NFS-e (padrão nacional)

Interface que a `fiscal-api` expõe aos sistemas internos da plataforma (ERP, verticais). **Não** é a
API do ambiente nacional — essa é consumida internamente pelo provider e está descrita em
[README.md](./README.md).

Base: `/api/v1/nfse` · Autenticação: Bearer JWT (Keycloak) · Permissões: `fiscal.documents.manage`
para escrita, `fiscal.documents.view` para leitura. Envelope de resposta: `{ "data": ... }` em
sucesso, `{ "error": { "code", "message" } }` em falha — mesmo padrão já usado pela NF-e.

---

## `POST /api/v1/nfse` — emitir

Monta a DPS, assina, transmite ao ambiente nacional e devolve o desfecho na mesma resposta (FR-007).

**Corpo** (campos além dos já existentes no DTO atual):

| Campo | Obrigatório | Notas |
|---|---|---|
| `companyId` | sim | prestador |
| `sourceSystem`, `externalReference`, `idempotencyKey` | sim | trio de idempotência (FR-009) |
| `environment` | não | default: o do prestador |
| `customer` | sim | tomador — documento, nome, endereço |
| `nfse.municipalServiceCode` | sim | código de tributação municipal |
| `nfse.nationalServiceCode` | sim | **novo** — código de tributação nacional (`cTribNac`); o padrão nacional o exige e ele condiciona a validação do local de incidência (regra `E1313`) |
| `nfse.incidenceCityCodeIbge` | não | `cLocIncid` — informar quando o local de incidência diferir do município do prestador |
| `nfse.issRate`, `nfse.issWithheld` | sim | tributação |
| `items[]` | sim | descrição, quantidade, valores, `serviceCode` |

**Respostas**

| Código | Quando |
|---|---|
| `201` | DPS aceita — corpo traz a NFS-e gerada com `accessKey`, `number`, `dpsNumber` |
| `200` | idempotência: mesma requisição já concluída, devolve o documento existente |
| `422` | rejeitado antes de transmitir (validação local) ou pelo ambiente nacional — `error.code` traz o código oficial (`E0001`–`E1309`) quando a rejeição vier de lá |
| `424` | prestador sem certificado válido, ou município não aderente (FR-020) |
| `503` | ambiente nacional indisponível — documento fica em estado não terminal, retomável |

**Idempotência**: repetir com o mesmo trio devolve a mesma nota (FR-009). Se o documento existente
estiver em estado **não terminal**, a transmissão é **retomada** a partir do XML da DPS guardado, sem
consumir nova numeração — mesma semântica já implementada para NF-e.

---

## `POST /api/v1/nfse/{id}/cancel` — cancelar

Corpo: `{ "justification": string }`.

O serviço decide entre **cancelamento direto** e **solicitação de análise fiscal** a partir da
parametrização do município (FR-012) — o chamador não precisa saber a diferença. A resposta indica
qual caminho foi seguido:

```json
{ "data": { "status": "CANCEL_AUTHORIZED", "path": "DIRECT" } }
{ "data": { "status": "CANCEL_REQUESTED", "path": "FISCAL_ANALYSIS" } }
```

`422` quando o estado atual não admite cancelamento (já cancelada, bloqueio de ofício vigente).

---

## `POST /api/v1/nfse/{id}/substitute` — substituir

Corpo: mesma estrutura de `POST /nfse`, sem `companyId` (herdado da nota original).

Gera uma nota nova e registra na original o evento de cancelamento por substituição, com vínculo
entre as duas (`replacedByDocumentId`). `422` quando a original não admite substituição — fora do
prazo parametrizado pelo município, sem identificação do tomador quando exigida, ou com análise
fiscal pendente.

---

## `GET /api/v1/nfse/{id}` — consultar

Devolve a nota com seus dados e estado atual.

## `GET /api/v1/nfse/{id}/xml` — documento fiscal

`Content-Type: application/xml`. Só disponível após geração da nota. `404` antes disso.

## `GET /api/v1/nfse/{id}/events` — linha do tempo

Lista os eventos em ordem cronológica, incluindo os **gerados pelo município** (atos de ofício) que
chegaram por consulta ao ambiente nacional — não apenas os que emitimos.

```json
{ "data": [ { "eventType": "...", "nationalEventCode": "e101101",
              "generatorEnvironment": 2, "createdAt": "...", "justification": "..." } ] }
```

---

## Mapeamento de erros

Rejeições do ambiente nacional preservam o código oficial em `error.code` e traduzem `error.message`
para linguagem acionável (research §4). Sem essa tradução o operador recebe `E1313` sem saber se
corrige cadastro, pedido ou procura a prefeitura.

| Origem | `error.code` | HTTP |
|---|---|---|
| Validação local (XSD, completude) | nome da classe de erro | `422` |
| Rejeição do ambiente nacional | código oficial (`E0001`–`E1309`) | `422` |
| Certificado ausente/vencido/CNPJ divergente | `CertificateNotValidError` e afins | `424` |
| Município não aderente | `MunicipalityNotSupportedError` | `424` |
| Falha de comunicação | `SefinNacionalUnavailableError` | `503` |
| Integração não configurada | `...NotConfiguredError` | `424` |

O filtro de exceções já mapeia por sufixo do nome da classe (`Unavailable` → 503, `NotFound` → 404,
`NotImplemented` → 501, `NotConfigured` → 424); os erros novos seguem a mesma convenção em vez de
introduzir mapeamento próprio.
