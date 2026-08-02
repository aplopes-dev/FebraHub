# Migração: Supabase → PostgreSQL próprio

Feita em 01/08/2026. O sistema saiu de React+Vite+Supabase+Netlify para
Next.js + NestJS + PostgreSQL + MinIO, publicado em
**https://febracis.aplopes.com** (VPS 72.61.131.155, `/opt/febrahub`).

O projeto Supabase original **não foi apagado nem desativado** — ele continua
como está, e é a rede de segurança até a operação confirmar que o novo está
redondo.

---

## O que era e o que ficou

| | antes | agora |
|---|---|---|
| Front | React 19 + Vite, um arquivo de 5.160 linhas | Next.js 15 App Router, TypeScript, 103 arquivos |
| Back | não existia (o front falava com o PostgREST) | NestJS + Fastify + Prisma |
| Banco | Postgres do Supabase | Postgres 17.4 em container, sem porta publicada |
| Storage | Supabase Storage | MinIO, bucket privado |
| Auth | Supabase Auth (JWT em localStorage) | argon2id + JWT em cookie httpOnly, refresh rotativo |
| Permissão | RLS + `pode_ver()` dentro de cada view | `SetorGuard` + catálogo de views na API |
| ETLs | PostgREST com a `service_role` | `POST /api/ingest/*` com token de máquina |
| Deploy | Netlify | Docker Compose + Nginx do host + Certbot |

---

## Inventário da migração

| funcionalidade | dependia de | virou | risco | como foi testado |
|---|---|---|---|---|
| Login | `supabase.auth.signInWithPassword` | `POST /api/auth/entrar` | senha não veio junto (ver abaixo) | E2E: senha certa, errada e usuário inexistente |
| Sessão | JWT em localStorage | cookie `httpOnly` + `secure` | — | E2E: `/auth/eu`, refresh, 401 sem cookie |
| Perfil e setor | `perfis` + `perfil_setores` | `usuarios` + `usuario_setores` | — | seed + login dos 7 usuários |
| Acesso por setor | RLS via `pode_ver()` nas views | `SetorGuard` + `catalogo.ts` | comportamento **mudou para melhor**: 403 em vez de lista vazia | E2E: comercial × financeiro |
| Leitura dos hubs | 57 views via PostgREST | `GET /api/dados/:nome` | 101 views são snapshot (ver abaixo) | contagem e soma conferidas com a origem |
| Escrita (avaliação, maestro, retenção) | `supabase.from().insert()` com policy | `POST /api/pedagogico/*` | — | E2E: cria, edita, lê de volta, e 403 para quem não é do setor |
| Upload | Supabase Storage | MinIO via `StorageService` | — | E2E: upload, URL assinada, download, exclusão |
| ETLs (11 scripts) | PostgREST + `service_role` | `/api/ingest` + token de máquina | — | testes de fumaça contra stub e Postgres real |
| Paginação de 1000 | `buscarTudo` no front | some: a API devolve tudo | — | E2E confirma > 1.000 linhas em uma resposta |

---

## Números conferidos

O export trouxe **414.772 linhas** em 43 tabelas e **204.288** nas 109 views,
com a contagem batendo com o `count(*)` da origem em **todas**. Depois de
importado, conferido de novo pela API publicada:

| | Supabase | FebraHub |
|---|---|---|
| Receita de cursos | R$ 87.657.297,28 | R$ 87.657.297,28 |
| Leads | 66.394 | 66.394 |
| Alunos | 13.738 | 13.738 |
| Matrículas | 20.100 | 20.100 |
| Ingressos de evento | 3.862 | 3.862 |
| Taxa efetiva de cartão | 3,10% | 3,10% |

---

## Duas armadilhas que custaram um ciclo cada

**1. O PostgREST corta em 1.000 linhas sem avisar.** É a mesma armadilha que o
`dados.js` já documentava, e ela pegou o exportador: pedir um `Range` maior não
levanta o teto do projeto — só faz o lote voltar menor que o pedido, o que
parece "acabou" e não é. O primeiro export trouxe 1.000 linhas de cada tabela
grande e passou como se estivesse completo. O manifesto compara com o
`count(*)` exatamente para isso não passar de novo.

**2. `pode_ver()` lê `auth.uid()`, e a service_role não tem uid.** Toda view
carrega `where public.pode_ver('<setor>')`. A service_role ignora RLS, mas não
tem usuário: `meu_setor()` volta NULL, `pode_ver()` volta false, e a view
devolve **zero linha sem erro nenhum**. 76 das 109 views vieram vazias no
primeiro export. A saída foi um segundo passe autenticado como a usuária admin,
via `generate_link` + `verify` — que não troca senha, não invalida sessão e não
dispara e-mail.

---

## O que ficou pendente, e por quê

### As senhas não vieram (e não tinha como vir)

A Admin API do Supabase (`GET /auth/v1/admin/users`) devolve id, e-mail, datas
e metadata, mas **não devolve `encrypted_password`**. Não existe caminho
suportado para exportar o hash.

Os 6 usuários foram recriados com **senha temporária aleatória** e
`precisa_trocar_senha = true`. As senhas foram exibidas uma única vez, no
stdout do seed, e precisam ser entregues pessoalmente. Na primeira entrada cada
pessoa troca a sua.

A alternativa — uma senha padrão igual para todo mundo — vaza no primeiro print
de tela e continua valendo meses depois.

### 101 das 109 views são snapshot, não view viva

Só 12 das 109 views estavam versionadas (migrations 05 e 06). As outras foram
criadas direto no SQL Editor do Supabase, e o Data API **não devolve a
definição delas**: `tools/migracao/sondar_ddl.py` registra todas as tentativas
— apenas `public` e `graphql_public` expostos, nenhum RPC de SQL, pg_graphql
desabilitado.

O que veio foi o **resultado** de cada view, carregado em `snapshot.*`. As
views em `public` que ainda espelham esse snapshot **mostram o dado real do dia
da migração, mas não recomputam** quando os ETLs trouxerem dado novo.

`GET /api/health` reporta quantas estão nesse estado, em `views_congeladas`.
Hoje: **101 congeladas, 8 vivas**.

**Oito foram reconstruídas** a partir do DDL versionado e validadas contra o
snapshot, linha a linha e em valor:

- `vw_comercial_funil` (566 linhas, bate)
- `vw_eventos_desempenho` (79 linhas, 3.862 ingressos, R$ 149.658,42 — bate)
- `vw_diretoria_consolidado` (77 linhas, R$ 87.657.297,28 — bate)
- `vw_financeiro_mdr` (187 linhas, 3,10% — bate)
- `vw_financeiro_perdas_cartao` (55 linhas, bate)
- `vw_financeiro_liquido_por_curso` (35 linhas, bate)
- `vw_financeiro_caixa_horizonte` (reconstruída do DDL)
- `vw_financeiro_receita` (sem gabarito: é a única que o export não trouxe, por
  timeout; conferida pelo total por unidade fechar com a diretoria)

**Uma foi rejeitada:** `vw_financeiro_inadimplencia` reconstruída dá 187 linhas
contra 27 do snapshot — a view em produção evoluiu depois da migration 05. O
SQL fica comentado em `apps/api/prisma/sql/views_reconstruidas.sql` com o
motivo, e ela segue como espelho. **Reconstrução que não bate com o gabarito
não entra.**

`vw_eventos_desempenho` ganhou CTEs no caminho: participantes e pedidos no
mesmo `FROM` produzem fan-out, e foi assim que a taxa do Sympla já apareceu
como R$ 887 mil em vez de R$ 17 mil.

**Para destravar as 101 restantes** é preciso o SQL delas. Ele existe em um
lugar só: o histórico do SQL Editor do projeto Supabase, acessível pelo
dashboard de quem tem a conta. Com esse SQL em mãos, cada view entra pelo mesmo
caminho das oito: reescreve sobre as tabelas base, valida contra
`snapshot.<nome>`, e só substitui se bater.

### Fila conhecida (herdada, não introduzida aqui)

`docs/DIVIDAS.md` continua valendo: 15% dos pagamentos sem status, R$ 241.560
sem data de pagamento, `dim_leads.data_criacao` 100% NULL, e a ponte CisPay →
venda que deixou de ser criada. A migração preservou os dados como estavam —
inclusive os buracos, que continuam aparecendo na tela como cobertura.

---

## Celular

O painel foi desenhado para TV e mouse. A adaptação para celular (02/08/2026)
mexeu em **espaço e densidade, nunca em conteúdo**: nenhum número, alerta ou
aviso de cobertura some no mobile — é justamente no celular que o painel é
olhado fora do escritório.

- **Sidebar vira gaveta** abaixo de 1100px, com barra superior e hambúrguer.
  250px fixos numa tela de 375px deixariam 125px para o painel. A gaveta fecha
  por backdrop, Esc e ao navegar, trava o scroll de fundo e sai da ordem de
  leitura (`aria-hidden`) quando fechada.
- **Escala por variável CSS** em 4 faixas (base / 600 / 900 / 1100), num lugar
  só em vez de espalhada por 100 arquivos de inline style.
- **Alvo de toque de 40px e piso de fonte de 10.5px**, só abaixo de 900px. No
  desktop o ponteiro é preciso e 27px é o desenho original.

Duas correções que só apareceram medindo:

1. `grid-template-columns: 1fr` resolve para `minmax(auto, 1fr)`, e o mínimo
   `auto` é o tamanho do **conteúdo**: um gráfico largo esticava a coluna e
   levava o card inteiro para fora da tela. Todos os grids passaram a
   `minmax(0, 1fr)`.
2. O gráfico escala por `viewBox`, então o texto de dentro encolhe junto — um
   rótulo de 10px virava **4,4px** em 390px de tela. Agora o SVG mantém 560px
   dentro de um wrapper que rola: 7,8px, legível.

E uma terceira, que a auditoria em produção revelou e não era de layout:
**o rate limit contava por IP**. Cada hub pede de 9 a 16 views de uma vez, e no
escritório todos saem pelo mesmo IP com NAT — seis pessoas dividiam uma cota de
300/min, e duas trocando de aba juntas já recebiam 429 com a tela meio
carregada. A contagem passou a ser por sessão (`LimiteGuard`); quem não tem
sessão segue contado por IP, que é onde mora a força bruta de login.

### Como conferir

```bash
# 8 hubs × 5 tamanhos de tela, medindo estouro de largura, alvo de toque e
# tamanho de fonte. Roda contra o ambiente publicado.
node infra/scripts/audita-responsivo.js https://febracis.aplopes.com
```

---

## Operação

```bash
# na VPS
cd /opt/febrahub/app
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api

# deploy de uma versão nova (faz backup antes, espera health entre etapas)
/opt/febrahub/scripts/deploy.sh

# backup manual (o cron roda 03:15 todo dia, retenção de 30 dias)
/opt/febrahub/scripts/backup.sh

# suíte de aceitação contra o ambiente publicado
SENHA_ADMIN=... SENHA_QA=... infra/scripts/e2e.sh
```

### Rollback

1. `docker compose -f docker-compose.prod.yml stop api web`
2. `cd /opt/febrahub/app && git checkout <commit-anterior>`
3. `docker compose -f docker-compose.prod.yml build api web`
4. `docker compose -f docker-compose.prod.yml up -d api web`

Os volumes **não** são tocados: `febrahub_postgres_dados` e
`febrahub_minio_dados` sobrevivem a qualquer troca de imagem. Para voltar
também os dados, restaure o dump de `/opt/febrahub/backups/postgres/`.

Nunca rode `docker compose down -v` aqui — o `-v` apaga o banco e o bucket.

E, enquanto o projeto Supabase original estiver de pé, o rollback definitivo é
apontar o DNS de volta para o Netlify.
