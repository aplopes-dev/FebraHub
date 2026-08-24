# Data Model — NFC-e (cupom fiscal)

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

⚠️ **Esta feature TEM migration** — diferente da 004. O portão `database-reviewer` é
obrigatório (Constituição, Princípio V).

---

## Mudanças de schema

### 1. `NFCE` no tipo de documento

```
enum DocumentType { NFE, NFSE, NFCE }
```

**Um valor de enum resolve FR-002 inteiro.** A `fiscal_sequences` já é única por
`(companyId, documentType, series, environment)` — a NFC-e ganha numeração isolada da NF-e
sem tabela nova, sem coluna nova.

⚠️ **`DocumentType` tem três espelhos manuais** nesta base: o enum Postgres, o
`DOCUMENT_TYPES` do domínio e o `FILE_PREFIX` da feature 004. Divergência **não quebra
compilação** — quebra no INSERT, em runtime. Os três mudam juntos.

### 2. CSC no Emitente

| Coluna | Tipo | Notas |
| --- | --- | --- |
| `csc_id` | `String?` | Identificador do CSC. **Não é segredo** |
| `csc_token_encrypted` | `String?` | O segredo, cifrado com o mesmo caminho da senha do certificado |

Nulos porque o Emitente existe antes de obter o CSC — que é passo administrativo junto à
SEFAZ. A ausência **bloqueia a emissão de cupom** (FR-006) sem impedir NF-e ou NFS-e.

### 3. Fila de contingência

| Coluna | Notas |
| --- | --- |
| `fiscal_document_id` | O cupom emitido offline |
| `sequence` | **Ordem de emissão** — a transmissão respeita, senão a numeração chega quebrada |
| `emitted_at` | Base do prazo legal de transmissão |
| `attempts`, `last_error` | Diagnóstico |
| `status` | `PENDING` / `TRANSMITTED` / `REJECTED` |

**Persistente, não em memória** (R4). Um cupom já entregue ao consumidor e perdido num
restart é a pior falha desta feature.

---

## Entidades

### `NfcePayment` (nova)

Formas de pagamento da venda. **Obrigatória** — sem ela o cupom não é válido.

| Campo | Notas |
| --- | --- |
| `method` | Dinheiro, cartão, PIX… |
| `amount` | Valor pago nesta forma |
| `changeAmount` | Troco. Só faz sentido em dinheiro (FR-005) |

Uma venda admite **várias** formas — pagamento parcial em cartão e resto em dinheiro é
rotina no varejo. Modelar como valor único quebraria o caso comum.

### `NfceQrCode` (valor, em memória)

Conteúdo do QR Code: texto padronizado com a URL de consulta, parâmetros e o hash
calculado com o **CSC**.

⚠️ **É conteúdo do XML, não imagem.** Vive em `infNFeSupl` e precisa existir no XML
transmitido. A imagem impressa deriva dele — nunca o contrário.

### `FiscalDocument` (existente — estendida)

Sem campo novo além do que o tipo `NFCE` já habilita. Reusa `accessKey`, `protocol`,
`series`, `number`, `status`, `environment`, `xmlObjectKey`.

O **tipo de emissão** (normal ou contingência) é conteúdo do XML e reflete-se na fila; não
precisa de coluna dedicada no documento.

### `Company` (existente — estendida)

Ganha `cscId` e `cscTokenEncrypted`. Nada mais.

---

## Regras de decisão

### Ordem de montagem do XML ⚠️

Não é preferência de código — é obrigação estrutural (R2):

```
1. montar infNFe        → define a chave de acesso
2. calcular o QR Code   → depende da chave + CSC
3. inserir infNFeSupl
4. assinar infNFe
5. transmitir
```

Inverter 2 e 4 produz cupom **autorizado que o consumidor não consegue consultar** — pior
que uma rejeição, porque passa despercebido.

### Ordem das recusas ⚠️

Toda recusa acontece **antes de reservar numeração**:

| Verificação | Motivo |
| --- | --- |
| Ambiente é produção e não está habilitado | Já implementado para NF-e/NFS-e |
| CSC ausente (FR-006) | Sem ele não há QR Code válido |
| Valor acima do limite sem identificação (FR-004) | Exige NF-e, não cupom |
| Venda sem itens ou valor zero | — |

Número reservado e não usado precisa de **inutilização junto à SEFAZ** — procedimento
administrativo. Esta base já deixou sete documentos órfãos por verificar tarde uma vez.

### Contingência

| Situação | Comportamento |
| --- | --- |
| SEFAZ responde | Emissão normal |
| SEFAZ indisponível | Emite em contingência, marca o documento, enfileira |
| SEFAZ volta | Drena a fila **na ordem de emissão** |
| Transmissão posterior rejeitada | **Sinaliza explicitamente** (FR-012) — o consumidor já levou o papel |
| Prazo legal excedido na fila | Alarme, não retry silencioso |
| Solicitante não alcança a API | Não há emissão (FR-010a) — e o sistema não finge que há |

### Documento auxiliar

| Formato | Origem |
| --- | --- |
| Bobina | Biblioteca já adotada — despacha por modelo, produz largura de bobina |
| A4 | Renderizador próprio, na porta `AuxiliaryDocumentRenderer` da feature 004 |

Os dois representam o mesmo cupom e **mostram os mesmos dados** (SC-007). Marca d'água de
homologação e marca Citybox aplicam-se aos dois sem alteração — são estágios independentes
do renderizador desde a feature 004.

---

## Transições de estado

Mesmas de NF-e, com um caminho novo:

```
                    ┌─ AUTHORIZED ─┬─ CANCEL_REQUESTED → CANCEL_AUTHORIZED
NUMBER_RESERVED ─────┤              └─ (documento entregue)
      │             └─ REJECTED
      │
      └─ contingência ─→ AUTHORIZED (offline, na fila)
                            │
                            ├─ transmitido  → AUTHORIZED (confirmado)
                            └─ rejeitado    → REJECTED ⚠️ com cupom já em mãos do consumidor
```

O ramo destacado é o que não existe em NF-e: um documento **rejeitado depois de entregue**.
É por isso que FR-012 exige sinalização explícita.
