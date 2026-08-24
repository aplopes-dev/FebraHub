# Quickstart — validar a emissão de cupom fiscal (NFC-e)

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) ·
**Contrato**: [contracts/nfce.openapi.yaml](./contracts/nfce.openapi.yaml)

Cada cenário mapeia para um critério da spec e diz **como saber que passou**.

---

## Pré-requisitos

```bash
pnpm infra:up
pnpm --filter @citybox/fiscal-api dev     # :3116
```

```bash
export API=http://localhost:3116
export TOKEN="dev-admin"                  # exige AUTH_DEV_BYPASS=true
export COMPANY_ID=<Emitente com certificado A1 valido>
```

> ⚠️ **Tudo em homologação.** Produção segue recusada por construção — o endpoint de
> produção não tem valor padrão, e a API responde `424` antes de assinar ou numerar.

### Dois bloqueios que não são código

Antes de qualquer teste real, o Emitente precisa de:

1. **CSC** obtido junto à SEFAZ-BA. Sem ele não há QR Code válido, e a emissão é recusada.
2. **Credenciamento para modelo 65** — **distinto** do credenciamento de NF-e. Uma empresa
   pode emitir NF-e e ser recusada em NFC-e; foi o que aconteceu com a APLOPES na feature
   anterior.

Se o cupom for recusado com erro de credenciamento, **não é defeito da API** — é cadastro
junto ao órgão.

---

## Cenário 1 — Emitir um cupom (US1, SC-001, SC-002)

```bash
curl -s -X POST "$API/api/v1/nfce" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Company-Id: $COMPANY_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceSystem": "pdv",
    "externalReference": "venda-001",
    "idempotencyKey": "venda-001",
    "environment": "HOMOLOGATION",
    "items": [{ "description": "CIMENTO CP II 50KG", "ncm": "25232910",
                "cfop": "5102", "quantity": 2, "unitValue": 42.5,
                "totalValue": 85, "csosn": "102" }],
    "payments": [{ "method": "DINHEIRO", "amount": 100, "changeAmount": 15 }]
  }' | python -m json.tool
```

**Passou quando**:

- HTTP `201`, com `accessKey` de 44 dígitos e `protocol`
- `emissionType: "NORMAL"` — se vier `CONTINGENCY`, a SEFAZ estava fora; ver Cenário 5
- `qrCode` preenchido — **texto**, não imagem
- A resposta volta em menos de 5 s (SC-001)

⚠️ **Sem `consumer` de propósito.** Venda a consumidor não identificado é o caso comum no
balcão, e precisa ser autorizada normalmente.

---

## Cenário 2 — O QR Code está no XML, não só no PDF (FR-001) ⚠️

**O cenário mais importante deste guia.**

```bash
curl -s -H "Authorization: Bearer $TOKEN" -H "X-Company-Id: $COMPANY_ID" \
  "$API/api/v1/nfce/$ID/xml" | grep -o "<qrCode>[^<]*" | head -c 200
```

**Passou quando**: o `qrCode` aparece no XML **autorizado**, dentro de `infNFeSupl`.

**Por que isso merece cenário próprio**: o conteúdo do QR Code é calculado a partir da
chave de acesso e do CSC, e precisa estar no XML **transmitido**. Se ele ficar só no PDF, o
cupom é **autorizado sem QR Code** — e a falha não aparece na resposta, só quando o
consumidor tenta consultar e não encontra nada. Um teste que olhe apenas o PDF não detecta
isso.

`infNFeSupl` fica **fora** da assinatura (que cobre `infNFe`), então o grupo é inserido
**depois** de assinar, sem invalidar nada. Na contingência isso é obrigatório e não
opcional: o conteúdo inclui o `digVal`, que só existe depois da assinatura.

Conferência final, com celular:

```bash
curl -s ... | python -c "import sys,json; print(json.load(sys.stdin)['qrCode'])"
```

Abra a URL. Ela deve levar à consulta pública da SEFAZ-BA e exibir **este** cupom (SC-003).

---

## Cenário 3 — Recusas acontecem ANTES de queimar numeração (FR-004, FR-006) ⚠️

```bash
# valor acima do limite, sem consumidor identificado
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API/api/v1/nfce" \
  -H "Authorization: Bearer $TOKEN" -H "X-Company-Id: $COMPANY_ID" \
  -H "Content-Type: application/json" \
  -d '{ ... "items": [{ "totalValue": 999999, ... }] ... }'
```

**Passou quando**: `422`, com mensagem dizendo que o caso exige NF-e.

**E — o que de fato importa** — a numeração **não avançou**:

```bash
# antes e depois da tentativa recusada, o proximo numero deve ser o mesmo
docker exec citybox_postgres psql -U "$PGUSER" -d citybox -t -A -c \
  "SELECT current_number FROM fiscal.fiscal_sequences
   WHERE company_id='$COMPANY_ID' AND document_type='NFCE';"
```

Número reservado e não usado precisa de **inutilização junto à SEFAZ** — procedimento
administrativo, não `DELETE`. Esta base já deixou sete documentos órfãos por verificar o
ambiente depois da reserva, uma vez.

Repita com o **CSC removido** do Emitente: também `424`, também sem avançar numeração.

---

## Cenário 4 — Documento auxiliar nos dois formatos (US2, FR-007, SC-007)

```bash
curl -s -o cupom-bobina.pdf -H "Authorization: Bearer $TOKEN" \
  -H "X-Company-Id: $COMPANY_ID" "$API/api/v1/nfce/$ID/danfce"

curl -s -o cupom-a4.pdf -H "Authorization: Bearer $TOKEN" \
  -H "X-Company-Id: $COMPANY_ID" "$API/api/v1/nfce/$ID/danfce?formato=a4"
```

**Passou quando**:

- A bobina sai **estreita e alta**, não em A4 — é o formato da impressora térmica
- Os dois trazem QR Code, chave de acesso, itens, totais e **formas de pagamento**
- O pagamento em dinheiro mostra valor recebido e **troco** (FR-005)
- Os dois têm marca d’água de homologação e a marca Citybox
- **Os dois mostram os mesmos dados** (SC-007)

Comparação de conteúdo entre as vias:

```bash
for f in cupom-bobina.pdf cupom-a4.pdf; do pdftotext "$f" - | tr -s ' \n' ' ' > "$f.txt"; done
diff <(grep -o '[0-9]\{44\}' cupom-bobina.pdf.txt) <(grep -o '[0-9]\{44\}' cupom-a4.pdf.txt) \
  && echo "mesma chave nas duas vias ✅"
```

Duas vias do mesmo cupom com dados diferentes é **defeito**, não variação de formato.

---

## Cenário 5 — Contingência (US3, FR-010 a FR-012, SC-004)

Simule a SEFAZ indisponível apontando o endpoint de homologação para um host morto:

```bash
SEFAZ_BA_NFE_HOMOLOGATION_ENDPOINT=https://127.0.0.1:9 pnpm --filter @citybox/fiscal-api dev
```

Emita um cupom (Cenário 1). **Passou quando**:

- HTTP `201` — **a venda se conclui**, e é isso que SC-004 exige
- `emissionType: "CONTINGENCY"`
- O documento auxiliar identifica a condição (FR-011)

Restaure o endpoint e reinicie. **Passou quando**:

- Os cupons pendentes são transmitidos **na ordem de emissão**
- Nenhum fica esquecido (SC-005)

**Teste mais duro — o que FR-012 realmente exige**: force a rejeição de um cupom em
contingência na transmissão posterior (por exemplo, com CSC alterado entre a emissão e o
envio). O sistema deve **sinalizar explicitamente**. Falhar em silêncio aqui é o pior caso
da feature: o consumidor já levou o papel.

**Fora do alcance**: se o *solicitante* não alcança a API, não há emissão (FR-010a). Isso
não é contingência — é ausência de sistema, e o cenário só se resolve com agente local no
caixa, deliberadamente fora de escopo.

---

## Cenário 6 — Cancelamento (US4, FR-008)

```bash
curl -s -X POST "$API/api/v1/nfce/$ID/cancel" \
  -H "Authorization: Bearer $TOKEN" -H "X-Company-Id: $COMPANY_ID" \
  -H "Content-Type: application/json" \
  -d '{"justification":"Cancelamento por erro de digitacao no caixa"}' | python -m json.tool
```

**Passou quando**: `200` e o cancelamento é autorizado pela SEFAZ.

Com um cupom fora do prazo: `422`, informando o prazo. **Não** ofereça substituição — a
NFC-e não tem esse caminho; é cancelar e reemitir.

---

## Cenário 7 — Numeração isolada da NF-e (FR-002)

```bash
docker exec citybox_postgres psql -U "$PGUSER" -d citybox -c \
  "SELECT document_type, series, current_number FROM fiscal.fiscal_sequences
   WHERE company_id='$COMPANY_ID' ORDER BY document_type;"
```

**Passou quando**: `NFCE` e `NFE` aparecem em **linhas separadas**, com contadores
independentes. Emitir cupom não pode avançar a numeração de NF-e — isso produziria conflito
de numeração na SEFAZ.

---

## Suíte automatizada

```bash
pnpm --filter @citybox/fiscal-api test
pnpm --filter @citybox/fiscal-api test:integration
```

Portão completo antes de qualquer commit:

```bash
pnpm --filter @citybox/fiscal-api build \
  && pnpm --filter @citybox/fiscal-api lint \
  && pnpm --filter @citybox/fiscal-api typecheck \
  && pnpm --filter @citybox/fiscal-api test
```

⚠️ **Esta feature tem migration** — rode o `database-reviewer` antes do commit
(Constituição, Princípio V). A feature anterior não precisou; esta precisa.

**Duas lições já pagas nesta base**, que valem para os testes desta feature:

1. **Asserção de status não é asserção de comportamento.** Uma substituição de NFS-e passou
   por 14/14 verificações estando quebrada, porque as asserções paravam no HTTP 201. Aqui,
   um `201` com QR Code ausente é o mesmo risco.
2. **Fake que repete o defeito do real não testa nada.** Ao usar dublês da SEFAZ, confirme
   que eles recusam PRODUCTION e falham como o serviço real falha.
