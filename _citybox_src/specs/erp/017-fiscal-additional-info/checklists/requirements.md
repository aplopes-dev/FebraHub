# Specification Quality Checklist: Informações Adicionais da Nota Fiscal

**Created**: 2026-08-13 | **Feature**: [spec.md](../spec.md)

## Content Quality
- [x] Sem detalhes de implementação nos requisitos
- [x] Foco no valor ao usuário
- [x] Legível por stakeholder não técnico
- [x] Seções obrigatórias completas

## Requirement Completeness
- [x] Sem [NEEDS CLARIFICATION] (decisões no `.txt` + plan D1–D9)
- [x] Requisitos testáveis (SC-003/004/005 provados por builder tests ×3)
- [x] Critérios mensuráveis e tecnologia-agnósticos
- [x] Cenários de aceite definidos
- [x] Casos de borda (estouro do limite; tipo sem info; destino trocado)
- [x] Escopo delimitado (sem escolha caso a caso; sem variáveis; sem layout impresso)
- [x] Dependências/assunções identificadas (DB não provisionado; XML → builder tests; B7)

## Feature Readiness
- [x] FRs com aceite
- [x] Cenários cobrem os fluxos primários + não-regressão
- [x] Métricas cobrem cadastro e emissão
- [x] Sem vazamento de implementação

## Notes
- **XML/SEFAZ**: novo grupo `infAdic` nos 3 builders (NF-e, NFC-e, DPS) → builder tests
  **obrigatórios**, incl. a **não-regressão** (sem info → sem `infAdic`, XML idêntico).
- Limite é a **soma concatenada** por (tipo, destino) contra o teto do XSD — impedir, nunca truncar.
- Modo automático fixo nesta entrega → sem o toggle "Informação automática" da referência.
- Emissão real no PDV = B7 (deferido); a feature entrega resolvedor + contrato + builders.
