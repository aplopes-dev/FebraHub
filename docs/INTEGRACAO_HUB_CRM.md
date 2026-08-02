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

### Estado das etapas (02/08/2026)

1. **Decisão de modelo — FEITA**: tenant único (decisão do Rafael); papéis
   granulares da origem viraram a regra da casa (setor usa, admin/gestor
   configura). Carga inicial VAZIA — as carteiras da origem (Aplopes + um
   cliente de advocacia) não entram no painel da Febracis.
2. **Núcleo do CRM — ENTREGUE** (`Setores → CRM`, migration 07): clientes
   com ciclo de vida (lead É cliente por estágio), funil kanban semeado,
   negócios em centavos com trilha de estágio (perder exige motivo; ganhar
   promove o cliente), tarefas, atividades, auditoria em toda escrita.
3. **WhatsApp — ENTREGUE** (`Integrações → WhatsApp` + aba Conversas do
   CRM, migration 08): baileys rc13 com o MESMO patch de produção da origem
   (pnpm patchedDependencies) e o workaround WEB→MACOS; manager
   single-tenant no processo da API (débito assumido, como a origem roda),
   sessão no volume `febrahub_wa_sessoes`; pipeline de entrada com dedupe,
   conversa por telefone, vínculo automático ao cliente pelos últimos 8
   dígitos, mídia re-hospedada no MinIO, escada de status e erro 463
   acionável. **QR real gerado contra os servidores do WhatsApp em
   produção** — conectar o número = escanear (ação humana). SEM Redis por
   decisão de escopo: transmissões em massa (broadcasts/campanhas) da
   origem ficam para uma etapa futura, que trará BullMQ.
4. **Agentes de IA — ENTREGUE** (`Integrações → Agentes de IA`, migration
   09): token de conexão `fhk_live_` (só hash), manifesto
   `/.well-known/aplopes-integration` (roteado no nginx) e pair
   autenticados por ele, tokens remotos cifrados AES-256-GCM
   (`AGENTES_CHAVE_CIFRA` no env da VPS), webhook HMAC
   `sha256(timestamp.rawBody)` com outbox e anti-replay, criação de issue
   com Idempotency-Key, chat espelhado e **reconciliação de 60s** que
   fecha o loop mesmo sem webhook registrado na plataforma. Para ativar:
   gerar o token na tela e colar no Aplopes em "Conectar um sistema".
5. Propostas, comissões, pós-venda, campanhas/segmentos/transmissões,
   grupos de WhatsApp, notificações — módulos da origem AINDA NÃO
   portados.
6. Validação total → desativação dos sistemas antigos (com autorização) —
   os dois sistemas de origem continuam em produção, intocados.
