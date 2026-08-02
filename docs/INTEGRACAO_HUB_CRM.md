# Integração hub.aplopes.com + CRM no FebraHub

Estado real da integração, fase a fase. Nada aqui afirma o que não foi
verificado; o que está pendente está escrito como pendente.

## Fase 1 — Inteligência Territorial (ENTREGUE)

O sistema de hub.aplopes.com (repo `aplopes-dev/hub`, "Inteligência
Territorial": 13,7 mil empresas/pessoas do território derivadas da base de
alunos, georreferenciadas) está integrado ao FebraHub como módulo nativo:

- **Menu**: Painéis → Inteligência Territorial, logo abaixo do Hub Executivo.
  Visível só para admin; a rota `/territorial` redireciona quem não é; a API
  (`/api/territorial/*`) responde 403 sem o setor `geral` — três camadas,
  como a spec pede. O hub de origem **não tinha autenticação nenhuma**; aqui
  toda rota passa pela sessão do FebraHub.
- **Banco**: as 5 tabelas (`niches`, `companies`, `company_partners`,
  `company_contacts`, `company_connections`) na migration
  `00000000000006_territorial`, com nomes preservados da origem — a carga é
  dump/restore direto, byte a byte, do Postgres do hub (mesma VPS).
- **Backend**: `modules/territorial` porta as consultas de produção do hub
  (list/map/metrics/connections/export/detail + niches + locations) sem
  mudança de fórmula.
- **Frontend**: mapa MapLibre + deck.gl (pontos por nicho, arcos de conexão,
  fronteiras estaduais, cluster, tela cheia, tooltip, fallback offline de
  basemap), KPIs, filtros na URL, tabela sincronizada, drawer de detalhe,
  exportação CSV/XLSX/PDF com documento mascarado — tudo no design system do
  FebraHub (tema claro/escuro, responsivo).

### O que ficou conscientemente de fora (Fase 1)

| Item | Motivo |
|---|---|
| Filtros de faturamento/funcionários/ano de abertura | A carga real vem **zerada** nesses campos (o GDE não fornece — relatório do ETL da origem). A API portada continua aceitando; a UI não oferece filtro que nunca casaria. |
| Vídeo de abertura (Higgsfield) | Asset de demo standalone; dentro de um painel autenticado atrapalha mais que apresenta. O arquivo segue no repo de origem. |
| Visualizações salvas, resize de colunas, raio por métrica | Conveniências de UI da origem; entram na Fase 2 se forem sentidas. |
| Sync incremental `dim_alunos → companies` | O FebraHub JÁ TEM a `dim_alunos` no mesmo banco (o sync da origem buscava do Supabase — aqui vira transformação interna). A adaptação do script está planejada; até lá o hub de origem segue rodando em paralelo e a base migrada é a foto da migração + o que o restore trouxer em reexecuções. |

### Rollback da Fase 1

As tabelas territoriais são aditivas (nenhuma existente foi tocada). Reverter
= reverter o deploy para o commit anterior; os dados podem ficar (inertes) ou
ser dropados manualmente. O hub.aplopes.com original continua no ar,
intocado, até validação e autorização de desligamento (§23 da spec).

## Fase 2 — CRM + WhatsApp + Agentes (INVENTARIADO; PORTE NÃO INICIADO)

O inventário completo do `crm-aplopes` (produção crm.aplopes.com, VPS
31.97.166.66) mudou o dimensionamento: **não é um módulo, é um produto** —
~73k linhas na API (NestJS 11/Express + Prisma 7, ~90 modelos, 56
migrations), ~77k no front (Next 16 + MUI v9), BullMQ+Redis, MinIO próprio,
SSE, e **Baileys (WhatsApp) rodando dentro do processo da API** com sessão em
arquivos. Os dados de produção são pequenos (34 clientes, 21 negócios, 22
conversas) — o peso é o código, não a carga.

**Achado central sobre "Agentes de IA": o CRM não tem motor de IA.** Não há
SDK de LLM no projeto. "Agentes" é a integração com a plataforma externa
Aplopes AI (team.aplopes.com): pareamento por token `crmk_`, webhook HMAC,
espelho de conversas/kanban, e o agente externo opera o CRM pela própria API
OpenAPI com identidade de serviço. Portar "os agentes" = portar essa ponte
(módulos `teams` + `tech-knowledge`, ~3,3k linhas, os mais portáveis do
repo) — o motor continua sendo a plataforma externa.

### Incompatibilidades estruturais a resolver no porte

1. Express → Fastify (guards, upload multer, streams, SSE com compressão).
2. Prisma 7 (generator custom CJS + adapter-pg) → Prisma 6 do FebraHub.
3. bcrypt → argon2 (rehash on-login ou reset de senhas).
4. MUI v9/Toolpad/X-DataGrid → design system próprio do FebraHub
   (**o maior bloco: ~77k linhas de front**).
5. Multi-tenant (Organization/Membership/permissions CASL) × mono-tenant por
   setor do FebraHub — decisão de modelo antes de qualquer schema.
6. BullMQ+Redis (o FebraHub não tem Redis) — disparo em massa de WhatsApp
   sem fila perde retry/rate-limit; adicionar Redis ao compose é o caminho.
7. **Baileys**: rc13 + patch de 1,6 MB + sessão em disco + um socket por
   organização DENTRO da API. Recomendação do inventário: extrair para
   worker dedicado antes do porte, com eventos via Redis.

### Ordem proposta (cada etapa validável de ponta a ponta)

1. Decisão de modelo (tenant único Febracis? papéis→permissions?).
2. Schema do núcleo CRM (Customer/Contact/Pipeline/Stage/Deal/Task/
   Activity) + migração dos dados (pequenos) + telas de leads/pipeline
   kanban no design FebraHub → `Setores → CRM`.
3. Redis + worker WhatsApp (Baileys extraído) + conversas/inbox + vínculo
   conversa↔cliente → `Integrações → WhatsApp`.
4. Ponte Aplopes AI (teams/tech-knowledge) → `Integrações → Agentes de IA`.
5. Propostas, comissões, pós-venda, campanhas — módulos completos, um a um.
6. Validação total → desativação dos sistemas antigos (com autorização).

Nada do CRM foi copiado, migrado ou desativado até aqui — os dois sistemas
de origem continuam em produção, intocados.
