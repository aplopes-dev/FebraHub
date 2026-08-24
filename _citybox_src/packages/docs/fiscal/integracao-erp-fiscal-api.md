# Manual de Integração — ERP → fiscal-api

Como o `@citybox/erp-api` provisiona emitentes e emite NF-e e NFS-e através da
`@citybox/fiscal-api`, e quais dados do cadastro do ERP alimentam cada campo.

**Escrito em 2026-08-06.** Reflete o estado real do código nas duas pontas, não um desenho
pretendido. Onde algo ainda não existe, está marcado como ⛔ **bloqueio** com o que falta.

| | |
|---|---|
| Origem | `apps/erp/api` (`@citybox/erp-api`, :3114) |
| Destino | `services/fiscal-api` (`@citybox/fiscal-api`, :3116) |
| Referências | [`services/fiscal-api/AGENTS.md`](../../../services/fiscal-api/AGENTS.md) · [`specs/002-fiscal-api/`](../../../specs/002-fiscal-api/) · [`specs/003-nfse-padrao-nacional/`](../../../specs/003-nfse-padrao-nacional/) |

---

## 1. Fluxo geral

```
Cadastro de filial no ERP
        │
        ├─(1)─► POST /api/v1/companies              provisiona o Emitente fiscal
        │
        ├─(2)─► POST /api/v1/companies/{id}/certificates   sobe o A1
        │       PATCH /api/v1/certificates/{id}/activate
        │
Venda / atendimento concluído no ERP
        │
        ├─(3a)─► POST /api/v1/nfe    (mercadoria)  ──► SEFAZ-BA
        └─(3b)─► POST /api/v1/nfse   (serviço)     ──► Sistema Nacional NFS-e
```

Os passos 1 e 2 acontecem **uma vez por filial**. O passo 3 acontece a cada venda.

A emissão é **síncrona**: o desfecho vem na própria resposta. Não há callback nem polling no
caminho feliz.

---

## 2. Autenticação

A `fiscal-api` exige JWT do Keycloak em toda rota (nenhuma é pública além do health). Para
chamada máquina-a-máquina, use o **mesmo padrão já implementado** em
[`http-vertical-member-provisioning.adapter.ts`](../../../apps/admin/api/src/modules/stores/infrastructure/providers/http-vertical-member-provisioning.adapter.ts):
`client_credentials` contra o Keycloak, com cache do token e renovação 30s antes de expirar.

Não crie segredo novo — reaproveite o client de serviço que o ERP já usa.

### Permissões

O client precisa de uma role que resolva as permissões fiscais. Em
[`permissions.ts`](../../../services/fiscal-api/src/shared/infra/http/decorators/permissions.ts):

| Role | Permissões concedidas |
|---|---|
| `fiscal_operator` | `fiscal.companies.manage`, `fiscal.certificates.manage`, `fiscal.documents.manage`, `fiscal.documents.view` |
| `platform_admin` | as mesmas, mais `platform.admin` |

**Use `fiscal_operator`** para o client do ERP. `platform_admin` concede mais do que o ERP precisa.

### Em desenvolvimento

Com `AUTH_DEV_BYPASS=true` no `.env` da `fiscal-api`, o token literal `dev-admin` é aceito e
resolve como `platform_admin`. Só funciona fora de `NODE_ENV=production`.

---

## 3. Provisionar o Emitente — `POST /api/v1/companies`

O Emitente fiscal corresponde a uma **`Branch`** (filial) do ERP, não a `Organization`. Cada
estabelecimento tem CNPJ próprio e **numeração fiscal própria** — misturar filiais em um único
Emitente quebraria a sequência de numeração, que é por CNPJ.

### De-para

| Campo `fiscal-api` | Origem no ERP | Obrigatório | Observação |
|---|---|---|---|
| `storeId` | `Organization.platformStoreId` | sim | UUID. Se a organização nasceu direto no ERP (sem passar pelo admin), esse campo é nulo — ver §3.1 |
| `cnpj` | `Branch.document` | sim | só dígitos |
| `legalName` | `Branch.legalName` | sim | |
| `tradeName` | `Branch.tradeName` | não | |
| `stateRegistration` | `Branch.stateRegistration` | não pela API, **sim na prática** | vai ao XML como string vazia se nulo, e a SEFAZ rejeita |
| `municipalRegistration` | `Branch.municipalRegistration` | não | **obrigatório para NFS-e** |
| `taxRegime` | `Branch.taxRegime` | sim | ⛔ enums divergem — ver §7.2 |
| `cityCodeIbge` | — | sim | ⛔ **não existe no ERP** — ver §7.1 |
| `uf` | `Branch.state` | sim | 2 letras |
| `address.street` | `Branch.street` | sim | |
| `address.number` | `Branch.number` | sim | |
| `address.complement` | `Branch.complement` | não | |
| `address.district` | `Branch.neighborhood` | sim | ⚠️ único campo com nome diferente entre as duas pontas — `CustomerAddress` já usa `district` |
| `address.city` | `Branch.city` | sim | |
| `address.zipCode` | `Branch.zipCode` | sim | mín. 8 caracteres |
| `defaultEnvironment` | — | não | `HOMOLOGATION` por padrão |

### 3.1 `storeId` quando a organização não veio da plataforma

`Organization.platformStoreId` é nulo em organização criada direto no ERP — o próprio schema
documenta isso ("o ERP roda autônomo"). A `fiscal-api` exige um UUID e o campo é `@unique`.

Duas saídas, a decidir: usar `Branch.id` como `storeId` (é UUID e é único), ou recusar o
provisionamento fiscal para organização sem vínculo com a plataforma. **A primeira é preferível** —
o `storeId` na `fiscal-api` é só uma referência de origem, não uma FK.

### 3.2 Quando chamar

Não provisione automaticamente na criação da filial. Emitir nota exige certificado digital, que o
lojista pode não ter no dia do cadastro. Prefira um passo explícito de **"habilitar emissão fiscal"**
na tela da filial, que valida os campos fiscais e só então chama a `fiscal-api`.

Isso também dá onde exibir os erros de cadastro (IE faltando, IBGE faltando) no momento certo.

---

## 4. Certificado digital

```
POST /api/v1/companies/{companyId}/certificates    multipart: file, password, name
PATCH /api/v1/certificates/{id}/activate
```

Regras que a API aplica:

- o arquivo deve ser `.pfx`/`.p12` real (validação por assinatura binária, não pelo mime declarado);
- o **CNPJ dentro do certificado precisa bater** com o `cnpj` do Emitente — senão
  `CertificateCnpjMismatchError`;
- certificado vencido é recusado no upload, não na emissão;
- a senha é cifrada em repouso (AES-256-GCM) e **nunca** volta em resposta.

O certificado precisa ser **e-CNPJ A1 ICP-Brasil**. Autoassinado atravessa upload, parse e
assinatura local, mas é recusado pelos dois órgãos — a SEFAZ derruba no nível da aplicação e o
Sistema Nacional rejeita com `E1208` (raiz diferente da ICP-Brasil).

`GET /api/v1/certificates/{id}/status` devolve `daysUntilExpiration` — vale exibir alerta no ERP,
porque certificado vencido para a emissão sem aviso.

---

## 5. Emitir NF-e — `POST /api/v1/nfe`

### Cabeçalho da operação

| Campo | Origem sugerida no ERP | Observação |
|---|---|---|
| `companyId` | id do Emitente guardado ao provisionar | guarde-o na `Branch` |
| `sourceSystem` | constante `"erp"` | |
| `externalReference` | id da venda/pedido | é o que liga a nota ao documento de origem |
| `idempotencyKey` | id da venda | ver §8 |
| `environment` | — | omitir usa o padrão do Emitente |
| `operationNature` | natureza da operação | ex.: `"VENDA DE MERCADORIA"` |
| `operationType` | `"1"` saída / `"0"` entrada | |
| `destinationIndicator` | `"1"` interna, `"2"` interestadual, `"3"` exterior | derive de `Branch.state` vs. UF do destinatário |
| `finalConsumer` | booleano | `false` quando o destinatário é contribuinte revendendo |
| `presenceIndicator` | `"1"` presencial, `"2"` internet, `"9"` outros | |
| `paymentMethodCode` | tabela `tPag` | `01` dinheiro, `03` crédito, `17` PIX |

### Destinatário

| Campo | Origem no ERP |
|---|---|
| `customer.documentType` | `Customer.personType` → `PF`=`CPF`, `PJ`=`CNPJ` |
| `customer.document` | `Customer.document` |
| `customer.name` | `Customer.name` |
| `customer.email` | `Customer.email` |
| `customer.address.*` | `CustomerAddress` — nomes batem (`street`, `number`, `complement`, `district`, `city`, `zipCode`); `uf` vem de `CustomerAddress.state` |
| `customer.address.cityCodeIbge` | — ⛔ **não existe** — ver §7.1 |

> ⚠️ **Todos os campos de `CustomerAddress` são nullable no ERP**, mas a `fiscal-api` exige
> `street`, `number`, `district`, `city` e `uf` quando o endereço do destinatário é enviado. Valide
> antes de montar o payload — ou omita `customer.address` por inteiro (é opcional), aceitando que a
> nota sai sem endereço do destinatário.

> ⚠️ **Em homologação**, o `customer.name` precisa ser exatamente
> `NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL`. Regra da SEFAZ; o builder de XML
> não a força, usa o nome que receber.

### Itens

| Campo | Origem no ERP |
|---|---|
| `description` | `Product.name` |
| `ncm` | `ProductFiscal.ncm` |
| `cfop` | `ProductFiscalBranch.cfop` → cai para `ProductFiscal.cfop` |
| `quantity`, `unitValue`, `totalValue` | linha da venda |
| `cst` ou `csosn` | de `ProductFiscal.icms` / `ProductFiscalBranch.icms` |

`totalValue` precisa ser consistente com `quantity × unitValue` — inconsistência é recusada com
**422 antes** de consumir numeração.

**Qual usar, `cst` ou `csosn`**: depende do regime. Simples Nacional usa `csosn` (ex.: `102`);
Lucro Presumido/Real usa `cst`. O ERP guarda o código em `icms` como string; a integração precisa
decidir em qual dos dois campos colocá-lo a partir de `Branch.taxRegime`.

`ProductFiscal` ainda tem `cest`, `origin`, `pisCofins`, `ipi`, `fcpPercent` e `cstIbsCbs` que a
`fiscal-api` **ainda não recebe** — o DTO atual cobre o essencial de uma venda simples. Ampliar o
contrato é evolução prevista, não defeito.

### Resposta

| HTTP | Significado |
|---|---|
| `201` | processado — ver `data.status` |
| `422` | recusado (validação local ou rejeição do órgão) |
| `424` | sem certificado válido |
| `503` | falha de comunicação — documento fica retomável |

`data.status` em `AUTHORIZED` traz `protocol` e `accessKey` (44 dígitos). `REJECTED` traz
`errorCode`/`errorMessage`. `SYNC_REQUIRED` significa que a transmissão não teve desfecho — não
trate como erro nem como sucesso; ver §8.

Ciclo de vida: `POST /nfe/{id}/cancel`, `POST /nfe/{id}/correction-letter`, `POST /nfe/inutilize`,
`GET /nfe/{id}`, `GET /nfe/{id}/xml`.

---

## 6. Emitir NFS-e — `POST /api/v1/nfse`

⛔ **A transmissão ainda não existe.** O provider é um stub que responde `501`. O que funciona hoje:
montagem da DPS, assinatura, validação contra o XSD oficial, numeração e persistência. A parte que
falta depende do certificado — ver §7.3.

O contrato abaixo é o do código atual e serve para o ERP já integrar.

### Diferenças estruturais em relação à NF-e

No padrão nacional o contribuinte **não emite a nota**: emite uma **DPS** (Declaração de Prestação
de Serviços) e o ambiente nacional gera a NFS-e a partir dela. Para quem chama a `fiscal-api` isso é
transparente — a resposta traz a nota — mas explica por que os campos são de serviço, não de
mercadoria.

### Campos

| Campo | Origem no ERP | Observação |
|---|---|---|
| `companyId`, `sourceSystem`, `externalReference`, `idempotencyKey` | igual à NF-e | |
| `customer.*` | `Customer` + `CustomerAddress` | mesmo mapeamento da NF-e |
| `nfse.serviceDescription` | descrição do serviço | texto livre |
| `nfse.municipalServiceCode` | código de serviço | formato `NN.NN` (ex.: `17.02`) — validado por regex |
| `nfse.nationalServiceCode` | código de tributação nacional (`cTribNac`) | 6 dígitos, tabela **nacional** — não é o municipal com zeros. Opcional no contrato, **necessário na prática**: sem ele derivamos do municipal e o Sefin rejeita com `E0310` (verificado em homologação, 2026-08-06) |
| `nfse.issRate` | alíquota do ISS | decimal (ex.: `0.05`) |
| `nfse.issWithheld` | ISS retido na fonte | booleano |
| `items[].description` | descrição | |
| `items[].serviceCode` | código de serviço do item | formato `NN.NN` |
| `items[].quantity`, `unitValue`, `totalValue` | linha | mesma regra de consistência |
| `items[].taxJson` | — | livre, para tributação adicional |

Não há `ncm`/`cfop`/`cst`/`csosn` — são conceitos de mercadoria.

**`municipalRegistration` do Emitente é obrigatória** para NFS-e, ainda que a API não a exija no
cadastro.

Município: hoje a `fiscal-api` só aceita Ilhéus (`2913606`) e recusa os demais com
`MunicipalityNotSupportedError` **antes** de qualquer transmissão.

Ciclo de vida: `POST /nfse/{id}/cancel`, `GET /nfse/{id}`, `GET /nfse/{id}/xml`.

---

## 6.1 Documento auxiliar impresso — DANFE / DANFSE

Depois que a nota é autorizada, o ERP precisa entregar ao cliente um documento
imprimível. São **dois documentos distintos**, com leiautes e legislações
próprias — não é o mesmo PDF com dados diferentes.

| Nota | Endpoint | Documento |
| --- | --- | --- |
| NF-e | `GET /api/v1/nfe/{id}/danfe` | DANFE |
| NFS-e | `GET /api/v1/nfse/{id}/danfse` | DANFSE |

```http
GET /api/v1/nfe/{id}/danfe
X-Company-Id: {companyId do emitente}
```

Resposta: `application/pdf`. Nada de envelope JSON — o corpo é o arquivo.

### Três headers que o ERP deve ler

| Header | Para quê |
| --- | --- |
| `Content-Disposition` | Nome sugerido, derivado da chave de acesso |
| `X-Document-Origin` | `LOCAL` ou `OFFICIAL_API` — qual caminho produziu o arquivo |
| `X-Fiscal-Validity` | `VALID` ou `NONE` |

**`X-Fiscal-Validity` é o que evita o pior acidente desta integração.** Vale
`NONE` quando a nota foi emitida em homologação. O PDF já sai com marca d'água
cobrindo a página, mas **não confie na leitura visual**: se o ERP envia o
documento por e-mail ou WhatsApp automaticamente, bloqueie o envio quando o
header for `NONE`. Um documento de teste chegando ao cliente como se valesse é
problema para os dois lados.

### Erros

| HTTP | Código | O que fazer |
| --- | --- | --- |
| `404` | `FiscalDocumentNotFoundError` | Nota inexistente **ou de outro emitente**. Confira o `X-Company-Id`. |
| `422` | `DOCUMENT_NOT_PRINTABLE` | A nota não está autorizada. A mensagem diz o estado atual e o próximo passo — exiba-a ao operador em vez de um erro genérico. |
| `503` | `AUTHORIZED_XML_UNAVAILABLE` | Falha temporária ao recuperar o XML autorizado. Tente de novo. |

O `422` **não é** para tratar como falha da integração: nota em `PROCESSING`
ainda vai ser autorizada, e o ERP deve orientar a aguardar, não reemitir.

### Duas coisas que valem saber

**Reimpressão é o mesmo endpoint.** Não há "segunda via" separada: chamar de
novo devolve conteúdo idêntico, mesmo meses depois e mesmo que o cadastro da
empresa tenha mudado — o documento representa a nota como ela foi autorizada.

**Nota cancelada é entregue, marcada como cancelada.** Não é erro: o histórico
precisa ser reconstituível. Só notas que **nunca** foram autorizadas são
recusadas.

---

## 6.2 Emitir cupom fiscal — `POST /api/v1/nfce`

> 🟡 **Nenhum cupom foi transmitido à SEFAZ ainda.** O código está completo e
> testado, mas o hash do QR Code e o caminho de contingência não foram
> exercitados contra o órgão. Não integre em produção sem antes fazer o teste
> descrito em "Antes de integrar".

O cupom fiscal (NFC-e, modelo 65) é o documento da **venda de balcão**: presencial,
consumidor final, e na maioria das vezes **sem identificação do consumidor**.

### Diferenças em relação à NF-e que mudam o código do ERP/PDV

| | NF-e | Cupom (NFC-e) |
| --- | --- | --- |
| Destinatário | Obrigatório | **Opcional** — o caso comum é não ter |
| Emitente da requisição | `companyId` no corpo | Header **`X-Company-Id`** |
| Pagamento | Um código | **Lista** — cartão + dinheiro na mesma venda |
| Prazo de cancelamento | 24 horas | **30 minutos** |
| Substituição | — | **Não existe.** Fora do prazo, é ajuste comercial |
| Numeração | Sequência própria | Sequência **separada** da NF-e |
| Documento impresso | A4 | **Bobina** (padrão) ou A4 |

### Requisição

```http
POST /api/v1/nfce
Authorization: Bearer <token>
X-Company-Id: <uuid do Emitente>
Content-Type: application/json
```

```json
{
  "sourceSystem": "pdv",
  "externalReference": "venda-001",
  "idempotencyKey": "venda-001",
  "environment": "HOMOLOGATION",
  "items": [
    { "description": "CIMENTO CP II 50KG", "ncm": "25232910", "cfop": "5102",
      "quantity": 2, "unitValue": 42.5, "totalValue": 85, "csosn": "102" }
  ],
  "payments": [
    { "method": "03", "amount": 50 },
    { "method": "01", "amount": 50 }
  ]
}
```

`payments` é lista porque parte em cartão e resto em dinheiro é rotina. O **troco**
é calculado do excedente em dinheiro — não se informa. Excedente sem pagamento em
dinheiro é recusado (`422`): cartão não devolve troco.

`consumer` só é obrigatório **acima do limite estadual**; abaixo dele, omita.

### ⚠️ O que o PDV faz com `emissionType: "CONTINGENCY"`

Quando a SEFAZ está inalcançável, a API **conclui a venda mesmo assim** e responde
`201` com `emissionType: "CONTINGENCY"`. O cupom é válido e deve ser entregue.

O que muda para o PDV:

1. **Imprima normalmente.** O documento sai com uma faixa preta no topo dizendo
   `EMITIDA EM CONTINGENCIA - PENDENTE DE AUTORIZACAO`. Não é erro.
2. **Não tente reemitir.** O cupom já existe e está enfileirado. Reemitir criaria
   um segundo documento fiscal para a mesma venda.
3. **`protocol` vem `null` e o status é `SIGNED`**, não `AUTHORIZED`. Um PDV que
   exija protocolo para fechar a venda vai travar — trate os dois estados.
4. **A transmissão posterior é do servidor.** O ERP não precisa fazer nada; a fila
   é persistente e drena quando o órgão volta.
5. **Consulte depois.** `GET /api/v1/nfce/{id}` reflete o desfecho. Um cupom de
   contingência pode ser **rejeitado** na transmissão posterior — o papel já está
   com o cliente, e isso exige tratamento fiscal, não técnico.

### Recusas que o ERP precisa distinguir

| Código | Situação | O que fazer |
| --- | --- | --- |
| `422` | Valor acima do limite sem consumidor | Peça o CPF, ou emita NF-e |
| `422` | Pagamento não fecha com o total | Corrija os valores |
| `424` | **CSC não cadastrado** | Cadastro, não código — `PUT /v1/companies/{id}/csc` |
| `424` | URL de consulta não configurada | Configuração de ambiente |
| `409` | Cancelamento fora dos 30 min | Não ofereça substituição; não existe |

Nenhuma dessas recusas **avança a numeração** — é garantido por teste. Número
reservado e não usado exige inutilização junto à SEFAZ.

### Documento impresso — `GET /api/v1/nfce/{id}/danfce`

`?formato=a4` devolve a via A4; o padrão é a **bobina** (73 mm, para térmica de
80 mm). Os dois trazem os **mesmos dados fiscais** — leiaute diferente, fatos
idênticos.

> 📋 Roteiro de teste ponta a ponta em homologação:
> [`roteiro-teste-nfce-homologacao.md`](./roteiro-teste-nfce-homologacao.md)

### Antes de integrar

1. Obtenha o **CSC** junto à SEFAZ-BA e cadastre em `PUT /v1/companies/{id}/csc`.
2. Confirme o **credenciamento para modelo 65** — é **distinto** do de NF-e. Uma
   empresa pode emitir nota e ser recusada em cupom.
3. Emita um cupom em homologação e **escaneie o QR Code com o celular**. A consulta
   pública da SEFAZ-BA precisa exibir aquele cupom. Enquanto isso não for feito uma
   vez, o algoritmo do QR Code não está provado.

---

## 7. Bloqueios de cadastro a resolver no ERP

### 7.1 ⛔ Código IBGE do município não existe no ERP

`grep -i ibge` no schema do ERP retorna **zero** ocorrências. O ERP guarda `city` como texto livre e
`state` como sigla.

Isso não é preenchimento opcional: o código IBGE de 7 dígitos **compõe a chave de acesso da NF-e e o
identificador da DPS**. Sem ele não há emissão de nenhum dos dois documentos. É necessário em três
lugares distintos:

1. município do **emitente** (`Company.cityCodeIbge`);
2. município do **destinatário** (`customer.address.cityCodeIbge`);
3. **local de incidência do ISSQN** na NFS-e, que pode diferir dos dois.

**Não resolva por lookup de nome de cidade.** Há homônimos entre estados (Bom Jesus existe em 6 UFs),
acentuação inconsistente e abreviações. O certo é o campo existir no cadastro.

Duas abordagens, a decidir:

| Abordagem | Prós | Contras |
|---|---|---|
| Campo `cityCodeIbge` em `Branch` e `CustomerAddress` | mínimo, direto | preenchimento manual, sujeito a erro de digitação |
| Tabela de municípios IBGE no ERP + seleção por UF→município | valida na origem, resolve destinatário junto, permite autocompletar | tabela nova (~5.570 linhas) e carga inicial |

A segunda é mais trabalho e evita a classe inteira de erro. Como o endereço já é digitado no
cadastro de cliente, transformar cidade em seleção em vez de texto livre melhora o cadastro
independentemente da emissão fiscal.

### 7.2 ⛔ Enum de regime tributário diverge

| ERP (`TaxRegime`) | `fiscal-api` |
|---|---|
| `SIMPLES_NACIONAL` | ✅ `SIMPLES_NACIONAL` |
| `LUCRO_PRESUMIDO` | ✅ `LUCRO_PRESUMIDO` |
| `LUCRO_REAL` | ✅ `LUCRO_REAL` |
| `MEI` | ❌ sem correspondente |
| `ISENTO` | ❌ sem correspondente |

O regime determina o `CRT` no XML e decide se o item leva `cst` ou `csosn` — não é rótulo.

**MEI não é "Simples Nacional com outro nome"** para fins de emissão; mapear um no outro produz XML
com CRT incorreto. `ISENTO` provavelmente não deveria emitir NF-e.

A decidir: ampliar o enum da `fiscal-api` para incluir MEI, e bloquear `ISENTO` na habilitação da
emissão com mensagem clara.

### 7.3 ⛔ Certificado A1 ICP-Brasil

Bloqueia a emissão real das duas frentes. Para NF-e é o **único** item faltante — todo o caminho
está construído e testado. Para NFS-e ele destrava primeiro a *possibilidade de implementar* o
provider: o Swagger do ambiente nacional exige certificado de cliente para ser lido
(`496 SSL certificate required`).

### 7.4 Filial pessoa física

`Branch.personType` aceita `PF`, mas emissão de NF-e exige e-CNPJ. Filial PF não emite neste
desenho — vale bloquear na habilitação em vez de deixar falhar no upload do certificado.

---

## 8. Idempotência e falhas

A chave é o trio **`sourceSystem` + `externalReference` + `idempotencyKey`**. Reenviar o mesmo trio
nunca gera uma segunda nota.

O comportamento depende do estado do documento existente:

| Estado | Reenvio faz |
|---|---|
| Terminal (`AUTHORIZED`, `REJECTED`, `DENIED`, `CANCEL_AUTHORIZED`, `INUTILIZED`, `CORRECTION_LETTER_AUTHORIZED`) | devolve o mesmo documento, sem contatar o órgão |
| Não terminal (`SIGNED`, `SENT`, `PROCESSING`, `SYNC_REQUIRED`) | **retoma a transmissão** com o mesmo número |

Isso importa para o ERP: ao receber `503` ou `SYNC_REQUIRED`, **reenvie a mesma requisição com a
mesma chave**. Não gere chave nova — geraria uma segunda nota com número novo para a mesma venda.

O número fiscal é consumido no momento da reserva, antes da transmissão. Uma falha de comunicação
deixa o número queimado — isso é correto e esperado, e é por isso que o documento fica registrado
mesmo sem desfecho.

### Erros

O corpo de erro é `{ "error": { "code", "message" } }`.

Para rejeições do **Sistema Nacional NFS-e**, `code` traz o código oficial (`E0001`–`E1309`) e
`message` junta o texto do Anexo I com uma orientação por categoria. A tabela completa de 441
códigos está em
[`national-error-codes.ts`](../../../services/fiscal-api/src/modules/nfse/domain/national-error-codes.ts),
com categorias que o ERP pode usar para rotear a mensagem na tela:

| Categoria | Significa |
|---|---|
| `CERTIFICATE` | problema no certificado |
| `REGISTRATION` | corrigir cadastro do emitente ou tomador |
| `REQUEST` | corrigir os dados do pedido |
| `MUNICIPAL` | parametrização do município — pode exigir contato com a prefeitura |
| `DEADLINE` | fora do prazo |
| `LIFECYCLE` | estado do documento incompatível com a operação |
| `PAYLOAD` | defeito da integração, **não** do preenchimento — não peça ao usuário para revisar dados |

---

## 9. Ordem sugerida de trabalho

Tudo abaixo anda **sem certificado**:

1. Decidir a abordagem do código IBGE (§7.1) e migrar o ERP
2. Decidir o destino de `MEI`/`ISENTO` (§7.2)
3. Adapter HTTP `erp-api → fiscal-api` reaproveitando o padrão `client_credentials` existente
4. Tela de "habilitar emissão fiscal" na filial, validando os campos fiscais e chamando
   `POST /companies`
5. Upload de certificado pela tela da filial
6. Montagem do payload de emissão a partir de venda + `ProductFiscal` + `Customer`

Com o certificado em mãos, o passo 7 é validar NF-e ponta a ponta em homologação — e só então o
provider da NFS-e passa a ser implementável.
