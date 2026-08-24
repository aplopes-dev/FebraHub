# Specification Quality Checklist: Conciliação bancária — importação de OFX e casamento com lançamentos

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-06
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
- As 3 marcações `[NEEDS CLARIFICATION]` originais (efeito da conciliação no saldo, divergência de
  repasse, tolerância de valor) foram resolvidas via perguntas ao usuário durante `/speckit-specify`
  e incorporadas em FR-029 a FR-032, Key Entities, Edge Cases e SC-008/SC-009.
- Sessão `/speckit-clarify` de 2026-08-06 resolveu 3 ambiguidades adicionais (candidatos múltiplos
  com valor exato, exclusividade de lançamento já conciliado, data da movimentação bancária
  gerada), incorporadas em FR-014/015/033/034, Edge Cases, User Story 2 e Key Entities. Nenhum item
  do checklist mudou de estado — permanece 16/16.
- Segunda rodada da sessão `/speckit-clarify` de 2026-08-10 (comparação CPLUG x ERP Citybox)
  corrigiu o filtro de status indevido na busca manual (FR-016) e formalizou o gap de layout
  identificado pelo usuário: cartões com botões reais na lista de Pendentes (FR-039), filtros
  completos + tabela no drawer "Buscar Registros" (FR-038), seções com campos travados somente
  leitura no "Novo Registro" (FR-040), e painel consolidado "Registros sugeridos" (FR-041).
  Nenhum item do checklist mudou de estado — permanece 16/16.
- Terceira rodada da sessão `/speckit-clarify` de 2026-08-14 (nova comparação CPLUG x ERP Citybox,
  com inspeção do código em `apps/erp/web/src/features/bank-reconciliation/`) resolveu 5
  ambiguidades: divergência de valor migra para o cartão sem afetar o bloqueio (FR-016/FR-031),
  filtro de conta na busca manual destravado (FR-037, revogando a decisão de 2026-08-10),
  "Conciliar" na 1ª posição da linha de ações (FR-039), "Novo Registro" como drawer à direita
  (FR-040), e a consequência do destravamento sobre o saldo bancário (FR-029/FR-030/FR-021).
  Duas entradas da sessão de 2026-08-10 foram anotadas como SUPERADAS em vez de removidas, para
  preservar o histórico de decisão. Nenhum item do checklist mudou de estado — permanece 16/16.
- Quarta rodada da sessão `/speckit-clarify` de 2026-08-14, disparada pelo achado F1 de
  `/speckit-analyze`: a interação entre o ramo `paid` (2026-08-11) e a conta destravada (FR-037)
  deixava a concilição de um `paid` de outra conta sem movimentação alguma, contrariando SC-009.
  Resolvido com **FR-043** (concilar `paid` exige mesma conta; ele segue visível na busca) e com a
  confirmação de que a assimetria sugestão×busca é intencional (FR-014 permanece restrita à conta do
  extrato). Nenhum item do checklist mudou de estado — permanece 16/16.
- Quinta rodada da sessão `/speckit-clarify` de 2026-08-14, disparada por **teste do usuário em
  produção** (não por análise de documento): a busca manual ficou 100% bloqueada porque o extrato não
  resolve a conta bancária. A investigação achou a causa estrutural — `BankAccount` guarda só
  `bankCode`, o OFX traz agência e conta, e **não existe chave confiável entre os dois**. Resolvido
  tornando a conta **obrigatória na importação** (FR-001 reescrita, revertendo a
  `007-financeiro-ajustes-ui` FR-007; FR-042 vira regra só para extratos legados). Segunda decisão:
  **FR-044** nova — campo Cliente ou fornecedor vira seleção sobre os cadastros de `/clientes` sem
  filtro de estágio CRM (hoje o formulário da conciliação usa texto livre e o de lançamentos filtra
  por `tab=active`, um estágio que a interface não permite editar). Terceiro ponto reportado (status
  não virar `paid`) **não reproduziu** — `paid` é rotulado "Recebido" em conta a receber; usuário
  decidiu manter como está. Nenhum item do checklist mudou de estado — permanece 16/16.
