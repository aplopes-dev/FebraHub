# Roteiro de teste via Swagger — do cadastro à emissão

> 📌 Este roteiro cobre o fluxo **completo**: cadastro do Emitente, certificado, emissão de
> NF-e e NFS-e, cancelamento, substituição, as recusas esperadas e o documento auxiliar
> (DANFE/DANFSE).

Fluxo completo para testar `fiscal-api` manualmente: cadastrar Emitente → subir certificado → emitir NF-e → emitir NFS-e.

**Swagger:** <http://localhost:3116/api/v1/docs>

> ⚠️ **Todo este roteiro é homologação.** `environment` fica em `HOMOLOGATION` em todos os passos.
> Produção é recusada estruturalmente: `SEFIN_NACIONAL_PRODUCTION_ENDPOINT` e
> `SEFAZ_BA_NFE_PRODUCTION_ENDPOINT` não têm valor padrão, e sem elas a API lança 424 em vez de
> transmitir. Não defina essas variáveis para testar.

---

## Passo 0 — Autorizar

Sem isto **toda** rota devolve 401.

1. Clique em **Authorize** (cadeado, canto superior direito)
2. Cole exatamente: `dev-admin`
3. **Authorize** → **Close**

O Swagger envia `Authorization: Bearer dev-admin`. É um bypass de desenvolvimento reconhecido em
`shared/infra/http/guards/auth.guard.ts` — não existe em produção, onde vale o JWT do Keycloak.

---

## Passo 1 — Cadastrar o Emitente

`POST /api/v1/companies`

```json
{
  "storeId": "3f2b1c8e-5a4d-4e7f-9b2a-1c6d8e0f4a55",
  "cnpj": "50031609000104",
  "legalName": "RR EMPREENDIMENTOS E COMERCIO VAREJISTA DE MATERIAIS DE CONSTRUCAO LTDA",
  "tradeName": "RR Empreendimentos",
  "stateRegistration": "204887605",
  "municipalRegistration": null,
  "taxRegime": "SIMPLES_NACIONAL",
  "cityCodeIbge": "2913606",
  "uf": "BA",
  "nationalNfseEnabled": true,
  "accountingOfficeDocument": "13937073000156",
  "defaultEnvironment": "HOMOLOGATION",
  "address": {
    "street": "Avenida Soares Lopes",
    "number": "1000",
    "complement": "Sala 1",
    "district": "Centro",
    "city": "Ilhéus",
    "zipCode": "45653-000"
  }
}
```

> ✅ **Este payload é o que autorizou NF-e e NFS-e em 07/08/2026.** Não são valores de exemplo.

**Guarde o `id` devolvido** — é o `companyId` de todos os passos seguintes.

Um CNPJ já cadastrado devolve **409** com mensagem clara (`Já existe um emitente fiscal cadastrado
com este CNPJ`), não 500.

Para **corrigir** um cadastro depois, `PATCH /api/v1/companies/{id}` exige o objeto **completo**,
não só o campo alterado — inclusive `active`. Enviar parcial devolve 422 listando o que faltou.

### Os quatro campos que decidem se a emissão passa

| Campo | Por quê |
| --- | --- |
| `stateRegistration` (IE) | A SEFAZ-BA valida contra o cadastro estadual. Inventada → **209**; de outra empresa → **231** |
| `municipalRegistration` (IM) | ⚠️ **Condicional, não opcional.** Se o CNPJ está no CNC do município, a IM **deve** ir (`E0116` sem ela). Se **não** está, **não pode** ir (`E0120` com ela). A RR não está → fica `null` |
| `nationalNfseEnabled` | Sem `true`, a NFS-e é recusada com **422** antes de transmitir. Ilhéus aderiu ao Padrão Nacional (Decreto Municipal nº 220/2026) |
| `accountingOfficeDocument` | **Em homologação use `13937073000156` — o CNPJ da própria SEFAZ.** Sem o campo: rejeição 486. Com um CNPJ de contador real não cadastrado na SEFAZ: rejeição 487, cuja mensagem informa este mesmo número |

### Duas recusas de cadastro que aparecem antes de qualquer coisa fiscal

| Erro | Causa |
| --- | --- |
| `CNPJ inválido (dígito verificador não confere)` | O CNPJ é validado de verdade. Não dá para inventar um número qualquer — use um CNPJ com DV correto |
| `Esta loja já possui um emitente fiscal cadastrado` | **Um Emitente por Loja.** Para cadastrar outra empresa, use um `storeId` diferente |

`storeId` é um UUID qualquer que ainda não tenha Emitente — só amarra o Emitente a uma Loja da
plataforma; nada fiscal depende dele neste teste.

---

## Passo 2 — Subir o certificado A1

`POST /api/v1/companies/{companyId}/certificates` — é **multipart/form-data**, então o Swagger mostra
campos de formulário em vez de JSON.

| Campo | Valor |
| --- | --- |
| `file` | selecione o `.p12` / `.pfx` |
| `password` | senha do certificado |
| `name` | rótulo livre, ex.: `A1 producao restrita` |

O CNPJ do certificado precisa bater com o `cnpj` do Emitente — a API valida e recusa se divergirem.

### Confirmar que ficou válido

`GET /api/v1/certificates/{id}/status` — deve responder `ACTIVE` e uma data de expiração no futuro.

Se vier `PENDING`, ative com `PATCH /api/v1/certificates/{id}/activate`.

**Sem certificado válido nenhuma emissão sai**: as duas rotas param antes de montar o XML.

---

## Passo 3 — Emitir NF-e

`POST /api/v1/nfe`

```json
{
  "companyId": "COLE_O_ID_DO_PASSO_1",
  "sourceSystem": "teste-swagger",
  "externalReference": "TROQUE-A-CADA-TENTATIVA",
  "idempotencyKey": "TROQUE-A-CADA-TENTATIVA",
  "environment": "HOMOLOGATION",
  "operationNature": "Venda de mercadoria",
  "operationType": "1",
  "destinationIndicator": "1",
  "finalConsumer": true,
  "presenceIndicator": "1",
  "paymentMethodCode": "01",
  "customer": {
    "documentType": "CPF",
    "document": "11144477735",
    "name": "CLIENTE TESTE",
    "address": {
      "street": "Rua das Flores",
      "number": "250",
      "district": "Centro",
      "city": "Ilhéus",
      "uf": "BA",
      "cityCodeIbge": "2913606",
      "zipCode": "45650-000"
    }
  },
  "items": [
    {
      "description": "Produto de teste",
      "ncm": "22021000",
      "cfop": "5102",
      "quantity": 1,
      "unitValue": 10.0,
      "totalValue": 10.0,
      "csosn": "102"
    }
  ]
}
```

### Não preencha a razão social de homologação à mão

Em homologação a SEFAZ exige que o **nome do destinatário** seja exatamente
`NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL`.

**A API faz essa substituição sozinha.** Mande o nome real do cliente — só o `xNome` do XML é
trocado; CPF/CNPJ e endereço vão como você enviou. Digitar a literal manualmente é desnecessário e
arriscado: um acento ou hífen fora do lugar derruba a nota.

### Campos que são código, não texto livre

Enviar o nome em vez do número devolve **400** com a lista de valores aceitos.

| Campo | Valores | Significado |
| --- | --- | --- |
| `operationType` | `0` \| `1` | entrada \| **saída** |
| `destinationIndicator` | `1` \| `2` \| `3` | **interna** \| interestadual \| exterior |
| `presenceIndicator` | `1` \| `2` \| `3` \| `9` | **presencial** \| internet \| teleatendimento \| outros |
| `paymentMethodCode` | `01`, `03`, `04`… | `01` = dinheiro, `03` = crédito, `04` = débito |
| `csosn` / `cst` | `102` para Simples | Simples Nacional usa `csosn`; Lucro Presumido/Real usa `cst` |

### ⚠️ Troque `idempotencyKey` e `externalReference` a CADA tentativa

Esta é a pegadinha que mais custa tempo no teste manual.

Repetir a chave **não reenvia nada**: devolve a nota anterior tal como foi guardada. Se aquela
tentativa foi rejeitada, você recebe **a mesma rejeição de antes** — inclusive uma que já tenha sido
corrigida no código. Parece que "a correção não pegou", e não é isso: é a resposta armazenada.

Como saber se a resposta é replay:

| Sinal | Leitura |
| --- | --- |
| `issuedAt` com horário antigo | É a nota anterior, não uma emissão agora |
| `number` que você não esperava | A numeração não avançou porque nada foi transmitido |
| `errorCode` que você já corrigiu | Confirmação de que é resposta guardada |

A idempotência é escopada por **empresa + sourceSystem + externalReference + documentType +
idempotencyKey**. Trocar qualquer um deles gera uma emissão nova — o mais simples é trocar os dois
marcados como `TROQUE-A-CADA-TENTATIVA` acima.

---

## Passo 4 — Emitir NFS-e

`POST /api/v1/nfse`

```json
{
  "companyId": "COLE_O_ID_DO_PASSO_1",
  "sourceSystem": "teste-swagger",
  "externalReference": "OS-0001",
  "idempotencyKey": "TROQUE-A-CADA-TENTATIVA",
  "environment": "HOMOLOGATION",
  "customer": {
    "documentType": "CPF",
    "document": "11144477735",
    "name": "CLIENTE TESTE",
    "email": "cliente@exemplo.com",
    "address": {
      "street": "Rua das Flores",
      "number": "250",
      "district": "Centro",
      "city": "Ilhéus",
      "uf": "BA",
      "cityCodeIbge": "2913606",
      "zipCode": "45650-000"
    }
  },
  "nfse": {
    "serviceDescription": "Análise e desenvolvimento de sistemas",
    "municipalServiceCode": "01.01",
    "nationalServiceCode": "010101",
    "issRate": 0.05,
    "issWithheld": false
  },
  "items": [
    {
      "description": "Horas de desenvolvimento",
      "quantity": 10,
      "unitValue": 150.0,
      "totalValue": 1500.0,
      "serviceCode": "01.01"
    }
  ]
}
```

### `nationalServiceCode` é obrigatório na prática

O contrato marca como opcional, mas **sem ele o Sefin rejeita com `E0310`**. São duas tabelas
diferentes e é fácil confundir:

| Campo | Tabela | Formato | Exemplo |
| --- | --- | --- | --- |
| `municipalServiceCode` | LC 116/2003 (municipal) | `NN.NN` | `01.01` |
| `nationalServiceCode` | **nacional** (`cTribNac`) | 6 dígitos | `010101` |

Não é o municipal com zeros no fim — é uma tabela própria. `01.06` **não** vira `010600`.

---

## O que esperar

| Resposta | Leitura |
| --- | --- |
| `status: AUTHORIZED` + `protocol` | Autorizada. `GET /api/v1/nfe/{id}/xml` traz o XML |
| `status: REJECTED` + `errorCode` | Chegou ao órgão fiscal e foi avaliada. É problema de **dado**, não de infraestrutura |
| `422` | Recusada **antes** de transmitir (certificado inválido, município não habilitado, item inconsistente) |
| `424` | Ambiente de produção não configurado — a recusa deliberada. Não configure |
| `503` | Falha de comunicação. Aqui sim vale repetir |

### Rejeições que você provavelmente vai ver primeiro

| Código | Mensagem | O que fazer |
| --- | --- | --- |
| `209` (NF-e) | IE do emitente inválida | IE em formato inválido — corrigir `stateRegistration` |
| `231` (NF-e) | IE não vinculada ao CNPJ | A IE existe mas é de outra empresa. **Se você tem mais de um formato candidato, teste os dois**: só o correto passa desta checagem |
| `203` (NF-e) | Emissor não habilitado para emissão | **Credenciamento na SEFAZ-BA.** Não é código nem dado da API — é solicitação administrativa no portal da SEFAZ |
| `486` (NF-e) | Sem grupo de autorização (escritório de contabilidade) | Preencher `accountingOfficeDocument` no cadastro |
| `487` (NF-e) | Escritório de Contabilidade não cadastrado na SEFAZ | **Em homologação use o CNPJ da própria SEFAZ-BA: `13937073000156`.** A mensagem da rejeição informa o número |
| `745` (NF-e) | NF-e sem grupo do PIS | Já corrigido na API — se aparecer, a versão está desatualizada |
| `E0116` (NFS-e) | A IM deve ser informada… conforme registrado no CNC | Corrigir `municipalRegistration` com a IM real em Ilhéus |
| `E0310` (NFS-e) | Código de tributação nacional não existe | Corrigir `nationalServiceCode` (6 dígitos, tabela nacional) |

### ⚠️ Limpar o banco NÃO reseta a numeração no órgão fiscal

Se você truncar as tabelas locais, a numeração da API volta a 1 — **mas a SEFAZ e o Sefin guardam a
deles**. Reemitir os mesmos números devolve:

| Código | Documento |
| --- | --- |
| `539` | NF-e — "Duplicidade de NF-e, com diferença na Chave de Acesso" |
| `E0014` | NFS-e — "Série, Número, Município e CNPJ já existe em uma NFS-e gerada" |

**Solução**: avance a sequência para além do que já foi usado.

```sql
UPDATE fiscal.fiscal_sequences SET current_number = 100 WHERE current_number < 100;
```

### Cancelamento precisa de alguns segundos após a autorização

A SEFAZ leva tempo para indexar a nota recém-autorizada. Cancelar imediatamente devolve
`Chave de acesso inexistente` — **propagação, não defeito**. Verificado: com ~60 segundos (três
tentativas de 20s) o cancelamento autoriza.

A recusa **não trava a nota**: ela permanece `AUTHORIZED`, justamente para que a retentativa seja
possível. Se travasse em `CANCEL_REJECTED`, uma falha transitória viraria beco sem saída.

### Estado verificado em 2026-08-07 (emissões reais em homologação)

✅ **NF-e e NFS-e AUTORIZADAS** para a empresa RR EMPREENDIMENTOS (CNPJ `50031609000104`):

| Documento | Protocolo |
| --- | --- |
| NF-e | `129261000154446` |
| NFS-e | `29136062250031609000104000000000000426082632033618` |

Cadastro que funcionou: IE `204887605`, `accountingOfficeDocument` = **CNPJ da SEFAZ**
(`13937073000156`), `municipalRegistration` **vazia** (a empresa não está no CNC de Ilhéus).

⚠️ **A empresa APLOPES (`36698609000123`) NÃO autoriza NF-e**: para em `203 — Emissor não
habilitado`, que é **credenciamento do contribuinte** na SEFAZ-BA. O contraste entre as duas prova
que `203` não é defeito da API. Para NFS-e ela precisa da IM real (está no CNC, então a IM é
obrigatória — o oposto da RR).

Nos dois casos o pipeline inteiro funciona: XML montado, validado contra o XSD oficial, assinado,
transmitido por TLS mútuo e **avaliado pelo órgão fiscal**. O que falta é cadastro, não software.

### ⚠️ Se for testar por linha de comando em vez do Swagger

Neste ambiente Windows o `curl` **corrompe acentuação** antes de a requisição sair (`Ilhéus` vira
`Ilh<?>us`). O dado é gravado corrompido e a emissão falha depois com
`xMun ... not accepted by the pattern` — um sintoma que parece bug da API e não é.

Pelo **Swagger no navegador isso não acontece**. Se precisar de linha de comando, use Node com
`fetch` ou um arquivo gravado em UTF-8, nunca `curl -d` com acento inline.

---

## Depois da emissão

| Ação | Rota |
| --- | --- |
| Consultar a nota | `GET /api/v1/nfe/{id}` · `GET /api/v1/nfse/{id}` |
| Baixar o XML | `GET /api/v1/nfe/{id}/xml` · `GET /api/v1/nfse/{id}/xml` |
| Cancelar | `POST /api/v1/nfe/{id}/cancel` · `POST /api/v1/nfse/{id}/cancel` |
| Linha do tempo | `GET /api/v1/nfse/{id}/events` |
| Substituir (NFS-e) | `POST /api/v1/nfse/{id}/substitute` |
| **Baixar o documento impresso** | `GET /api/v1/nfe/{id}/danfe` · `GET /api/v1/nfse/{id}/danfse` |

### Passo 5 — Documento auxiliar (DANFE / DANFSE)

Com a nota autorizada, pegue o PDF que vai para o cliente. O Swagger não exibe
PDF inline — use `curl` para salvar em arquivo:

```bash
curl -s -o danfe.pdf   -H "X-Company-Id: {companyId}"   "http://localhost:3116/api/v1/nfe/{id}/danfe"

curl -s -o danfse.pdf   -H "X-Company-Id: {companyId}"   "http://localhost:3116/api/v1/nfse/{id}/danfse"
```

⚠️ **`X-Company-Id` é obrigatório aqui** — diferente das rotas de XML. Se o id
for de outro emitente, a resposta é `404` (e não `403`, porque 403 confirmaria
que a nota existe).

**Abra os dois arquivos.** O que conferir:

| Verificação | Por quê |
| --- | --- |
| A **marca d'água** `SEM VALOR FISCAL` cobre a página | É homologação; um documento de teste indistinguível de um real é risco de fraude involuntária |
| A **chave de acesso** confere com a da nota | Prova que o PDF veio do XML autorizado |
| O DANFSE é **visivelmente diferente** do DANFE | São dois leiautes, duas legislações |
| Imprima em **preto e branco** | A marca precisa continuar visível e os dados legíveis |

Headers que o ERP vai consumir:

```bash
curl -sI -H "X-Company-Id: {companyId}"   "http://localhost:3116/api/v1/nfe/{id}/danfe" | grep -iE "x-document-origin|x-fiscal-validity"
# X-Document-Origin: LOCAL
# X-Fiscal-Validity: NONE
```

`X-Fiscal-Validity: NONE` é o sinal de "não envie ao cliente" — o ERP deve
bloquear o disparo automático por este header, sem depender de leitura visual.

**Teste a recusa também**, com o id de uma nota rejeitada: deve vir `422` com
o estado atual na mensagem, nunca `200` com PDF vazio.

**Substituição de NFS-e** emite uma nota nova com bloco `subst` e o órgão cancela a original — não é
um evento separado. Três regras que o Sefin impõe:

| Regra | Consequência se violada |
| --- | --- |
| Mesma competência, tomador e **valor total** da original | `E0063` — a API valida antes e devolve 422 |
| Original precisa estar autorizada (com chave de NFS-e) | 422 `MISSING_ACCESS_KEY` |
| `reasonCode` da tabela `TSCodJustSubst` (`01`–`05`, `99`) | Não confundir com a de cancelamento (`1`/`2`/`9`) |

A resposta traz `{ data: { original, substitute } }` — a original volta `CANCEL_AUTHORIZED`.

Cancelamento exige `justification` com **mínimo de 15 caracteres** — é o leiaute que exige, não nós.

No cancelamento de NFS-e a resposta traz `path`:

- `DIRECT` → cancelada (dentro do prazo publicado pelo município)
- `FISCAL_ANALYSIS` → **pedido em julgamento**; a nota segue válida até o município decidir, e o
  status fica `CANCEL_REQUESTED`, não `CANCEL_AUTHORIZED`

---

### Passo 6 — Cupom fiscal (NFC-e)

> 🟡 Este passo **nunca foi executado com sucesso contra a SEFAZ**. Ele é o que
> valida o cupom pela primeira vez — se algo falhar aqui, é esperado, e o valor
> está em descobrir **o quê**.

**Pré-requisitos que não são código:**

1. **CSC** obtido junto à SEFAZ-BA, cadastrado em `PUT /v1/companies/{id}/csc`.
   Sem ele: `424`.
2. **URLs de consulta** configuradas (`NFCE_QRCODE_URL_BA_HOMOLOGATION` e
   `NFCE_CHAVE_URL_BA_HOMOLOGATION`). Sem elas: `424`.
3. **Credenciamento para modelo 65** — distinto do de NF-e. Se der rejeição de
   credenciamento, **não é defeito da API**: é cadastro junto ao órgão.

**6.1 — Emitir** (`POST /v1/nfce`, com o header `X-Company-Id`)

Use uma venda simples, **sem `consumer`** — é o caso comum de balcão e o que
mais facilmente estaria quebrado por cópia da NF-e:

```json
{
  "sourceSystem": "pdv", "externalReference": "cupom-teste-1",
  "idempotencyKey": "cupom-teste-1", "environment": "HOMOLOGATION",
  "items": [{ "description": "CIMENTO CP II 50KG", "ncm": "25232910",
              "cfop": "5102", "quantity": 2, "unitValue": 42.5,
              "totalValue": 85, "csosn": "102" }],
  "payments": [{ "method": "01", "amount": 100 }]
}
```

Esperado: `201`, chave de 44 dígitos com **`65` nas posições 21-22** e **`1` na
posição 35**, e `protocol` preenchido.

**6.2 — ⚠️ O teste que realmente importa: escanear o QR Code**

```
GET /api/v1/nfce/{id}/xml
```

Ache `<qrCode>` dentro de `<infNFeSupl>`. **Abra a URL no celular.**

A consulta pública da SEFAZ-BA precisa exibir **este** cupom. Se exibir "não
encontrado", o hash do QR Code está errado — e esse é o defeito que nenhum
teste local pega, porque o XSD só exige 40 dígitos hexadecimais e qualquer
SHA-1 os satisfaz.

Enquanto este passo não passar, o cupom **não pode ir a produção**, mesmo com a
suíte verde.

**6.3 — Documento impresso**

```
GET /v1/nfce/{id}/danfce            → bobina (73 mm)
GET /v1/nfce/{id}/danfce?formato=a4 → A4
```

Confira que os dois trazem a mesma chave, o mesmo total e o mesmo pagamento.
Leiaute diferente é esperado; **dado diferente é defeito**.

**6.4 — Numeração isolada**

Emita uma NF-e e um cupom. As sequências são independentes: emitir cupom **não**
pode avançar a numeração de NF-e.

**6.5 — Cancelamento (dentro de 30 minutos!)**

`POST /v1/nfce/{id}/cancel`. O prazo é **muito mais curto** que o da NF-e — se
demorar para chegar aqui, vai receber `409`, e isso é o comportamento correto.

---

## Subir a API

```bash
pnpm infra:up
pnpm --filter @citybox/fiscal-api prisma migrate deploy
pnpm --filter @citybox/fiscal-api start:dev
```

Confira em <http://localhost:3116/api/health> antes de abrir o Swagger.
