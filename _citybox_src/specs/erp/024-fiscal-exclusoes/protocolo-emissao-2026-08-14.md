# Protocolo de emissão — fiscal-api em `api.aplopes.com`

Execução do roteiro de teste com dados reais em **14 de agosto de 2026**, contra o ambiente
implantado. Cada valor abaixo foi transmitido de verdade aos órgãos e o resultado registrado.

**Swagger:** <https://api.aplopes.com/fiscal/api/v1/docs#/> · **Base real das rotas:** `/fiscal/api/v1`

> ⚠️ **Homologação apenas.** `environment: HOMOLOGATION` em todos os passos. A recusa de produção foi
> testada de propósito no Passo 8 e confirmada.

---

## Resultado

**Roteiro executado de ponta a ponta, com sucesso.** NF-e e NFS-e autorizadas pelos órgãos,
consultadas, XML baixado, NFS-e substituída e ambas canceladas. As recusas esperadas da APLOPES
(`203` e `E0116`) reproduzidas exatamente.

| Empresa | Cadastro | Certificado | NF-e | NFS-e |
| --- | --- | --- | --- | --- |
| **RR** `50031609000104` | ✅ criada | ✅ VALID | ✅ **AUTHORIZED** nº 201 | ✅ **AUTHORIZED** nº 201 |
| **APLOPES** `36698609000123` | ✅ ajustada | ✅ VALID | ❌ `203` (esperado) | ❌ `E0116` (esperado) |

Nos quatro casos o pipeline funcionou por inteiro: XML montado, validado contra o XSD, assinado com
o A1, transmitido por TLS mútuo e **avaliado pelo órgão**. O que separa autorização de recusa é
cadastro do contribuinte, não software.

---

## Diferenças em relação ao roteiro original

| Item | Roteiro | Neste ambiente |
| --- | --- | --- |
| Base das rotas | `/api/v1/...` | **`/fiscal/api/v1/...`** (`/api/v1` devolve 502 no nginx) |
| Autorização | `dev-admin` | ❌ **não funciona** — exige JWT real do Keycloak |
| Identificador do documento | `id` | **`documentId`** |

O bypass está corretamente desligado: `auth.guard.ts` só o aceita com `NODE_ENV !== 'production'`
**e** `AUTH_DEV_BYPASS === 'true'`. Num ambiente publicado é o comportamento certo — o roteiro
original foi escrito para execução local.

⚠️ O token do Swagger **expira em ~15 min**. Se as rotas passarem a devolver 401 no meio do teste, é
só reautorizar.

---

## Passo 1 — Cadastrar os Emitentes ✅

| Empresa | `companyId` |
| --- | --- |
| RR EMPREENDIMENTOS | `96a3c268-25aa-4ee6-951e-adccbfb7f2ae` |
| APLOPES TECNOLOGIA | `070566ad-c97a-4ce6-9e08-2d0fde8b1249` |

A APLOPES já existia sem `accountingOfficeDocument` e com `nationalNfseEnabled: false`. Ajustei os
dois via `PATCH` (200) para que suas recusas fossem as de credenciamento, não as de campo faltando.

### Recusas de cadastro — as três batem ✅

| Cenário | Obtido |
| --- | --- |
| CNPJ repetido | `409 CompanyAlreadyExistsForCnpjError` |
| `storeId` repetido | `409 CompanyAlreadyExistsForStoreError` |
| CNPJ com DV errado | `422 ValidatorDomainError` — *"dígito verificador não confere"* |

`PATCH` confirmado: exige o objeto completo, inclusive `active`.

---

## Passo 2 — Certificados A1 ✅

| Empresa | Certificado | Validade |
| --- | --- | --- |
| RR | `34a0f63a-9d3d-4e19-a674-4d2c41b5301d` | ✅ VALID até 06/04/2027 |
| APLOPES | `5e06695f-8fc0-4de2-a7c9-1db8e2c3d41e` | ✅ VALID até 15/04/2027 |

CNPJ do certificado confere com o do Emitente nos dois casos.

---

## Passo 3 — NF-e ✅

### Primeira tentativa: rejeição `539` — a armadilha documentada

```
539  Rejeicao: Duplicidade de NF-e, com diferenca na Chave de Acesso.
     ...000000021222317805 diferente de ...000000021382028143  nRec: 291200011708131
```

A numeração local reiniciou em 1, mas a SEFAZ guarda a dela para este CNPJ de rodadas anteriores. É
exatamente o que o roteiro avisa em *"Limpar o banco NÃO reseta a numeração no órgão"*.

**Correção pela própria API** (não precisou de SQL) — `PATCH /sequences/{id}/number`:

```json
{ "newNumber": 200 }
```

### Segunda tentativa: autorizada ✅

| Campo | Valor |
| --- | --- |
| Status | **AUTHORIZED** |
| Número | 201 (série 1) |
| Protocolo | `129262000168400` |
| Chave | `29260850031609000104550010000002011382396529` |

---

## Passo 4 — NFS-e ✅

Mesma colisão primeiro (`E0014` — *"Conjunto de Série, Número, Código do Município Emissor e
CNPJ/CPF já existe"*), resolvida do mesmo modo.

| Campo | Valor |
| --- | --- |
| Status | **AUTHORIZED** |
| Número | 201 |
| Chave (50 díg.) | `29136062250031609000104000000000002526082451455765` |

---

## As recusas da APLOPES ✅ — o contraste que valida o teste

| Documento | Código | Mensagem do órgão |
| --- | --- | --- |
| NF-e | `203` | *"Rejeicao: Emissor nao habilitado para emissao da NF-e"* |
| NFS-e | `E0116` | *"A IM deve ser informada para o emitente prestador do serviço na DPS, conforme informações complementares registradas no CNC NFS-e do município emissor"* |

Mesmo código, mesmo ambiente, mesmo certificado válido — resultados diferentes por causa do cadastro
de cada contribuinte. É o que prova que as recusas são administrativas, não da API.

---

## Passo 5 — Consultar e baixar XML ✅

| Ação | Resultado |
| --- | --- |
| `GET /nfe/{id}` | 200 · AUTHORIZED · nº 201 · protocolo |
| `GET /nfse/{id}` | 200 · AUTHORIZED · nº 201 |
| `GET /nfe/{id}/xml` | 200 · **6.644 bytes** · `<nfeProc versao="4.00">` com `protNFe` |
| `GET /nfse/{id}/xml` | 200 · **9.488 bytes** · `<NFSe versao="1.01">` |

---

## Passo 6 — Substituir a NFS-e ✅

| Nota | Número | Status final |
| --- | --- | --- |
| Original | 201 | **CANCEL_AUTHORIZED** |
| Substituta | 202 | **AUTHORIZED** — chave `...2626084252773600` |

Confirmado que substituição **é emissão, não evento**: uma única chamada, e o Sefin cancela a
original sozinho. Não há janela com duas notas válidas.

### A regra de valor é aplicada antes de transmitir ✅

Substituição com valor diferente (2000 no lugar de 1500):

```
422  NFSE_SUBSTITUTION_VALUE_MISMATCH
     "A nota substituta deve ter o MESMO valor total, tomador e competência da original.
      A substituição corrige outros dados, não o valor — para alterar o valor, cancele e
      emita uma nota nova."
```

---

## Passo 7 — Cancelar ✅

### Justificativa mínima

```
POST /nfe/{id}/cancel  { "justification": "Erro" }
400  ["justification deve ter no mínimo 15 caracteres (exigência SEFAZ)"]
```

### NF-e — cancelada

| Campo | Valor |
| --- | --- |
| Status | **CANCEL_AUTHORIZED** |
| Protocolo de cancelamento | `129262004205490` |

Não houve o erro *"Chave de acesso inexistente"* que o roteiro menciona — a nota já tinha alguns
minutos de autorizada, tempo suficiente para a SEFAZ indexar.

### NFS-e — pedido em julgamento

Status **`CANCEL_REQUESTED`** — corresponde ao `path: FISCAL_ANALYSIS` do roteiro: fora do prazo
direto do município, o pedido vai a análise fiscal e a nota **segue válida** até a decisão.

---

## Passo 8 — Recusa de produção ✅

```
424  SefazEnvironmentNotConfiguredError
     "Ambiente \"PRODUCTION\" não está configurado para emissão fiscal"
```

Confirmei a parte importante: a recusa acontece **antes de reservar número fiscal** — não gerou
documento nem avançou a sequência.

### Validação de campos ✅

```
POST /nfe  { "presenceIndicator": "presencial" }
400  ["presenceIndicator must be one of the following values: 1, 2, 3, 9"]
```

Também não consumiu numeração.

---

## Achados

### 🔴 O 503 queima numeração fiscal

Registrado na fase anterior deste teste, quando os órgãos estavam inacessíveis. O pipeline monta o
XML, valida, **assina e reserva o número** — e só então transmite. Falhando com 503, o documento fica
em `SIGNED` e o número não volta.

Seis números foram consumidos assim (APLOPES 1-3 NF-e + 1 NFS-e; RR 1 NF-e + 1 NFS-e), sem nenhum
documento chegar ao órgão. Contrasta com o cuidado correto do Passo 8, onde a validação roda antes
da reserva.

Vale decidir: retentativa reaproveita o documento `SIGNED` (que já tem número, chave e assinatura),
varredura que retransmite, ou aceitar a queima e documentar que exige inutilização posterior.

### 🟡 Id inválido no path devolve 500

Passar um identificador inexistente/`undefined` em `GET /nfe/{id}` devolve **500 Internal server
error** em vez de 400 ou 404. Aconteceu comigo por causa da divergência `id` × `documentId`.

### 🟡 `path` não é exposto na consulta de NFS-e

O roteiro descreve `path` (`DIRECT` / `FISCAL_ANALYSIS`) na resposta do cancelamento. No
`GET /nfse/{id}` o campo não existe — só o `status` (`CANCEL_REQUESTED`), do qual dá para inferir.
Expor `path` na consulta evitaria a inferência.

---

## Estado final do ambiente

| Empresa | Documento | Nº | Status |
| --- | --- | --- | --- |
| RR | NF-e | 201 | CANCEL_AUTHORIZED |
| RR | NFS-e | 201 | CANCEL_AUTHORIZED (substituída) |
| RR | NFS-e | 202 | CANCEL_REQUESTED (em análise fiscal) |
| RR | NF-e / NFS-e | 2 | REJECTED (`539` / `E0014`) |
| RR | NF-e / NFS-e | 1 | SIGNED (órfãos do 503) |
| APLOPES | NF-e / NFS-e | — | REJECTED (`203` / `E0116`) |

Sequências da RR em **201** (NF-e e NFS-e), série 001, ambiente HOMOLOGATION.
