# Specification Quality Checklist: Grupo de PIS/COFINS

**Created**: 2026-08-13 | **Feature**: [spec.md](../spec.md)

## Content Quality
- [x] Sem detalhes de implementação nos requisitos
- [x] Foco no valor ao usuário
- [x] Legível por stakeholder não técnico
- [x] Seções obrigatórias completas

## Requirement Completeness
- [x] Sem [NEEDS CLARIFICATION] (decisões no `.txt` + plan D1–D6)
- [x] Requisitos testáveis (SC-003/005/006 provados por builder test)
- [x] Critérios de sucesso mensuráveis e tecnologia-agnósticos
- [x] Cenários de aceite definidos
- [x] Casos de borda (produto sem grupo/sem padrão; Simples; divergência PIS/COFINS)
- [x] Escopo delimitado (CST 03 e 49–99 fora; sem vínculo em massa)
- [x] Dependências/assunções identificadas (DB não provisionado; XML → builder test)

## Feature Readiness
- [x] FRs com aceite
- [x] Cenários cobrem os fluxos primários + não-regressão
- [x] Métricas cobrem cadastro e emissão
- [x] Sem vazamento de implementação

## Notes
- **XML/SEFAZ**: feature toca `buildPisCofinsXml` → teste do builder é **obrigatório** e é o
  critério que prova a entrega (SC-003) + duas não-regressões (SC-005/006).
- DB erp não provisionado → testes erp-api jest in-memory (a spec pede Postgres real; indisponível).
- Emissão real no PDV é B7 (deferido); a feature entrega resolvedor + contrato + builder apurado.
