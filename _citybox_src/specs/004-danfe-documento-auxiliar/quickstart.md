# Quickstart — validar o DANFE / DANFSE

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) ·
**Contrato**: [contracts/auxiliary-documents.openapi.yaml](./contracts/auxiliary-documents.openapi.yaml)

Guia de validação. Cada cenário mapeia para um critério de sucesso da spec, e diz **como
saber que passou** — não só o comando.

---

## Pré-requisitos

1. Infra local de pé (Postgres + MinIO):
   ```bash
   pnpm infra:up
   ```
2. `fiscal-api` rodando em `:3116`:
   ```bash
   pnpm --filter @citybox/fiscal-api dev
   ```
3. **Pelo menos uma NF-e autorizada** com XML armazenado. Se não houver, emita seguindo
   [`roteiro-teste-real.md`](../../packages/docs/fiscal/roteiro-teste-real.md) — os
   payloads reais de RR e APLOPES estão lá.

Guarde o `fiscalDocumentId` e o `companyId` da nota autorizada:

```bash
export DOC_ID=<id da NF-e autorizada>
export COMPANY_ID=<companyId da mesma nota>
export API=http://localhost:3116
```

> ⚠️ Toda validação é em **homologação**. Nenhum passo deste guia emite nota nova — os dois
> endpoints são somente leitura.

---

## Cenário 1 — DANFE de uma nota autorizada (US1, SC-001, SC-002)

```bash
curl -s -D- -o danfe.pdf \
  -H "X-Company-Id: $COMPANY_ID" \
  "$API/api/v1/nfe/$DOC_ID/danfe"
```

**Passou quando**:

- HTTP `200`, `Content-Type: application/pdf`
- `danfe.pdf` abre em qualquer leitor
- A **chave de acesso** impressa confere com a da nota (`GET /v1/nfe/$DOC_ID`) — SC-002
- O **protocolo de autorização** aparece no documento
- A requisição volta em menos de 5 s — SC-001

Conferência da chave sem abrir o PDF:

```bash
curl -s -H "X-Company-Id: $COMPANY_ID" "$API/api/v1/nfe/$DOC_ID" \
  | python -c "import sys,json; d=json.load(sys.stdin); print(d['data']['accessKey'])"
```

---

## Cenário 2 — Marca d'água de homologação (FR-005, SC-003)

Mesmo arquivo do Cenário 1.

**Passou quando** — e este é o único critério que **não se automatiza**:

> Mostre `danfe.pdf` a alguém que nunca viu o sistema e pergunte se aquele papel vale.
> A resposta tem que ser "não" **sem explicação prévia**.

É literalmente o que SC-003 pede: distinguível à primeira vista, por pessoa não treinada.

Verificações que se automatizam:

- A marca aparece em **todas** as páginas, não só na primeira
- Os dados da nota seguem legíveis por cima dela — FR-005a
- Imprima em **preto e branco**: a marca continua visível e os dados continuam legíveis

Cabeçalho correspondente, para o consumidor não depender de leitura visual:

```bash
curl -sI -H "X-Company-Id: $COMPANY_ID" "$API/api/v1/nfe/$DOC_ID/danfe" | grep -i fiscal-validity
# X-Fiscal-Validity: NONE
```

---

## Cenário 3 — Nota não autorizada é recusada (FR-003, SC-005)

Use uma nota em qualquer estado que não seja autorizada — `REJECTED` serve, e o
`roteiro-teste-real.md` produz várias.

```bash
curl -s -H "X-Company-Id: $COMPANY_ID" "$API/api/v1/nfe/<id-rejeitada>/danfe" | python -m json.tool
```

**Passou quando**:

- HTTP `422` — **não** `200` com PDF vazio
- O corpo nomeia o **estado atual** (`details.currentStatus`)
- A mensagem diz o que fazer, não só o que houve

---

## Cenário 4 — Nota de outro emitente é recusada (FR-007)

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "X-Company-Id: 00000000-0000-7000-8000-000000000000" \
  "$API/api/v1/nfe/$DOC_ID/danfe"
```

**Passou quando**: `404`.

Não `403`: um 403 confirmaria que a nota existe, e para documento fiscal de outro
contribuinte a existência já é informação.

> Vale saber: hoje `GET /api/v1/nfe/{id}/xml` **não** faz essa verificação — é decisão
> registrada do v1 ([research.md § R7](./research.md)). Se o `xml` responder `200` com o
> mesmo header falso enquanto o `danfe` responder `404`, está **correto** para este
> escopo, não é bug desta feature.

---

## Cenário 5 — Reimpressão é idêntica (US3, FR-008, SC-004)

```bash
curl -s -H "X-Company-Id: $COMPANY_ID" "$API/api/v1/nfe/$DOC_ID/danfe" -o r1.pdf
curl -s -H "X-Company-Id: $COMPANY_ID" "$API/api/v1/nfe/$DOC_ID/danfe" -o r2.pdf
```

**Não compare os arquivos com `diff`** — PDF carrega data de criação, então dois arquivos
do mesmo conteúdo **nunca** batem byte a byte, e isso não indica defeito. SC-004 fala em
conteúdo **textual**:

```bash
for f in r1.pdf r2.pdf; do pdftotext "$f" - | tr -s ' \n' ' ' > "$f.txt"; done
diff r1.pdf.txt r2.pdf.txt && echo "IDENTICO ✅"
```

**Teste mais forte** — o que FR-008 realmente exige:

1. Altere o cadastro do emitente (`PATCH /v1/companies/$COMPANY_ID`, ex.: nome fantasia)
2. Gere o DANFE de novo
3. O documento deve mostrar os dados **vigentes na emissão**, não os novos

Se o dado novo aparecer, o renderizador está lendo o banco em vez do XML autorizado — que é
exatamente o que a arquitetura foi desenhada para impedir.

---

## Cenário 6 — Nota cancelada sai marcada (FR-006)

Use uma nota `CANCEL_AUTHORIZED` (o `roteiro-teste-real.md` cancela uma NF-e).

**Passou quando**: HTTP `200` **com** documento — e o documento indica o cancelamento.

Recusar aqui seria erro: o histórico precisa ser reconstituível.

---

## Cenário 7 — XML indisponível falha alto (FR-010)

Simulável derrubando o MinIO:

```bash
docker stop citybox-minio
curl -s -H "X-Company-Id: $COMPANY_ID" "$API/api/v1/nfe/$DOC_ID/danfe" | python -m json.tool
docker start citybox-minio
```

**Passou quando**: HTTP `503`, código `AUTHORIZED_XML_UNAVAILABLE`.

**Falhou se voltar `200`.** Um PDF montado a partir do banco quando o XML autorizado sumiu
diverge do que o fisco tem — e ninguém perceberia. Falhar alto é o comportamento correto.

---

## Cenário 8 — DANFSE (Fase 2, US2)

Só após a Fase 1 estar entregue.

```bash
curl -s -D- -o danfse.pdf \
  -H "X-Company-Id: $COMPANY_ID" \
  "$API/api/v1/nfse/<id-nfse-autorizada>/danfse"
```

**Passou quando**:

- HTTP `200`, PDF legível com prestador, tomador, serviço, valores e ISS
- Leiaute do **Padrão Nacional** — visivelmente distinto do DANFE, não o mesmo formulário
- `X-Document-Origin: LOCAL` enquanto a API oficial responder `501`
- Marca d'água presente, **inclusive** se a origem for `OFFICIAL_API`

Conferir que a API oficial segue indisponível (o que justifica o fallback):

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://sefin.producaorestrita.nfse.gov.br/SefinNacional/danfse/<chave>"
# 501 esperado
```

Se um dia responder `200`, o fallback continua correto — muda só a origem registrada.

---

## Cenário 9 — Marca Citybox (FR-011 a FR-014)

Gere as amostras e abra os PDFs:

```bash
pnpm --filter @citybox/fiscal-api amostras
# services/fiscal-api/amostras/
```

**Passou quando**:

- A logo e a legenda do Citybox aparecem **nos dois** documentos
- Aparecem **também** na amostra de produção (`*-1-producao-sem-marca.pdf`) — o crédito não
  depende do ambiente, diferente da marca d'água
- Nenhum campo dos leiautes foi deslocado ou encoberto — compare com uma amostra anterior
- A marca segue legível em impressão preto-e-branco

**O critério que mais importa (SC-006)** — e que só uma pessoa julga:

> Mostre o DANFE a alguém e pergunte **quem emitiu esta nota**.
> A resposta tem que ser a empresa emitente. Se alguém responder "Citybox", a marca está
> no lugar errado.

O quadro "IDENTIFICAÇÃO DO EMITENTE" pertence ao contribuinte. A marca do Citybox é
crédito de rodapé — ver [research.md § R10](./research.md) para por que essa distinção não
é estética.

---

## Suíte automatizada

```bash
pnpm --filter @citybox/fiscal-api test              # unitários
pnpm --filter @citybox/fiscal-api test:integration  # Postgres real
```

Portão completo antes de qualquer commit:

```bash
pnpm --filter @citybox/fiscal-api build \
  && pnpm --filter @citybox/fiscal-api lint \
  && pnpm --filter @citybox/fiscal-api typecheck \
  && pnpm --filter @citybox/fiscal-api test
```

**Uma lição já paga nesta base**: uma asserção que só confere HTTP `200` deixou uma
substituição de NFS-e passar por 14/14 enquanto estava quebrada. Aqui, `200` com PDF
corrompido é o mesmo risco — os testes precisam abrir o PDF e conferir o **conteúdo**, não
o código de status.
