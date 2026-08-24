# Implementation Plan: Cupom fiscal eletrônico (NFC-e, modelo 65)

**Branch**: `005-nfce-cupom-fiscal` | **Date**: 2026-08-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-nfce-cupom-fiscal/spec.md`

## Summary

Emissão de cupom fiscal ao consumidor final — **NFC-e, modelo 65** — pela SEFAZ-BA, com
QR Code, documento auxiliar em bobina e A4, cancelamento, inutilização e contingência para
indisponibilidade do órgão.

A descoberta que define o plano: **a NFC-e não é um documento tecnicamente novo**. Mesmo
XSD, mesmo webservice, mesma assinatura da NF-e já implementada — muda o modelo (`65`), o
conteúdo (destinatário opcional, pagamento obrigatório, QR Code) e o papel impresso. A
maior parte do trabalho é **parametrizar o que existe**, não construir do zero
([research.md § R1](./research.md)).

Duas coisas são genuinamente novas e concentram o risco: o **QR Code**, que tem ordem de
montagem obrigatória em relação à assinatura (R2), e a **contingência**, que exige fila
persistente com transmissão ordenada e rejeição visível (R4).

## Technical Context

**Language/Version**: TypeScript 5.7 / Node 22

**Primary Dependencies**: NestJS 11, Prisma 7.8, `soap`, `xml-crypto`, `libxmljs2`,
`node-forge` — todas já presentes. `@alexssmusica/node-pdf-nfe`, `pdfkit`, `qrcode`,
`bwip-js`, `pdf-lib` — já adotadas na feature 004. **Nenhuma dependência nova prevista.**

**Storage**: Postgres, schema `fiscal`. Migration necessária: valor `NFCE` no tipo de
documento, colunas de CSC no Emitente e tabela de fila de contingência.

**Testing**: Jest. Unitários com fakes; integração contra Postgres real. Emissão real
apenas em **homologação**.

**Target Platform**: `services/fiscal-api` (container Linux, porta 3116)

**Project Type**: Web service (API REST NestJS, Clean Architecture por módulo)

**Performance Goals**: cupom autorizado e documento entregue em < 5 s (SC-001). É o
orçamento mais apertado do serviço — no balcão há fila esperando.

**Constraints**: certificado e CSC **nunca** saem do servidor (FR-015). Produção recusada
por construção. Contingência cobre queda da SEFAZ, não da internet da loja (FR-010a).

**Scale/Scope**: ~6 endpoints, 1 módulo novo, 1 migration, 3 renderizadores de documento.

## Constitution Check

*GATE: avaliado antes da Fase 0 e reavaliado após a Fase 1.*

| Princípio | Situação | Observação |
| --- | --- | --- |
| **I — Docs-as-Code** | ✅ atende | `services/fiscal-api/AGENTS.md` no mesmo commit; `AGENTS.md` raiz também, por ser documento fiscal novo no serviço |
| **II — Busca/paginação no backend** | ➖ não se aplica | Sem coleção nova exposta |
| **III — pnpm único** | ✅ atende | Nenhuma dependência nova prevista |
| **IV — Atomic Design** | ➖ não se aplica | Sem frontend |
| **V — Isolamento de tenant + schema próprio** | ⚠️ **atenção** | Migration no schema `fiscal` → **`database-reviewer` é obrigatório**. As rotas herdam a `CompanyAccessPolicy` da feature 004 |

**Portões adicionais**:

- Sem `@ts-ignore` / `eslint-disable`.
- `pnpm build && lint && typecheck && test` antes de commit.
- **`database-reviewer` obrigatório** — diferente da feature 004, aqui há migration.
- Nenhum commit sem autorização.

**Veredito**: sem violação a justificar. O ponto de atenção do Princípio V é procedimento
(rodar o portão de banco), não desvio.

## Project Structure

### Documentation (this feature)

```text
specs/005-nfce-cupom-fiscal/
├── spec.md
├── plan.md              # Este arquivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/
│   └── nfce.openapi.yaml
├── checklists/requirements.md   # 16/16
└── tasks.md             # Fase 2 — /speckit-tasks
```

### Source Code (repository root)

```text
services/fiscal-api/
├── prisma/migrations/<ts>_nfce/          # NFCE no enum, CSC, fila de contingência
├── resources/                             # sem asset novo
└── src/modules/
    ├── nfce/                              # ← NOVO
    │   ├── domain/
    │   │   ├── qr-code.ts                 # conteúdo do QR (hash com CSC)
    │   │   ├── payment.entity.ts          # formas de pagamento + troco
    │   │   ├── rules/consumer-limit.ts    # FR-004
    │   │   └── errors/
    │   ├── application/use-cases/
    │   │   ├── issue-nfce/
    │   │   ├── cancel-nfce/
    │   │   ├── inutilize-nfce/
    │   │   └── transmit-pending-nfce/     # drena a fila de contingência
    │   ├── infrastructure/
    │   │   ├── xml/nfce-xml.builder.ts    # delega ao builder de NF-e
    │   │   ├── contingency/               # fila persistente + agendador
    │   │   └── http/routes/
    │   └── nfce.module.ts
    ├── nfe/infrastructure/xml/
    │   └── nfe-xml.builder.ts             # 🟡 parametrizar modelo/tpEmis/dest
    ├── companies/                          # 🟡 CSC cifrado
    └── auxiliary-documents/
        └── infrastructure/pdf/
            ├── danfe-nfce.renderer.ts     # bobina — delega à biblioteca
            └── danfce-a4.renderer.ts      # A4 — próprio (FR-007a)
```

**Structure Decision**: módulo `nfce` próprio para o **domínio** (QR Code, pagamento,
limite, contingência), reusando o **builder de XML** e o **provider SEFAZ** da NF-e.

A divisão segue o que a NFC-e realmente é: documento fiscal distinto — com regras, prazos e
leiaute próprios — que compartilha o *transporte* com a NF-e. Um módulo separado mantém as
regras de cupom fora do módulo de NF-e; delegar o builder evita duplicar os grupos
tributários que já custaram várias rodadas de rejeição para acertar.

Os renderizadores entram em `auxiliary-documents`, que a feature 004 já desenhou como
registro por tipo de documento.

## Faseamento

| Fase | Escopo | Entrega |
| --- | --- | --- |
| **1** | US1 + US2 — emissão e documento | Cupom autorizado com QR Code, bobina e A4 |
| **2** | US4 — cancelamento e inutilização | Ciclo de vida |
| **3** | US3 — contingência | Fila, retransmissão ordenada, rejeição visível |

A Fase 1 entrega valor sozinha: o caixa vende. A contingência vem por último de propósito —
um sistema que emite online já opera; um que só emite offline não opera nunca.

## Riscos que o plano assume

**QR Code fora de ordem** (R2). Calcular o QR depois de assinar produz cupom que o
consumidor não consegue consultar — e pode ser autorizado assim. O teste precisa validar o
conteúdo do QR **no XML transmitido**, não só a imagem no PDF.

**Numeração queimada** (R7). Toda recusa — limite de valor, CSC ausente, ambiente de
produção — precisa acontecer **antes** da reserva de número. Esta base já deixou sete
documentos órfãos por errar essa ordem uma vez.

**Contingência perdida em restart** (R4). A fila é persistente, não em memória. Um cupom
entregue ao consumidor e perdido num restart é a pior falha desta feature.

**Bloqueio administrativo.** CSC e credenciamento para modelo 65 são passos do contribuinte
junto à SEFAZ, externos ao código, e **impedem emitir**. O credenciamento de NFC-e é
distinto do de NF-e — a RR pode ter um e não o outro, como a APLOPES teve.

## Complexity Tracking

> Sem violações da Constituição a justificar.
