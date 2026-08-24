# Roteiro de teste real — Cupom fiscal (NFC-e) em homologação

**Escopo**: só cupom fiscal. NF-e e NFS-e já foram testadas e não são tocadas aqui.
**Ambiente**: **exclusivamente homologação.** Produção é recusada por construção — o
endpoint de produção não tem valor padrão e a API responde `424` antes de assinar ou numerar.

---

## ⚠️ Leia isto antes de começar

**Nenhum cupom fiscal foi transmitido à SEFAZ ainda.** Este roteiro é a primeira
execução real do modelo 65. Se algo falhar, é esperado — o valor está em descobrir
**o quê**, não em ver tudo verde.

O passo que mais importa é o **4**, e não é a emissão: é escanear o QR Code. A suíte
automatizada (540 testes) prova a lógica e valida o XML contra o XSD oficial, mas o
**hash do QR Code** ela não prova. O schema exige apenas 40 dígitos hexadecimais, e
qualquer SHA-1 os satisfaz — inclusive um calculado sobre o texto errado. O resultado
seria um cupom **autorizado e inconsultável**: nada falha na emissão, o PDF imprime
bonito, e o defeito só aparece quando um consumidor aponta o celular.

### O que NÃO existe para cupom fiscal

Você pediu "alterar" e "deletar". Nenhum dos dois existe, e não é limitação da API:

| Operação | NF-e | Cupom (NFC-e) |
| --- | --- | --- |
| Corrigir dados | Carta de correção | **Não existe** |
| Substituir | — | **Não existe** |
| Cancelar | 24 horas | **30 minutos** |
| "Deletar" | Não existe em documento fiscal | Idem |

Fora dos 30 minutos, o cupom é definitivo. O ajuste passa a ser **comercial**, fora do
documento fiscal. A API recusa com `409` e diz isso na mensagem — de propósito, para
não mandar o operador procurar um endpoint que não existe.

O mais próximo de "deletar" é **inutilizar uma faixa de numeração** (passo 8), que
declara à SEFAZ que aqueles números não foram usados. Não apaga nada; é o oposto —
cria um registro permanente.

---

## Passo 0 — Destravar o ambiente

Quatro bloqueios. Os três primeiros impedem a API de subir ou de emitir; o quarto só
aparece na transmissão.

### 0.1 Subir a infraestrutura e aplicar a migration 🔴

```bash
pnpm infra:up
pnpm --filter @citybox/fiscal-api exec prisma migrate deploy
```

⚠️ **Sem isto nada funciona.** A migration `20260808200000_nfce_cupom_fiscal` acrescenta
o valor `NFCE` ao enum `fiscal.DocumentType`. Ela **nunca foi aplicada** — o Docker
esteve fora durante toda a implementação. Antes dela, qualquer emissão de cupom falha no
`INSERT`, com erro de enum, não com mensagem de negócio.

Conferir que pegou:

```bash
docker exec citybox_postgres psql -U postgres -d citybox -t -A -c \
  "SELECT unnest(enum_range(NULL::fiscal.\"DocumentType\"));"
# precisa listar NFCE
```

### 0.2 CSC — Código de Segurança do Contribuinte 🔴

Obtido no **portal da SEFAZ-BA**, não gerado por nós. É o segredo compartilhado entre o
contribuinte e o fisco que autentica o QR Code — sem ele, `424 CSC_NOT_CONFIGURED`.

**Onde solicitar** (pesquisado em 2026-08-09; confirme, o portal muda):

1. Acesse <https://www.sefaz.ba.gov.br/especiais/como_se_tornar_emissor_nfce.html>
2. Procure a opção **"Solicitar/Inutilizar CSC – Código de Segurança do Contribuinte"**
3. Acesso com **certificado digital** do contribuinte (e-CNPJ)

O que o portal devolve são **dois valores**, e você precisa dos dois:

| Valor | O que é | Onde entra |
| --- | --- | --- |
| **Identificador** (`cIdToken`) | Número curto, tipicamente `000001` | `cscId` — **não é segredo**, vai em claro no QR Code impresso |
| **Token** (o CSC) | Cadeia alfanumérica longa | `cscToken` — **é o segredo**, armazenado cifrado |

⚠️ **Homologação e produção têm CSCs distintos.** Peça o de **homologação** — este
roteiro não emite em produção, e a instrução do projeto é explícita nisso.

⚠️ A SEFAZ permite **dois CSCs ativos** ao mesmo tempo, para rotação sem parar o caixa.
Por isso `PUT /csc` substitui o par (id, token) por inteiro: trocar um sem o outro
produziria hash conferido contra o código errado.

### 0.3 URLs de consulta 🔴

São **duas URLs diferentes** — o XSD define `qrCode` e `urlChave` como elementos
separados. Sem elas a emissão é recusada com `424`, deliberadamente: apontar para o
estado errado produziria cupom autorizado com QR Code que leva a lugar nenhum.

**Endereços de PRODUÇÃO** (confirmados em fontes públicas, 2026-08-09):

```
QR Code:  http://nfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx
Chave:    http://nfe.sefaz.ba.gov.br/servicos/nfce/Modulos/Geral/NFCEC_consulta_chave_acesso.aspx
```

**Homologação** segue o padrão `hnfe.` no lugar de `nfe.` — mas ⚠️ **isto é inferência,
não confirmação**: não consegui abrir a documentação oficial da SEFAZ-BA (o site falha
na validação da cadeia de certificado por ferramenta automatizada). Confirme os dois
endereços no manual de configuração do emissor antes de usar:

```bash
# services/fiscal-api/.env  — CONFIRMAR antes de usar
NFCE_QRCODE_URL_BA_HOMOLOGATION=http://hnfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx
NFCE_CHAVE_URL_BA_HOMOLOGATION=http://hnfe.sefaz.ba.gov.br/servicos/nfce/Modulos/Geral/NFCEC_consulta_chave_acesso.aspx
```

> `http` e não `https` é o que a SEFAZ publica, e o XSD aceita os dois
> (`(HTTPS?|https?)`). Não "corrija" para https sem verificar que o host responde.

Se o passo 4 (escanear o QR Code) der erro de página, **é aqui que está o problema** —
não no hash.

### 0.4 Credenciamento para modelo 65 🟢 (provavelmente não se aplica na BA)

⚠️ **Correção de 2026-08-09.** Versões anteriores deste roteiro afirmavam que o
credenciamento para modelo 65 é obrigatório e distinto do de NF-e. Fontes públicas
indicam que **a SEFAZ-BA não exige credenciamento prévio para NFC-e** — o CSC é
solicitado direto no portal. A afirmação anterior era generalização de outros estados.

Não consegui confirmar na fonte oficial (o site da SEFAZ-BA falha na validação de
certificado por ferramenta automatizada), então trate como provável, não certo: **se**
a rejeição citar credenciamento ou "emitente não autorizado", não é defeito da API — é
cadastro junto ao órgão.

### Subir a API

Duas formas, e as duas ficaram no ar em 2026-08-09:

```bash
# Docker — porta canônica, é a que os exemplos abaixo usam
cd infra/fiscal-api && CACHEBUST=$(date +%s) docker compose build && docker compose up -d
# → http://localhost:3116/api/v1/docs

# Build local — útil para iterar sem reconstruir imagem
PORT=3117 AUTH_DEV_BYPASS=true node dist/src/main.js
# → http://localhost:3117/api/v1/docs
```

⚠️ **Só uma delas pode usar a 3116.** Se o container estiver de pé e você subir o
build local na mesma porta, o processo antigo continua respondendo e você testa
código velho sem perceber — já aconteceu nesta base.

⚠️ **Para o Swagger aceitar `dev-admin`**, o container precisa de
`FISCAL_NODE_ENV=development` e `AUTH_DEV_BYPASS=true` em `infra/fiscal-api/.env`.
O padrão é `production` com o bypass vazio, que **desliga o token duas vezes** —
deliberado, porque `dev-admin` entra como `platform_admin`.

```bash
export API=http://localhost:3116/api
export TOKEN=dev-admin                    # exige AUTH_DEV_BYPASS=true
export CO=<uuid do Emitente com certificado A1 válido>
```

> `dev-admin` recebe o papel `platform_admin`, que passa pela verificação de Emitente.
> Com um token Keycloak real, o usuário precisa de participação na loja
> (`platform.store_members`) — senão a resposta é `404`, não `403`.

---

## Passo 1 — Cadastrar o CSC

```bash
curl -s -X PUT "$API/v1/companies/$CO/csc" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{ "cscId": "000001", "cscToken": "<o CSC da SEFAZ>" }' | python -m json.tool
```

**Passou quando**: `200` e a resposta traz `"cscConfigured": true`.

**Confira que o token NÃO volta na resposta.** Ele é armazenado cifrado e não há
endpoint de leitura — se aparecer, é defeito grave e pare aqui.

O `cscId` pode ser informado com zeros à esquerda (é como o portal mostra); a
normalização para o QR Code é feita internamente.

---

## Passo 2 — Emitir o cupom

O caso comum de balcão: **sem identificação do consumidor**.

```bash
curl -s -X POST "$API/v1/nfce" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Company-Id: $CO" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceSystem": "pdv",
    "externalReference": "cupom-real-001",
    "idempotencyKey": "cupom-real-001",
    "environment": "HOMOLOGATION",
    "items": [
      { "description": "CIMENTO CP II 50KG", "ncm": "25232910", "cfop": "5102",
        "quantity": 2, "unitValue": 42.5, "totalValue": 85, "csosn": "102" }
    ],
    "payments": [ { "method": "01", "amount": 100 } ]
  }' | python -m json.tool
```

Guarde o id:

```bash
export ID=<id devolvido>
```

**Passou quando**:

- `201`, `status: "AUTHORIZED"`, `protocol` preenchido
- `accessKey` com 44 dígitos
- **posições 21-22 = `65`** (modelo) e **posição 35 = `1`** (emissão normal)

```bash
echo -n "<accessKey>" | cut -c21-22   # 65
echo -n "<accessKey>" | cut -c35      # 1
```

Note que `payments` é **lista** e o pagamento foi de R$ 100 para uma venda de R$ 85 — o
troco de R$ 15 é calculado, não informado.

---

## Passo 3 — Consultar

```bash
curl -s -H "Authorization: Bearer $TOKEN" -H "X-Company-Id: $CO" \
  "$API/v1/nfce/$ID" | python -m json.tool
```

**Passou quando**: `status: "AUTHORIZED"` e o mesmo protocolo do passo 2.

---

## Passo 4 — ⚠️⚠️ O teste que decide tudo: escanear o QR Code

```bash
curl -s -H "Authorization: Bearer $TOKEN" -H "X-Company-Id: $CO" \
  "$API/v1/nfce/$ID/xml" | grep -o "<qrCode>[^<]*</qrCode>"
```

**Passou quando**: o `qrCode` existe, dentro de `<infNFeSupl>`, e o conteúdo tem a forma
`<url>?p=<chave>|2|2|<idCsc>|<hash de 40 hex>`.

Agora **a parte que nenhum teste automatizado substitui**:

1. Copie a URL de dentro de `<qrCode>`.
2. Abra no navegador **do celular** (ou escaneie o QR Code do PDF do passo 5).
3. A consulta pública da SEFAZ-BA precisa exibir **este** cupom.

| Resultado | Significado |
| --- | --- |
| Exibe o cupom | ✅ O algoritmo do QR Code está certo. **Este é o marco da feature.** |
| "Não encontrado" / assinatura inválida | ❌ O hash está errado. Verifique o CSC cadastrado e me avise — o defeito é nosso |
| Erro de página / URL inválida | ❌ `NFCE_QRCODE_URL_BA_HOMOLOGATION` aponta para o lugar errado |

Confira também que `<urlChave>` está presente e é **diferente** da URL do QR Code.

---

## Passo 5 — Documento impresso, nos dois formatos

```bash
curl -s -o cupom-bobina.pdf -H "Authorization: Bearer $TOKEN" \
  -H "X-Company-Id: $CO" "$API/v1/nfce/$ID/danfce"

curl -s -o cupom-a4.pdf -H "Authorization: Bearer $TOKEN" \
  -H "X-Company-Id: $CO" "$API/v1/nfce/$ID/danfce?formato=a4"
```

**Passou quando**:

- A bobina sai **estreita** (~73 mm) e o A4 em folha inteira
- Os dois trazem QR Code, chave, itens, total, forma de pagamento e **troco de 15,00**
- Os dois têm marca d'água de homologação e a marca Citybox
- **Os dois dizem os mesmos dados fiscais** — leiaute diferente é esperado; dado
  diferente é defeito

> A descrição do item sai como "NOTA FISCAL EMITIDA EM AMB..." nas duas vias. **Está
> correto**: é a regra da SEFAZ para homologação, não um bug.

Imprima a bobina numa térmica de verdade se tiver uma — é o único jeito de saber se o
conteúdo cabe sem corte lateral.

---

## Passo 6 — Idempotência

Repita **exatamente** a requisição do passo 2, com a mesma `idempotencyKey`.

**Passou quando**: devolve o **mesmo** `id` e o **mesmo** `accessKey`, sem emitir um
segundo cupom. Conferir que a numeração não avançou:

```bash
docker exec citybox_postgres psql -U postgres -d citybox -t -A -c \
  "SELECT document_type, current_number FROM fiscal.fiscal_sequences
   WHERE company_id='$CO' ORDER BY document_type;"
```

---

## Passo 7 — Cancelar ⏱️ (dentro de 30 minutos!)

**Emita um cupom novo para este passo** — o do passo 2 você vai querer manter para
conferência.

```bash
export ID2=<id do cupom novo>

curl -s -X POST "$API/v1/nfce/$ID2/cancel" \
  -H "Authorization: Bearer $TOKEN" -H "X-Company-Id: $CO" \
  -H "Content-Type: application/json" \
  -d '{"justification":"Cancelamento por erro de digitacao no caixa"}' | python -m json.tool
```

**Passou quando**: `200` e `status: "CANCEL_AUTHORIZED"`.

A justificativa exige **15 a 255 caracteres** — é regra do schema oficial, não nossa.

### 7.1 — Confirmar a recusa fora do prazo

Este é o teste que exige paciência: pegue um cupom emitido há **mais de 30 minutos** (o
do passo 2 serve, se já passou tempo) e tente cancelar.

**Passou quando**: `409`, com mensagem que:

- diz o prazo **em hora local**, não em ISO/UTC
- diz o próximo passo
- **não oferece substituição** — deve dizer que o cupom não admite

---

## Passo 8 — Inutilizar faixa de numeração

O mais próximo de "deletar" que existe. Declara à SEFAZ que uma faixa de números não foi
usada.

⚠️ **Irreversível.** Escolha uma faixa **à frente** do número atual, que você não
pretende usar. Inutilizar número já emitido é recusado; inutilizar número que você ainda
vai precisar queima a faixa em definitivo.

```bash
curl -s -X POST "$API/v1/nfce/inutilize" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "companyId": "'"$CO"'",
    "series": "1",
    "numberStart": 900,
    "numberEnd": 900,
    "justification": "Teste de inutilizacao de faixa em homologacao"
  }' | python -m json.tool
```

**Passou quando**: `200` com `status: "INUTILIZED"` e protocolo.

⚠️ **Confira que atingiu a numeração de NFC-e, não a de NF-e.** Esta é a rota de cupom, e
ela fixa o modelo 65 internamente — o corpo não escolhe. Se a numeração de NF-e for
afetada, é defeito grave: avise imediatamente.

---

## Passo 9 — Numeração isolada da NF-e

```bash
docker exec citybox_postgres psql -U postgres -d citybox -c \
  "SELECT document_type, series, current_number FROM fiscal.fiscal_sequences
   WHERE company_id='$CO' ORDER BY document_type;"
```

**Passou quando**: `NFCE` e `NFE` aparecem em **linhas separadas**, com contadores
independentes. Emitir cupom não pode ter avançado a numeração de NF-e.

---

## Passo 10 — Recusas (nenhuma pode queimar numeração)

Antes de cada tentativa, anote `current_number` de `NFCE`. Depois de cada recusa,
**confira que não mudou**.

| Teste | Como | Esperado |
| --- | --- | --- |
| Valor alto sem consumidor | `totalValue: 999999` sem `consumer` | `422`, dizendo o limite |
| Pagamento não fecha | `payments` somando menos que o total | `422` |
| Troco sem dinheiro | pagar a mais só com `method: "03"` | `422` |
| Venda sem itens | `items: []` | `422` |
| CSC removido | limpe o CSC e emita | `424` |
| Produção | `"environment": "PRODUCTION"` | `424`, **sem transmitir nada** |

> ✅ **Passos 0 e 10 já foram executados** contra a API real com o Emitente RR
> (`3acd9468…`), em 2026-08-09: migration aplicada, os sete códigos conferidos e a
> sequência de `NFCE` **sequer chegou a ser criada**. Os passos 1–9 e 11 dependem do CSC.

**O que realmente importa aqui não é o código de status** — é que o contador de
`fiscal_sequences` **não avançou** em nenhum dos casos. Número reservado e não usado
exige inutilização junto à SEFAZ; esta base já deixou sete documentos órfãos por
verificar tarde uma vez.

---

## Passo 11 — Contingência (opcional, e o mais arriscado)

🟡 **Este caminho nunca foi exercitado contra a SEFAZ.** Faça-o por último, e só depois
que os passos 2–5 tiverem passado.

Simule o órgão inalcançável apontando o endpoint para um host morto:

```bash
SEFAZ_BA_NFE_HOMOLOGATION_ENDPOINT=https://127.0.0.1:9 \
  pnpm --filter @citybox/fiscal-api dev
```

Emita um cupom (passo 2, com `idempotencyKey` nova).

**Passou quando**:

- `201` — **a venda fecha**, que é o ponto de existir contingência
- `status: "SIGNED"` e `protocol: null` (não `AUTHORIZED` — o fisco ainda não recebeu)
- `accessKey` com **`9` na posição 35** (é outro documento, com outra chave)
- O PDF sai com uma **faixa preta no topo**: `EMITIDA EM CONTINGENCIA - PENDENTE DE
  AUTORIZACAO`
- A fila registrou o cupom:

```bash
docker exec citybox_postgres psql -U postgres -d citybox -c \
  "SELECT sequence, status, attempts FROM fiscal.nfce_contingency_queue
   WHERE company_id='$CO' ORDER BY sequence;"
```

### 11.1 — Drenar

Restaure o endpoint e reinicie com o dreno ligado:

```bash
NFCE_CONTINGENCY_DRAIN=on pnpm --filter @citybox/fiscal-api dev
```

⚠️ **Só com uma instância da API rodando.** O agendador usa `setInterval`, que roda em
todo processo, e a fila ainda não tem reivindicação atômica — duas réplicas podem
transmitir o mesmo cupom, e duplicidade na SEFAZ é rejeição sobre papel já entregue.

**Passou quando**: em até 2 minutos as entradas viram `TRANSMITTED` **na ordem de
`sequence`**, e os documentos passam a `AUTHORIZED` com protocolo.

---

## Se algo falhar

Separe as três categorias antes de reportar:

| Sintoma | Provável causa | É defeito nosso? |
| --- | --- | --- |
| Erro de enum no `INSERT` | Migration não aplicada (passo 0.1) | Não |
| `424 CSC_NOT_CONFIGURED` | CSC não cadastrado | Não |
| `424` de URL de consulta | `.env` incompleto | Não |
| Rejeição de credenciamento | Cadastro junto à SEFAZ | Não |
| QR Code não consulta | Hash ou URL errados | **Sim, avise** |
| Bobina e A4 com dados diferentes | Divergência entre vias | **Sim, avise** |
| Recusa que avançou a numeração | Ordem de validação | **Sim, avise — grave** |
| Inutilização atingiu NF-e | Modelo errado no XML | **Sim, avise — grave** |

Para qualquer coisa da coluna "sim", guarde o XML (`/xml`) e a resposta completa — é o
que permite reconstituir o que foi enviado.

---

## Referências

- Integração ERP/PDV: [`integracao-erp-fiscal-api.md`](./integracao-erp-fiscal-api.md) §6.2
- Roteiro geral (NF-e/NFS-e): [`roteiro-teste-swagger.md`](./roteiro-teste-swagger.md)
- Detalhes técnicos: `services/fiscal-api/AGENTS.md` §5
