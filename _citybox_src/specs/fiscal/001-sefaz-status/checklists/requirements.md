# Specification Quality Checklist: Status de comunicação com o órgão fiscal (NFC-e e NFS-e)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-12
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

Revalidado em 2026-08-12 após `/speckit-clarify` (3 perguntas). 16/16 continuam
passando; o escopo cresceu de 2 para 3 modelos e a spec ganhou FR-001a/b, FR-005a,
FR-007a/b e FR-008a.

Duas suposições carregam risco real e devem ser fechadas na fase de plano, não
depois:

1. **Assumption 2 — nota de serviço.** Se o padrão nacional de NFS-e não expõe
   operação de disponibilidade, a User Story 2 entrega "não verificável" em vez de
   um status de verdade. É resposta honesta e cumpre FR-002/FR-003, mas é menos do
   que o pedido original sugere. Confirmar lendo a especificação oficial antes de
   escrever tarefas.
2. **Assumption 3 — intervalo mínimo de 3 minutos.** Se o valor real for maior, o
   serviço pode provocar bloqueio (violando SC-004); se for menor, estamos servindo
   dado mais velho do que o necessário. Confirmar na documentação oficial.

Ambas são perguntas de **pesquisa** (resposta está em documento público), não
decisões do usuário — por isso viraram tarefa de plano em vez de
[NEEDS CLARIFICATION].

Ponto de atenção para o plano, criado pela decisão de consulta única (FR-001):
FR-008a exige que os órgãos sejam contatados sem somar os tempos e que um órgão
inalcançável não derrube os demais. SC-003 mede exatamente o pior caso (três
modelos, todos inacessíveis, em 5s) — é o critério que falha primeiro se o
contato for sequencial.
