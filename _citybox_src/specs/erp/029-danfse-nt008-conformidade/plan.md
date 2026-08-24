# Implementation Plan: DANFSe conforme a NT 008/2026

**Feature dir**: `specs/erp/029-danfse-nt008-conformidade` · **Branch**: acumulada em `feat/fiscal-api`
**Spec**: [spec.md](./spec.md) · **Input**: NT 008/2026 (Especificações Técnicas do DANFSe)

## Technical Context

- **Serviço**: `services/fiscal-api` (`@citybox/fiscal-api`, NestJS 11, Clean Architecture).
  **Nenhuma mudança** em erp-web/erp-api, banco ou migration.
- **Módulo alvo**: `src/modules/auxiliary-documents/`.
- **Rendering**: `pdfkit` (desenho), `pdf-lib` (embutir/estampar), `svg-to-pdfkit` (SVG
  vetorial), `qrcode` + código de barras (já em uso). Sem lib nova para o DANFSe (mantém a
  decisão R3 da spec 004 — implementação própria, agora conformada à NT).
- **Entrada**: XML autorizado da NFS-e (Padrão Nacional 1.01) — `RenderInput.authorizedXml`.
  O renderer **nunca** lê a entidade/banco (garantia de tipo, spec 004 R7).
- **XSDs (fonte de verdade dos campos)**: `resources/xsd/nfse/1.01/` — `DPS_v1.01.xsd`,
  `NFSe_v1.01.xsd`, `tiposComplexos_v1.01.xsd`.
- **Testes**: jest (fiscal-api). Renderer/reader com testes de presença/ordem (SC-001a) +
  amostras visuais em `amostras/` via `tests/manual/gerar-amostras.spec.ts` (SC-001b).
- **NEEDS CLARIFICATION**: nenhum — resolvidos no `/speckit-clarify` (ver spec §Clarifications).

## Constitution Check

- **Princípio I (docs-as-code)**: atualizar `services/fiscal-api/AGENTS.md` (novo leiaute do
  DANFSe conforme NT 008/2026 + remoção da marca Citybox) na mesma entrega. ✅
- **Princípio IV (minimizar dependências / caixa-preta)**: sem lib nova; o DANFSe segue
  implementação própria auditável (R3). A **remoção** da marca Citybox elimina o asset
  copiado `resources/brand/citybox-logotipo.svg` e o desvio registrado no plan da 004 —
  simplifica. ✅
- **Princípio V (isolamento por org)**: N/A — documento derivado do XML, sem dado de tenant.
- **Segurança/secrets**: N/A — sem secret, sem PII nova (só o que já está no XML autorizado).
- **Gate**: sem violação. O único desvio pré-existente (own-impl do DANFSe, R3) é mantido e
  agora **melhor justificado** pela NT (o oficial ainda é `501`).

## Estrutura (arquivos afetados)

```
services/fiscal-api/src/modules/auxiliary-documents/
├── infrastructure/pdf/
│   ├── nfse-xml.reader.ts            ← ESTENDER: endereço, intermediário, local prestação,
│   │                                    BC, deduções/descontos, retenções federais, totais
│   ├── nfse-xml.reader.spec.ts       ← (novo/estendido) presença/omissão dos campos
│   ├── danfse.renderer.ts            ← REESCREVER: leiaute em quadros (NT), identidade,
│   │                                    seções faltantes, omissão de ausentes
│   ├── danfse.renderer.spec.ts       ← presença/ordem das seções + A4 + sem marca Citybox
│   └── citybox-brand.stamper.ts      ← REMOVER (FR-014)
├── domain/
│   └── branding.ts                   ← REMOVER (FR-014) — porta BrandStamper
├── application/use-cases/get-auxiliary-document/
│   ├── get-auxiliary-document.use-case.ts   ← remover injeção/chamada do BrandStamper
│   └── get-auxiliary-document.use-case.spec.ts ← remover/ajustar o teste "FR-011 marca Citybox"
├── auxiliary-documents.module.ts     ← remover provider do CityboxBrandStamper
└── resources/brand/citybox-logotipo.svg ← REMOVER (asset órfão após FR-014)
tests/manual/gerar-amostras.spec.ts   ← amostras DANFSe novas p/ conferência (SC-001b)
resources/brand/nfse-nacional-*.svg    ← (opcional) asset oficial da identidade, se obtido
```

## Fases (resumo — detalhe em tasks.md via /speckit-tasks)

- **Fase 0 (research)**: [research.md](./research.md) — decisões R1..R7 (fidelidade,
  identidade, omissão, verificação, remoção da marca, mapa de campos do XSD, abordagem de
  desenho em quadros).
- **Fase 1 (design)**: [data-model.md](./data-model.md) (`NfseDocumentData` estendido),
  [contracts/](./contracts/) (contrato interno do reader + rota HTTP inalterada),
  [quickstart.md](./quickstart.md) (como validar).

## Ordem de implementação sugerida

1. **Remoção da marca Citybox (FR-014)** — fatia isolada e de baixo risco: desligar o
   `BrandStamper` no use-case, remover porta/impl/asset/provider, ajustar o teste. Vale para
   DANFE **e** DANFSe.
2. **Reader estendido (FR-011)** — mapear os elementos do XSD 1.01 e ampliar
   `NfseDocumentData`; testes de presença/omissão.
3. **Renderer conformado (FR-001..FR-010)** — reescrever `danfse.renderer.ts` em quadros na
   ordem da NT, identidade (asset ou fallback textual), omitindo campos ausentes.
4. **Amostras + conferência (SC-001)** — gerar amostras novas; teste de presença/ordem.

## Complexity Tracking

| Item | Desvio | Justificativa |
|------|--------|---------------|
| DANFSe own-impl (pdfkit) | Princípio IV (preferir lib) | Sem lib auditável (R3); oficial `501` (spec 004 R9); agora conformado à NT 008/2026 |
| Reescrita ampla do renderer | Superfície grande num arquivo | O leiaute da NT é estruturalmente diferente do atual; reescrever é mais seguro que remendar |

## Gates obrigatórios

- `database-reviewer`: **N/A** (sem migration/schema).
- `typescript-reviewer`: reader + renderer + use-case + section-box. **Executado** — achou
  1 HIGH (leitura incompleta do `totTrib` — variantes percentual/`pTotTribSN` sumiam), 2
  MEDIUM (determinismo de bytes do PDF; paginação de descrição longa) e 2 LOW (log no
  fallback do logo; estado de módulo → instância). **Todos corrigidos** e cobertos por teste.
- `security-reviewer`: **condicional** — **executado**, sem CRITICAL/HIGH. Confirmou: marca
  d'água de homologação preservada em toda origem; reader/renderer leem só do XML autorizado;
  path do logo é constante fixa (sem traversal); chave saneada a dígitos. LOW (log no
  fallback) resolvido junto do achado do typescript-reviewer.
- Sem `react-reviewer` (sem frontend).

## Docs-as-code

`services/fiscal-api/AGENTS.md` (novo leiaute DANFSe + remoção da marca Citybox). Sem
`AGENTS.md` de erp-web/erp-api (não tocados).
