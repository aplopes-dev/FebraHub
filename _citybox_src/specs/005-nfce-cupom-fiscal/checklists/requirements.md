# Specification Quality Checklist: Cupom fiscal eletrônico (NFC-e, modelo 65)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-08
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

**15/15.** As três clarificações foram respondidas em 2026-08-08 e integradas:

| Decisão | Onde entrou |
| --- | --- |
| ERP e PDV, sempre online; assinatura no servidor | Clarifications, **FR-015** |
| Contingência cobre queda da SEFAZ, não da internet da loja | Clarifications, **US3**, **FR-010/010a**, **SC-004**, Out of Scope |
| Dois leiautes: bobina 80 mm e A4 digital | Clarifications, **FR-007/007a**, **US2**, **SC-006/007** |

Duas observações honestas sobre o resultado:

**O escopo cresceu na terceira decisão.** A recomendação era só bobina; a escolha foi os
dois leiautes. Não é erro — o consumidor que prefere e-mail deixa de depender do QR Code —
mas dobra a renderização e a conferência visual, e `SC-007` existe para impedir que as duas
vias divirjam.

**Uma lacuna permanece por decisão, não por esquecimento**: com a internet da loja fora, o
PDV não alcança a API e não há emissão. Está declarado em `FR-010a` e em Out of Scope, em
vez de escondido — fechá-la exigiria agente local no caixa, que é outra categoria de
produto.

Sobre "no implementation details": a Nota de terminologia cita modelos fiscais (65, 59) e a
SEFAZ-BA de propósito — é vocabulário de domínio que **delimita escopo**. Sem distinguir
NFC-e de SAT, "cupom fiscal" ficaria ambíguo o bastante para construir a coisa errada.

Pronta para `/speckit-plan`.
