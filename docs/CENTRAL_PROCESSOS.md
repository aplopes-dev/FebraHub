# Central de Processos — Fase 1

## Entrega deste corte

- Contratos Prisma e migration para processos, snapshots de versão, auditoria, entregas e pendências.
- RBAC no catálogo e proteção independente para consulta, mapeamento, validação, administração e implantação.
- API de cadastro, busca, autosave por `PATCH`, concorrência otimista por `revisao`, transições e nova versão.
- Imutabilidade de processo aprovado/publicado e bloqueio de autoaprovação, salvo administrador.
- Progresso da implantação calculado pelas entregas nos pesos 60/25/15.
- Menu e painéis responsivos para visão geral, mapa e implantação.
- Processo preliminar `COM-EST-001`, mantido como rascunho e marcado para validação de Ana.

## Aplicação da migration

Antes de produção, execute o backup operacional descrito em `infra/scripts/backup.sh`. Depois:

```bash
pnpm prisma:migrate
```

Não há variável de ambiente nova. Os dados permanecem no Postgres oficial configurado por `DATABASE_URL`.

## Contratos para a Fase 2

`Processo.metadados`, `entrevista` e `manual` aceitam extensão sem quebrar o fluxo existente. `bpmnXml` é o contrato canônico para BPMN 2.0. A operação real de compras não deve gravar nessas estruturas; deve apenas referenciar `Processo.id` e a versão aprovada.

## Próximos incrementos do PRD

Ainda exigem implementação: editor visual BPMN (incluindo PNG/SVG/PDF), formulários completos de entrevista/manual, anexos e transcrição, comentários por etapa, comparação/restauração visual de versões, cronograma com histórico de previsão, tela de pendências/decisões e testes E2E de RBAC/autosave/concorrência.
