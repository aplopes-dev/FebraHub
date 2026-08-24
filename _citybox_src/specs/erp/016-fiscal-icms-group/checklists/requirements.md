# Specification Quality Checklist: Grupo de ICMS

**Created**: 2026-08-13 | **Feature**: [spec.md](../spec.md)

## Content Quality
- [x] Sem detalhes de implementação nos requisitos
- [x] Foco no valor ao usuário
- [x] Legível por stakeholder não técnico
- [x] Seções obrigatórias completas

## Requirement Completeness
- [x] Sem [NEEDS CLARIFICATION] (decisões no `.txt` + plan D1–D8)
- [x] Requisitos testáveis (SC-004/006 provados por builder test)
- [x] Critérios mensuráveis e tecnologia-agnósticos
- [x] Cenários de aceite definidos
- [x] Casos de borda (Simples sem alíquota; produto sem grupo; interna vs interestadual)
- [x] Escopo delimitado (FCP/ST/cBenef/DIFAL e CST≠00 fora)
- [x] Dependências/assunções identificadas (DB não provisionado; XML → builder test; B1/B2/B7)

## Feature Readiness
- [x] FRs com aceite
- [x] Cenários cobrem os fluxos primários + não-regressão
- [x] Métricas cobrem cadastro e emissão
- [x] Sem vazamento de implementação

## Notes
- **XML/SEFAZ**: toca `buildImpostoXml` → teste do builder **obrigatório**; SC-004 fecha **B1**.
- **B2** (CSOSN arbitrário no builder) permanece bugfix próprio; a tela só oferece CSOSN seguros.
- Emissão real no PDV = **B7** (deferido); a feature entrega resolvedor + contrato + builder.
- DB erp não provisionado → testes erp-api jest in-memory.
