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

## Fase 3 — correção de auth + conversas completas + fidelidade ao hub (02/08/2026)

Branch `fix/auth-hub-conversations-ui`.

### Refresh token — causa real e correção

A "sessão que expirava sozinha" tinha causa raiz na **detecção de reuso
tratando corrida legítima como vazamento**: o refresh era rotativo, e duas
renovações concorrentes com o mesmo cookie (duas abas com polling, retry em
voo, resposta perdida na rede) faziam a segunda cair em `revogarTodas` —
TODAS as sessões do usuário morriam. O front tinha single-flight na aba,
mas nada entre abas. Correção no padrão do Veicular (referência auditada):

- **Rotação via CAS** (`updateMany where revogadaEm: null`): quem perde a
  corrida reemite mesmo assim; só token revogado NA LEITURA é reuso — e aí
  derruba tudo, audita (`refresh_reuso`) e exige novo login.
- **Deslizamento com teto**: o refresh re-expira a cada uso
  (+`JWT_REFRESH_EXPIRES_IN`, 30d) mas a família nunca passa do teto
  absoluto (`AUTH_SESSION_MAX_AGE`, 90d) herdado do login (colunas
  `substituida_por` e `absoluta_expira_em`, migration 10).
- **Unidades por construção**: `ttlMs` único alimenta o `expiresIn` do JWT,
  o `expira_em` do banco e o `maxAge` do cookie (que antes era 15 min
  chumbado, ignorando o env).
- **Front**: trava entre abas via Web Locks + guarda "renovou há <15s";
  renovação proativa (intervalo 60s + `visibilitychange` — aba suspensa não
  depende de timer); logout propaga às outras abas por `storage`.
- **Envs**: `JWT_ACCESS_EXPIRES_IN` (prod: 1h) / `JWT_REFRESH_EXPIRES_IN`
  (30d) / `AUTH_SESSION_MAX_AGE` (90d) / `AUTH_COOKIE_SAME_SITE`, com
  fallback nos nomes legados.
- **Higiene de segredos**: cookie jars do e2e saíram do repo (um refresh
  token REAL de admin chegou a ser commitado — as 49 sessões do usuário
  foram revogadas na produção em 02/08); senhas do e2e só por env. O
  histórico do git ainda contém o token revogado e a senha antiga — purgar
  exige push forçado, que a política da spec proíbe; fica registrado como
  pendência autorizável (recomendada a rotação da senha do admin).
- Testes: 11 unitários com relógio controlado (rotação, corrida, reuso,
  teto, unidades) + e2e com corrida SIMULTÂNEA real e reuso recusado.

### Conversas de agentes completas + kanban + widget

- `Integrações → Conversas` (`/integracoes/agentes/conversas`, admin ou
  setor crm): lista com contadores por etapa, não-lidas, filtros e busca;
  thread com separadores de dia, anexos (upload multipart repassado à
  plataforma, campo `file`; download por proxy autenticado com fallback de
  thumbnail), áudio gravado no navegador (MediaRecorder) com player e
  waveform; ações concluir/reabrir/cancelar com a semântica da origem;
  painel de contexto com prioridade/etiquetas/responsável (campos LOCAIS —
  a plataforma remota não os tem; verificado no código da origem) e vínculo
  com cliente do CRM.
- `…/conversas/kanban`: as 8 etapas da origem, arrastar-e-soltar otimista
  com rollback; mover espelha o status na plataforma via
  `PATCH /issues/:id` best-effort (mesmo contrato da origem); toque/teclado
  movem pelo menu do card.
- **Widget flutuante** no Shell (porte do teams-widget do crm-aplopes, sem
  MUI/iframe): FAB arrastável, badge de não-lidas, lista/chat/nova,
  posição e última conversa persistidas; a conversa nasce com o contexto da
  tela (rota + filtros da URL — nada além do que o usuário já vê).
- **Tempo real**: SSE in-process com heartbeat 25s (mesmo desenho e mesmos
  limites da origem: não sobrevive a restart nem escala horizontal; o
  cliente cai para polling) + location dedicado no nginx sem buffering.

### Menu de Integrações

"Fontes de dados" acendia em toda rota `/integracoes/*` (comparação pelo 1º
segmento). O menu agora nasce de `lib/menu.ts` (estrutura tipada única) com
UM matcher: casa por segmento inteiro e o href mais específico vence — um
ativo por vez, sempre o certo.

### Fidelidade ao hub original (reconstrução do territorial)

O módulo foi reescrito com o hub.aplopes.com como régua, a partir de
auditoria do código-fonte da origem (não de screenshot). Tokens do tema do
hub num escopo próprio (`.tio` em `territorial.css`, claro E escuro,
seguindo o `data-tema` do FebraHub), sem tocar no design system do resto do
painel. Matriz de equivalência (original → migrado):

| Original | Migrado | Diferença que havia | Correção |
|---|---|---|---|
| `FilterPanel` (9 seções) | `FiltrosTerritorial` | só 5 grupos, sem colapso, sem faturamento/funcionários/abertura/conexões/views | 9 seções colapsáveis com os títulos literais, tri-state Todos→Sim→Não, faixas com debounce 400ms, visualizações salvas (localStorage, máx 8), rodapé Limpar+Compartilhar |
| `Chip` do hub | `territorial/ui.tsx` | chip tinha fundo e texto na cor do nicho | **cor SÓ na borda** (`${cor}99`; selecionado = 2px sólida com padding compensado), check accent, contador tabular — a regra de ouro do original |
| `CompanyMap` | `MapaTerritorial` | sem legenda interativa, sem painel de camadas, sem modos de raio | legenda com Focus/ocultar por nicho, camadas (pontos/conexões/cluster/fronteiras), raio por faturamento/funcionários/relevância/uniforme, foco de conexões, tema claro/escuro com fallback silencioso por tema |
| `CompanyTable` | `TabelaEmpresas` | tabela manual de 8 colunas | @tanstack/react-table com as 17 colunas do original (ordem/larguras), sticky, menu Colunas, resize, paginação 10/25/50/100, cards no mobile |
| `CompanyDrawer` | `DrawerEmpresa` | faltavam fatos e ações | drawer 430px completo: fatos em 2 colunas, sócios com barra de participação, contatos com copiar, conexões clicáveis, Centralizar/Ver conexões/Ficha (JSON mascarado), "Não informado" em dado ausente |
| `KpiBar` (10 cards) | KPIs do `PainelTerritorial` | 8 KPIs sem ícone | os 10 cards do hub com ícone, hint e skeleton |
| `lib/url.ts` | `hooks/territorial.ts` | faltavam chaves rr/emin/emax/ps/of/ot/hw/cx/ct | todas adicionadas; as legadas seguem lidas (links antigos não quebram) |

Diferenças conscientes (documentadas): sem framer-motion (animações de
saída viram CSS), sem toasts (feedback por troca de ícone), sem números
animados nos KPIs, busca global mora no painel de filtros (o hub tinha
Header próprio; aqui o cabeçalho é do FebraHub). Os filtros de
faturamento/funcionários/abertura existem e funcionam MAS a carga real vem
zerada nesses campos (limitação do dado da origem, não da UI).
