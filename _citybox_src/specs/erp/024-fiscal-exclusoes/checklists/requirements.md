# Specification Quality Checklist: 024 — Exclusões fiscais (Natureza de Operação e CSC do Emitente)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-14
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain — as 3 decisões (hard delete, aviso na confirmação, bloqueio de CSC) resolvidas via `/speckit-clarify` (ver `## Clarifications`).
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

- A exclusão de Natureza de Operação não requer migration (FKs filhas já são `Cascade`, nenhuma FK externa aponta para `OperationNature`).
- A remoção de CSC também não requer migration (`cscId`/`cscTokenEncrypted` já são nullable).
- FR-009 é a decisão arquitetural central desta feature: a checagem de interlock (Modelo 65 × CSC) mora no proxy `erp-web`, não em nova comunicação fiscal-api→erp-api.
