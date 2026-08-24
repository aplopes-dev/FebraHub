# Specification Quality Checklist: Emissão de NFS-e pelo Padrão Nacional

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-05
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`.

### Observações da validação

- **Terminologia**: a spec usa "declaração de prestação de serviços" e "nota fiscal de serviço" como
  entidades distintas de propósito — essa distinção é a diferença central entre o padrão nacional e
  o modelo municipal anterior, e não é detalhe de implementação. Os nomes técnicos oficiais (DPS,
  ADN, Sefin Nacional) aparecem apenas na seção de contexto, que existe para justificar a mudança
  de premissa.
- **Sem `[NEEDS CLARIFICATION]`**: as três decisões que poderiam justificar marcador — aderência de
  Ilhéus, escopo de ambiente e destino do provider municipal — foram resolvidas: a primeira pelo
  usuário, as outras duas como premissas explícitas alinhadas ao que a entrega anterior já praticou.
- **Material oficial consultado**: esquemas XSD v1.01 do Sistema Nacional (`DPS`, `NFSe`, `evento`,
  `tiposEventos`) e o Manual de Contribuintes das APIs. Os tipos de evento citados na spec (US2, US3
  e a entidade Evento) vêm da lista oficial do esquema, não de inferência.
- **Não verificado**: prazo exato de cancelamento direto e a lista de regras de negócio de validação
  da declaração vivem no Anexo I (planilha de leiaute e regras), que deve ser lido na fase de plano
  — a spec descreve o comportamento esperado sem fixar valores que ainda não foram confirmados.
