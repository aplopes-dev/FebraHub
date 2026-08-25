# Workspace memory (AGENTS.md)
Contexto persistente e autoritativo deste workspace. Siga e mantenha atualizado (conciso, alto-sinal).

## 🐴 REGRA #1 — RODE TUDO DE DEV NA IdeaPad, NÃO NESTE WORKSPACE
Este workspace NÃO roda dev. **TUDO** — `pnpm install`, `tsc`, `nest build`, `next build`, ESLint, `prisma generate`/`migrate`, testes, e2e, rodar a app, scripts — roda na **Lenovo IdeaPad** (nosso "burro de carga"). Não builde/tsc/lint localmente aqui (lento, sem toolchain, polui o ambiente).
- **Acesso:** `sshpass -p 'root' ssh -p 2222 root@172.17.0.1` (é `172.17.0.1`, NÃO `172.26.0.1`). Node22 / pnpm10 / tsc / psql prontos.
- **Fluxo:** `git pull` na IdeaPad → rodar build/tsc/lint/testes lá → trazer só o resultado (erros, exit code).
- **Instalar deps:** `pnpm install --no-frozen-lockfile` na RAIZ do monorepo (NUNCA `npm install` em apps/api — puxa fastify 5.12 e gera erros falsos em main.ts; pinado é 5.10.0). Ao adicionar dep, regenerar lockfile: `pnpm install --lockfile-only` (senão `--frozen-lockfile` do Dockerfile quebra).
- **Build:** api `cd apps/api && npx --no-install prisma generate && npx --no-install nest build`; web `cd apps/web && npx --no-install next build`.
- GOTCHA: `*/` dentro de comentário JSDoc fecha o bloco; `jsonSeguro()` mantém tipo Decimal no TS mas vira string em runtime (use `as unknown as` ao castar).
- Exceção: o deploy no HOMOLOG (66) builda a imagem Docker no próprio box da 66 — isso é o deploy, não o loop de dev.

## FebraHub — stack (pnpm monorepo)
- **`apps/api/`** — NestJS + Prisma (Postgres `febrahub`). Módulos em `apps/api/src/modules/`. Schema `prisma/schema.prisma`; migrations `prisma/migrations/0000000000NN_*`. Storage MinIO. Auth por sessão JWT (cookie `fh_acesso`, guard só valida o JWT, não DB). Permissões via `PerfilAcesso`/`PerfilSetor` + `modules/permissoes/catalogo.ts` + `perfis-padrao.ts`.
- **`apps/web/`** — Next.js App Router. Rotas `src/app/(app)/<hub>/` (autenticadas) e públicas na raiz (`/cardapio/[slug]`, `/painel/[slug]`, `/pedido/[id]`). Componentes `src/components/`, API clients `src/services/api/`, types `src/types/`, menu `src/lib/menu.ts`. Tailwind + CSS por feature em `src/app/*.css`.
- **`web/`** LEGACY Vite+Supabase — NÃO usar. **`db/`** = SQL migrations (01..90) das views `vw_*`. Migrations Prisma pressupõem tabelas de negócio (`fato_*`/`dim_*`/`mv_*`/`stg_*`) já existentes (vêm do dump Supabase, NÃO das migrations).

## ⚠️ TOPOLOGIA prod vs homolog (fácil confundir)
- **HOMOLOG** = `febracis-hom.aplopes.com` → VPS **`31.97.166.66`** (`/root/FebraHub`, branch `homolog`, remote `github.com/aplopes-dev/FebraHub`). Containers `febrahub_web`:3260 / `febrahub_api`:3261. É AQUI que trabalhamos e deployamos. Nginx `sites-enabled/febracis-hom.*.conf` → 127.0.0.1:3260/3261. root pw `1952aplA++++`. gh logado como Mr-nascimento.
- **PROD (público real)** = `febracis.aplopes.com` → **OUTRA VPS `72.61.131.155`** (Ubuntu). Repo `/opt/febrahub/app`, env `/opt/febrahub/etl.env`, branch `fix/auth-hub-conversations-ui`, remote **`github.com/mkdevelop3r/FebraHub`** (FORK diferente!), DB desatualizado (~migration 20). Postgres pw `DSBJj386J2LGnngpOR7Ws0Dg22FAJoo`. Acesso via jump pela 66: `ssh root@72.61.131.155` (SEM senha, chave autorizada). Deploy em prod é ALTO RISCO — só com aprovação explícita + backup.
- Nginx da 66 tem conf órfã `febracis.aplopes.com.conf` → :3120 (vazio) — ignorar; o prod real é a 155.

## Deploy no homolog (66)
`cd /root/FebraHub && git pull origin homolog && docker compose -f docker-compose.prod.yml build api web && docker compose -f docker-compose.prod.yml run --rm --no-deps --entrypoint sh api -c "npx prisma migrate deploy" && docker compose -f docker-compose.prod.yml up -d api web`. Imagens buildadas LOCALMENTE (não ghcr). Web build no box carregado leva ~20-30min (mostra "Retrying 1/3" às vezes, recupera sozinho). CMD do api = `node dist/main.js` (migrations rodam no passo `run` acima, cwd `/app/apps/api`).
NUNCA commitar: `supabase/*.dump`, `CREDENCIAIS_SEED.txt`, `*.bak.*`.

## Como montar e2e / dados reais no homolog
- prod→homolog: `pg_dump -U febrahub -Fc` na 155 → relay via scp (jump 66) → backup do homolog → DROP/CREATE schema public → `pg_restore` (ignora ~111 erros de schemas extras, ok) → `migrate deploy` reaplica as faltantes. Parar api/web durante o restore. Backup do homolog em `/tmp/homolog_backup.dump` (66); dump de prod em `/tmp/prod_febrahub.dump`.
- e2e API standalone na IdeaPad: dump schema-only de prod → `migrate deploy` → `node dist/main.js` com env dummy (JWT 32+ chars, MinIO local); auth via JWT Bearer assinado com JWT_ACCESS_SECRET + `tipo:'acesso'`.

## LOJA FEBRACIS — módulo loja-pedidos (COMPLETO, homologado, deployado)
`apps/api/src/modules/loja-pedidos/` + `loja-produtos/` + `pdv/` + `financeiro/`. Migrations 30-38. Fluxo: cardápio→checkout(reserva estoque)→PIX/cartão→confirmar→fila→preparo→pronto→retirada. PDV/balcão na mesma fila com split de pagamento. Estoque LOJA/DEPOSITO (CHECK `loja_estoque_reservado_ok`: reservado<=saldo_fisico). Anti-oversell via advisory lock por produto. Financeiro: venda→`financeiro_lancamentos` origem=pdv + rateio. Auditoria (`loja_auditoria`). Crons (@Interval): expiração de reserva + lembrete de pronto. WhatsApp proativo best-effort. SSE público `loja-pedidos/publico/eventos` + polling fallback.
- **Pagamentos**: arquitetura `PaymentProvider` (`pagamentos/`). AsaasProvider (PIX QR + cartão tokenizado). ManualProvider (fallback dev). Webhook `POST loja-pedidos/publico/webhook/asaas` (header `asaas-access-token`==`ASAAS_WEBHOOK_TOKEN`, idempotente). Envs: `ASAAS_API_KEY`, `ASAAS_BASE_URL`, `ASAAS_WEBHOOK_TOKEN`, `LOJA_RESERVA_EXPIRA_MIN`, `LOJA_LEMBRETE_PRONTO_MIN` (falta configurar em prod). Stone/Pagar.me NÃO implementado (arquitetura pronta).
- **Web**: telas `(app)/loja/{dashboard,fila,balcao,operacoes,auditoria,produtos,cardapio,tv}` + públicas. QR do cardápio (`operacoes/:slug/qrcode` + QrCardapioModal). Permissões `loja.pedidos.ver|operar|gerenciar`.
- **PDV oficial = /loja/balcao**. O antigo grupo de menu "PDV" (`/pdv`, ResumoPdv) foi REMOVIDO do menu (páginas /pdv/* seguem no disco). Balcão gera `LojaPedido` (não `PdvVenda`). Shell tela-cheia: `Shell.tsx paginaCheia = caminho.startsWith("/loja/balcao")` → oculta `fh-page-topo`, usa `.fh-main-cheia`. Para outra rota tela-cheia, incluir em `paginaCheia`.
- **BalcaoPdv.tsx** + `app/balcao.css`: layout caixa (header, busca c/ scanner, chips categoria, grid de cards c/ badge de estoque, carrinho rico, seletor Dinheiro/Cartão/PIX, split, atalhos F# estilo Omie no rodapé). `types/pdv.ts PdvProduto` estendido: categoria/imagemUrl/precisaPreparacao/controlaEstoque (endpoint /pdv/produtos já retorna).

## Estoque DEPÓSITO — apostilas/materiais (planilha Salvador)
218 produtos DEPÓSITO importados (categorias `Apostilas` 37 + `Materiais (Depósito)` 181). São `LojaProduto` com **vendePdv=false, exibeCardapio=false, controlaEstoque=true, preco=0** → NÃO aparecem no PDV/Cardápio. Saldo só em `loja_estoque_saldos local=DEPOSITO` (LOJA=0). NÃO misturar com produtos da LOJA. Script idempotente: `apps/api/scripts/importar-estoque-deposito.mjs` + `estoque-deposito-apostilas.json`. Rodar no container: copiar p/ `/app/apps/api/node_modules/.import-dep.mjs` (node_modules é o único dir writable; ESM resolve @prisma/client de lá) e `node node_modules/.import-dep.mjs <json> [--commit]` com cwd `/app/apps/api`.

## Módulo Fornecedores (Compras) — DEPLOYADO homolog
`apps/api/src/modules/fornecedores/` (CRUD, situação, histórico, picker) sob `compras.ver`/`compras.operar`. Models `Fornecedor`+`FornecedorContato` (migration 34). `compra_cotacoes`/`compra_pedidos` ganharam `fornecedor_id` opcional (SET NULL). Web `/compras/fornecedores` + seletor no form de cotação (DetalheCompra.tsx).

## Imagens de produtos da Loja (homolog) — MinIO
8 produtos-demo vendáveis (SKUs `DEMO-*`, idempotente). Imagens no MinIO bucket `febrahub` prefixo `loja/produtos/*.jpg`. GOTCHA: bucket é private; prefixo `loja/` foi tornado leitura anônima: `docker exec febrahub_minio mc anonymous set download local/febrahub/loja`. URLs públicas: `https://febracis-hom.aplopes.com/febrahub/loja/produtos/<f>.jpg`. `mc alias set local http://127.0.0.1:9000 <ACCESS_KEY> <SECRET_KEY>` (creds em `docker exec febrahub_api printenv | grep MINIO`). Operação ativa: `CIS Externo — Ago/2026` (slug cis-externo).

## Módulo FISCAL — NFC-e (mod 65) + cupom não fiscal — DEPLOYADO homolog
Portado de `_citybox_src/services/fiscal-api` para DENTRO da `apps/api` (não microserviço). Doc: `apps/api/FISCAL.md`. Emite a partir de `PdvVenda` (fluxo /pdv/caixa); Balcão (LojaPedido) exigiria adaptar o emitter (pendente). BA delega NFC-e ao SVRS.
- **Backend** `apps/api/src/modules/fiscal/`: cripto.ts (AES-256-GCM, env `FISCAL_CERT_ENCRYPTION_KEY`), certificado.ts (pkcs12 node-forge), fiscal-config.service.ts (singleton id=1, cert A1→MinIO cifrado, CSC), comprovante.ts (HTML bobina 80mm/A4), fiscal.service.ts (não fiscal), fiscal-nfce.service.ts (venda→XML mod65→assina→QR/CSC→XSD→SVRS→protocolo, numeração sob advisory lock + idempotência), fiscal.controller.ts (`/fiscal/*`), nfce/ (xml-builder, signer xml-crypto, qr-code, soap mTLS, xsd-validator libxmljs2).
- **Schema**: 5 models (FiscalConfig, FiscalCertificado, FiscalSequencia, FiscalDocumento, FiscalEvento) + migration `39_fiscal`. Perms `fiscal.emitir`/`fiscal.gerenciar`.
- **Deps novas**: node-forge, xml-crypto, xmlbuilder2, `libxmljs2` (NATIVO), @types/node-forge.
- **GOTCHA CRÍTICO libxmljs2 no Docker (Alpine/Node22)**: prebuild NÃO cobre node-v127/musl e `pnpm rebuild` vira NO-OP → boot morre no xsd-validator. Solução no `apps/api/Dockerfile` (estágio prod-deps): `RUN LIB="$(find /app/node_modules/.pnpm -type f -name binding.gyp -path '*libxmljs2*' | head -1 | xargs -r dirname)" && cd "$LIB" && npx node-gyp rebuild` (o pacote fica profundo em .pnpm/…; toolchain python3/make/g++ já no estágio; ~147s). Dockerfile também COPIA `resources/` (xsd/wsdl/ca) p/ runtime.
- **Resources** `apps/api/resources/{xsd/nfe,wsdl/nfe,ca}`: **`ca/icp-brasil.pem` NÃO existe** (só README) — precisa antes de transmitir de verdade (senão TLS UNABLE_TO_GET_ISSUER_CERT). Resolvidos via `process.cwd()` = /app/apps/api.
- **Frontend**: `services/api/fiscal.ts`, `components/fiscal/PainelFiscal.tsx`, página `(app)/configuracoes/fiscal/page.tsx`, item no menu.ts. Botões "Comprovante" e "Cupom fiscal" em `components/pdv/VendasPdv.tsx`.
- **Pendências p/ produção**: `FISCAL_CERT_ENCRYPTION_KEY` no env; cert A1 real + credenciamento NFC-e + CSC (Vitor/contador); URLs `NFCE_QRCODE_URL_BA_HOMOLOGATION`/`NFCE_CHAVE_URL_BA_HOMOLOGATION` (sem default, placeholders no FISCAL.md a confirmar; urlChave ≤85 chars); mapear NCM/CFOP por produto (hoje default 00000000/5102, CST 00/CSOSN 102); ligar cancelamento (infra pronta, falta wire). Sem config, cupom NÃO fiscal já funciona; NFC-e mostra pendências na tela.

## Busca Global (Spotlight) — `Ctrl+K`/`⌘K`
Modal spotlight + botão "Buscar…" no header. `apps/web/src/lib/acoes-catalogo.ts` (catálogo de ações tipadas por módulo; `buscarAcoes(q, ctx)` normaliza NFD; **nova função → adicionar aqui no grupo** e aparece na busca). `components/shell/BuscaGlobal.tsx` (busca menus + ações, dedup por href, `useBuscaGlobal()` hook + `BotaoBuscaGlobal`). `app/busca-global.css` importado em layout.tsx. Shell.tsx renderiza os dois.

## Telas públicas redesenhadas
- **Cardápio** (`/cardapio/[slug]`, `components/loja/CardapioPublico.tsx` + `app/cardapio.css` escopo `.cdp`): storefront responsivo, tema ESCURO fixo (de propósito — vitrine igual em qualquer aparelho). Hero, nav de categorias com scroll-spy, grid 1→2→3 col, carrinho sidebar (desktop)/barra flutuante (mobile), checkout/PIX em sheet. Lógica de checkout/pagamento preservada.
- **Painel/TV** (`/painel/[slug]`, `components/loja/PainelTv.tsx` + `app/painel.css` escopo `.tv`): estilo QSR (McDonald's), tema escuro fixo, `clamp()`/vw p/ 1080p→4K. Duas colunas: `.tv-col.preparando` | `.tv-col.pronto` (verde). Relógio ao vivo; senha recém-pronta ganha `.novo` (pulsa 20s). Dados via SSE `useLojaPedidosStream` + polling 4s preservados. O bloco `.tv-*` em fila.css virou dead code (deixado intacto).
- GOTCHA de preview: o browser das tools é remoto (proxy) — NÃO alcança `127.0.0.1` do workspace nem aceita data: URLs. Confie no tsc/lint + inspeção do CSS/markup.

## UI — padronização de botão dourado (contraste no tema claro) ⚠️ REGRA CORRETA
`--gold` MUDA por tema: no ESCURO é dourado-claro (#E4C06A), no CLARO é MARROM ESCURO (#8A6A1E). Por isso **NÃO usar `var(--gold)` como FUNDO de botão** — no claro fica marrom-escuro e o texto escuro `--sobre-ouro` (#100c04) por cima fica ILEGÍVEL (~2:1). `--gold` só serve p/ TEXTO/ícone/borda.
**REGRA:** o FUNDO do botão dourado é o gradiente **`linear-gradient(180deg,var(--gold-top),var(--gold-base))`** (#F2D488→#B8934A) — esses tokens são FIXOS e claros nos 2 temas (identidade do produto) e dão alto contraste com texto `var(--sobre-ouro)` no claro E no escuro. Tints translúcidos `rgb(var(--gold-rgb)/.xx)` levam texto `var(--gold)` (é fundo de página, ok).
- Helper: **`.fh-btn-ouro`** em `globals.css` (fundo = gradiente gold-top→base + color/svg sobre-ouro). Todos os `.ouro`/badges migrados p/ o gradiente: `.loja-btn.ouro`/`.pdv-btn.ouro`/`.fin-btn.ouro`/`.bal-mbtn.ouro`/`.loja-chip.ativo`/`.bal-add`/`.bal-forma.on`/`.bal-desc-tipo button.on`/`.co-primary-link`(compras-mvp+fornecedores)/`.co-cotacoes button`/`.co-stepper .feito i`/`.es-hero>a`/`.es-aviso-btn`/`.fila-coluna>header span`; TSX `Historia.tsx` + `SinoNotificacoes.tsx` badges (gradiente inline). O botão "Novo produto" da Loja é `.loja-btn.ouro` (em `CatalogoLoja.tsx`).
- Tokens em `lib/tema.ts`: `C.gold`, `SOBRE_OURO`, `C.goldTop/goldBase`. Tema em `globals.css`: `:root` claro / `:root[data-tema="escuro"]` / `@media(prefers-color-scheme:dark)`. Cada cor publica `--x` e `--x-rgb`. `alfa()` monta `rgb(var(--x-rgb)/α)`.

## Loja — upload de imagem de produto com remoção de fundo (homolog, deployado via push)
No modal "Editar/Novo produto" (`apps/web/src/components/loja/CatalogoLoja.tsx` → componente `UploaderImagem`) o operador envia a foto e o fundo é removido **no navegador** por `@imgly/background-removal` (WASM/ONNX, `import()` dinâmico → só baixa o modelo quando usado; se falhar, envia a imagem original). Toggle "Remover fundo" (ligado por padrão). Resultado é PNG transparente enviado à API.
- **API**: `POST /loja/produtos/imagem` (multipart `arquivo`, perm `loja.produtos.gerenciar`) em `loja-produtos.controller.ts`/`.service.ts` (`enviarImagem`). Valida PNG/JPG/WEBP, sobe pro MinIO prefixo público `loja/produtos/` sob UUID, devolve `{ url }` público que vai em `imagemUrl`.
- **StorageService** ganhou `urlObjetoPublico(chave)` (`${MINIO_PUBLIC_URL}/${bucket}/${chave}`, encodeURIComponent por segmento; null se sem MINIO_PUBLIC_URL) e `garantirPrefixoPublico(prefixo)` (idempotente: lê/edita bucket policy p/ `s3:GetObject` anônimo). Ambos chamados no upload.
- Client fn `lojaEnviarImagemProduto(blob, nome)` usa `api.enviarArquivo`. CSS `.loja-uploader*` em `app/loja.css`. GOTCHA: `MINIO_PUBLIC_URL` precisa estar setado no env da 66 p/ a URL pública abrir; senão cai p/ URL assinada 1h (não persiste bem em imagemUrl).

## Módulo Comercial (implementado)

### Arquivos criados
- `apps/web/src/services/api/comercial.ts` — client completo para `/comercial/*` usando `api.*` do client padrão
- `apps/web/src/app/comercial.css` — estilos com escopo `.com-*` (KPI cards, kanban board, timeline, badges, tabela, formulário)
- `apps/web/src/app/(app)/comercial/page.tsx` — Dashboard com KPIs + Minha Operação + atalhos
- `apps/web/src/app/(app)/comercial/pipeline/page.tsx` — Kanban/Lista com toggle, funis, busca, paginação
- `apps/web/src/app/(app)/comercial/oportunidades/[id]/page.tsx` — Detalhe 360°: header, infos, timeline, ações, negociação (accordion), venda
- `apps/web/src/app/(app)/comercial/vendas/page.tsx` — Lista com filtros (status comercial/financeiro/turma), paginação
- `apps/web/src/app/(app)/comercial/leads/page.tsx` — Formulário de captura rápida, deduplicação

### Arquivos modificados
- `apps/web/src/lib/menu.ts` — grupo `comercial-hub` com 4 filhos adicionado antes de `financeiro-erp`; importou `TrendingUp` de lucide-react
- `apps/web/src/lib/acoes-catalogo.ts` — tipo `AcaoGrupo` + array `acoes_comercial` + `GRUPO_LABEL`; grupo `"comercial"` inserido no catálogo
- `apps/web/src/app/(app)/layout.tsx` — `import "@/app/comercial.css"` adicionado

### Permissões usadas
- `comercial.ver`, `comercial.operar`, `comercial.gerenciar`, `comercial.vendas.aprovar`, `comercial.relatorios`

### Padrões respeitados
- `api.get/post/patch` do client (cookie httpOnly, sem fetch direto)
- `GuardaPermissao` envolve cada página
- `useQuery` + `useMutation` do TanStack Query
- CSS variables do tema (`var(--gold)`, `var(--card)`, etc.) — sem hardcode de cor
- Valores em centavos formatados com `(v/100).toLocaleString('pt-BR', {style:'currency',...})`
- Params de rota dinâmica com `use(params)` (Next.js App Router pattern)
