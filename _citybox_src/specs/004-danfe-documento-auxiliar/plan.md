# Implementation Plan: Documento auxiliar impresso da nota fiscal (DANFE / DANFSE)

**Branch**: `feat/fiscal-api` | **Date**: 2026-08-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-danfe-documento-auxiliar/spec.md`

## Summary

Dois endpoints de leitura que entregam o documento auxiliar imprimível (PDF) de uma nota
já autorizada: `GET /v1/nfe/{id}/danfe` e `GET /v1/nfse/{id}/danfse`. O PDF deriva
**integralmente do XML autorizado** já armazenado no object storage — nunca do banco
relacional —, o que é o que garante que uma reimpressão de meses depois represente a nota
como ela foi autorizada (FR-008), e não como o cadastro está hoje.

A abordagem técnica sai de uma pesquisa que deu resultados **opostos** para os dois
documentos ([research.md](./research.md)): para DANFE existe biblioteca MIT mantida que já
implementa o leiaute regulado (R2), e para DANFSE não existe nenhuma auditável (R3). Os
dois ficam atrás da mesma porta, de modo que "adotada" vs. "própria" não vaze para o use
case.

A marca d'água de homologação (FR-005) é um **estágio separado da renderização**, aplicado
ao buffer pronto. Isso não é preferência de estilo: na Fase 2 o PDF pode vir da API oficial
do Sefin (FR-002a), e um marcador embutido no renderizador deixaria justamente esse caso
sem marcação.

Entrega em duas fases, conforme decidido em Clarifications: **DANFE primeiro** (a mercadoria
não circula sem ele), DANFSE em seguida.

## Technical Context

**Language/Version**: TypeScript 5.7 / Node 22

**Primary Dependencies**: NestJS 11, Prisma 7.8 (`@prisma/adapter-pg`), MinIO SDK.
Novas: `@alexssmusica/node-pdf-nfe` (DANFE), `pdf-lib` (marca d'água), `pdfkit` + `bwip-js`
+ `qrcode` (DANFSE, Fase 2). Todas MIT, todas JS puro — nenhuma dependência nativa entra no
container.

**Storage**: XML autorizado em object storage (MinIO), chaveado
`{companyId}/nfe/xml/{documentId}.xml`. **O PDF não é persistido** (R8).

**Testing**: Jest. Unitários com storage e renderizador em memória; integração contra
Postgres real, seguindo o padrão do serviço (sem mock de banco).

**Target Platform**: Linux container (`services/fiscal-api`)

**Project Type**: Web service (API REST NestJS, Clean Architecture por módulo)

**Performance Goals**: PDF entregue em < 5 s (SC-001). Geração sob demanda, sem cache.

**Constraints**: Nenhum binário nativo. Nenhum acesso de rede na Fase 1 — o XML já está
armazenado. Fase 2 admite chamada à API oficial com timeout curto e fallback local (R9).

**Scale/Scope**: 2 endpoints, 1 módulo compartilhado novo, ~2 renderizadores.

## Constitution Check

*GATE: avaliado antes da Fase 0 e reavaliado após a Fase 1.*

| Princípio | Situação | Observação |
| --- | --- | --- |
| **I — Docs-as-Code (AGENTS.md)** | ✅ atende | `services/fiscal-api/AGENTS.md` deve ser atualizado no **mesmo commit** (novo módulo, novas dependências, novas variáveis). Tarefa explícita, não pendência. |
| **II — Busca e paginação no backend** | ➖ não se aplica | Não há coleção; são dois GETs de recurso único. |
| **III — pnpm único** | ✅ atende | Dependências entram por `pnpm --filter @citybox/fiscal-api add`. |
| **IV — Atomic Design / `@citybox/ui`** | ➖ não se aplica | Sem superfície de frontend. |
| **V — Isolamento de tenant** | ⚠️ **atenção** | FR-007 exige recusar quem não é o emitente. Hoje **nenhuma rota de leitura do `fiscal-api` verifica `companyId`** — decisão registrada do v1 (R7). Esta feature **implementa a verificação nos seus próprios endpoints**; as rotas de XML existentes ficam como estão, com o débito registrado. |

**Portões de qualidade adicionais**:

- Sem `@ts-ignore` / `eslint-disable` — inclusive nos adapters das libs novas. Se a lib não
  tiver tipos, escrever declaração própria, não silenciar o compilador.
- `pnpm build && lint && typecheck && test` antes de qualquer commit.
- Nenhum commit sem autorização explícita.

**Veredito**: sem violação que exija justificativa em Complexity Tracking. O ponto de
atenção do Princípio V é *cumprimento* do princípio, não desvio — a feature fecha uma
lacuna em vez de herdá-la.

### Reavaliação após a Fase 1 (design pronto)

O design não introduziu violação nova, e resolveu dois pontos:

- **Princípio V** deixou de ser risco: `GetAuxiliaryDocumentUseCase` recebe `companyId` e
  recusa divergência com **404** (não 403 — 403 confirmaria a existência da nota). Coberto
  pelo Cenário 4 do [quickstart](./quickstart.md).
- **`database-reviewer` não se aplica**: o design não persiste nada — sem migration, sem
  tabela, sem coluna. Ver [data-model.md](./data-model.md). Não é dispensa do portão; é que
  não há schema a revisar.

Ponto que o design **acrescentou** ao radar: a marca d'água ficou fora do renderizador de
propósito. Se alguém, na Fase 2, "simplificar" movendo a estampagem para dentro do
renderizador, o PDF vindo da API oficial sai sem marcação e FR-005 quebra em silêncio —
justamente no caminho que FR-002a prefere. Registrado em [research.md § R4](./research.md).

## Project Structure

### Documentation (this feature)

```text
specs/004-danfe-documento-auxiliar/
├── spec.md              # Especificação (já existente)
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões técnicas com alternativas
├── data-model.md        # Fase 1 — entidades e transições
├── quickstart.md        # Fase 1 — como validar de ponta a ponta
├── contracts/
│   └── auxiliary-documents.openapi.yaml
├── checklists/
│   └── requirements.md  # 15/15
└── tasks.md             # Fase 2 — gerado por /speckit-tasks, NÃO por este comando
```

### Source Code (repository root)

```text
services/fiscal-api/src/
├── modules/
│   ├── auxiliary-documents/                    # ← NOVO módulo compartilhado
│   │   ├── domain/
│   │   │   ├── auxiliary-document.types.ts     # AuxiliaryDocument, DocumentOrigin
│   │   │   ├── renderer.interface.ts           # porta AuxiliaryDocumentRenderer
│   │   │   ├── watermark.interface.ts          # porta WatermarkStamper
│   │   │   └── errors/
│   │   │       ├── document-not-printable.error.ts     # FR-003 → 422
│   │   │       └── authorized-xml-unavailable.error.ts # FR-010 → 502
│   │   ├── application/
│   │   │   └── use-cases/
│   │   │       └── get-auxiliary-document/
│   │   │           └── get-auxiliary-document.use-case.ts
│   │   ├── infrastructure/
│   │   │   ├── pdf/
│   │   │   │   ├── danfe.renderer.ts           # adapter sobre a lib (R2)
│   │   │   │   ├── danfse.renderer.ts          # renderização própria (R3) — Fase 2
│   │   │   │   └── pdf-lib-watermark.stamper.ts# estampagem (R4)
│   │   │   └── sefin/
│   │   │       └── official-danfse.client.ts   # API oficial (R9) — Fase 2
│   │   └── auxiliary-documents.module.ts
│   ├── nfe/infrastructure/http/routes/
│   │   └── get-danfe/get-danfe.route.ts        # GET /v1/nfe/{id}/danfe
│   └── nfse/infrastructure/http/routes/
│       └── get-danfse/get-danfse.route.ts      # GET /v1/nfse/{id}/danfse  — Fase 2
└── shared/domain/storage/                       # reusado, sem alteração
```

**Structure Decision**: módulo compartilhado `auxiliary-documents` para o domínio e a
renderização; **rotas nos módulos `nfe` e `nfse`**.

A divisão segue a convenção já estabelecida no serviço, em que `providers/` concentra os
adapters de órgão e cada módulo de documento expõe suas próprias rotas. Manter as rotas em
`nfe`/`nfse` preserva o prefixo de URL, o `@ApiTags` e a descoberta no Swagger junto das
demais operações da nota — quem procura o que dá para fazer com uma NF-e encontra tudo em
um lugar. A lógica compartilhada (marca d'água, contrato de renderização, use case) fica no
módulo novo, sem duplicação.

## Faseamento

| Fase | Escopo | Entrega |
| --- | --- | --- |
| **1** | US1 + US3 — DANFE | Rota, use case, adapter da lib, estampagem, isolamento por emitente, testes |
| **2** | US2 — DANFSE | Renderizador próprio, cliente da API oficial com fallback, registro de origem |
| **3** | Marca Citybox — FR-011…FR-014 | Rodapé de crédito com logo vetorial e legenda, nos dois documentos |

A Fase 1 entrega valor sozinha e exercita **todo** o caminho compartilhado (porta,
estampagem, autorização, tratamento de erro). A Fase 2 acrescenta um adapter e uma rota —
por isso a ordem escolhida também é a de menor risco, e não só a de maior urgência.

## Fase 3 — Marca Citybox (FR-011 a FR-014)

**Pedido**: logo e legenda do Citybox nos dois documentos.

### A decisão que molda tudo: onde a marca NÃO vai

O leiaute do DANFE reserva um espaço de logotipo **dentro do quadro "IDENTIFICAÇÃO DO
EMITENTE"** — a biblioteca o expõe como `pathLogo`, e verifiquei que é lá que desenha
(`get-dados-emitente.js:66`). É a caixa que declara **quem emitiu a nota**.

Pôr a logo do Citybox ali afirmaria, num documento que acompanha mercadoria e é
apresentado em fiscalização, que o emitente é o Citybox — e não o contribuinte. Não é
preferência estética: é identificação incorreta do emitente.

**Portanto**: `pathLogo` fica reservado ao emitente, e a marca do Citybox vai num **rodapé
de crédito**, fora dos quadros regulados. É o que FR-012 codifica, e o que dá ao pedido o
efeito desejado — Citybox visível no documento — sem o risco.

### Estrutura

```text
services/fiscal-api/src/modules/auxiliary-documents/
├── domain/
│   └── branding.ts                          # texto da legenda + política de posição
├── infrastructure/
│   └── pdf/
│       ├── citybox-brand.stamper.ts         # rodapé: logo vetorial + legenda
│       └── assets/citybox-logotipo.svg      # cópia versionada do asset
└── ...

services/fiscal-api/src/modules/auxiliary-documents/infrastructure/pdf/
    pdf-lib-watermark.stamper.ts             # inalterado — outra preocupação
```

### Duas decisões de implementação

**1. Estágio próprio, ao lado da marca d'água — não dentro dela.** As duas estampam o PDF
pronto, mas respondem a perguntas diferentes: a marca d'água pergunta *"este documento
vale?"*, o crédito pergunta *"quem gerou?"*. A primeira só existe em homologação; o segundo
existe sempre. Fundi-las faria a marca Citybox sumir em produção — exatamente onde ela
deve aparecer.

**2. Asset copiado, não importado de `packages/ui`.** O `fiscal-api` é um serviço
standalone que roda em container próprio; depender de `@citybox/ui` (React, Tailwind) para
ler um SVG traria o design system inteiro para dentro de uma API sem frontend. A cópia é
um arquivo de 5 KB, e o teste de renderização é o que avisa se a marca oficial mudar.

### Ordem

| # | Passo | Verificação |
| --- | --- | --- |
| 1 | `svg-to-pdfkit` como dependência | Sem binário nativo |
| 2 | Copiar `logotipo.svg` para `assets/` | Renderiza sem erro |
| 3 | `CityboxBrandStamper` — logo + legenda no rodapé | Texto da legenda extraível |
| 4 | Ligar no use case, **antes** da marca d'água | Marca presente em produção **e** em homologação |
| 5 | Regenerar amostras | Conferência visual (T026 passa a cobrir os dois) |

### Reavaliação do portão constitucional

| Princípio | Situação |
| --- | --- |
| I — Docs-as-Code | `AGENTS.md` do serviço ganha a seção da marca, mesmo commit |
| III — pnpm único | `pnpm --filter @citybox/fiscal-api add svg-to-pdfkit` |
| IV — Atomic Design / `@citybox/ui` | ⚠️ **Desvio consciente**: o asset é copiado em vez de importado. Justificado abaixo. |
| V — Isolamento de tenant | Não se aplica — a marca é igual para todos |

## Complexity Tracking

| Violação | Por que é necessária | Alternativa rejeitada porque |
| --- | --- | --- |
| Cópia do `logotipo.svg` em vez de importar de `@citybox/ui` (Princípio IV) | O `fiscal-api` não tem frontend nem build de React. Importar o pacote traria React 19, Tailwind e o design system inteiro para uma API que só precisa de um arquivo SVG de 5 KB. | Importar `@citybox/ui`: infla a imagem do container e cria dependência de build de frontend num serviço backend. O custo real da cópia é a marca desatualizar em silêncio — mitigado pelo teste de renderização e por registro no `AGENTS.md`. |

> Sem violações da Constituição a justificar. Seção mantida vazia deliberadamente.
