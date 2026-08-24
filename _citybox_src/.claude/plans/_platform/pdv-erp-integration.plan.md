# PDV (Flutter) × ERP — Análise de estado e plano de integração

> Documento de análise técnica + roadmap. Não é um plano de implementação pronto
> para `/feature` — é o material de apoio para derivar planos por fase (cada
> fase da seção 8 deve virar seu próprio `/plan-prd` → `/plan` quando for
> priorizada). Escopo: como o **PDV Citybox em Flutter** (`apps/pdv/app`) se
> conecta ao **ERP** (`apps/erp/api` + `apps/erp/web`), com **operação offline**
> e sincronização.

**Data:** 2026-08-04
**Autor:** análise assistida (Claude Code), a pedido de Bruno Lopes
**Módulos cobertos:** `apps/pdv/app` (Flutter — o PDV real) · `apps/pdv/frontend` (PWA — legado, não é referência) · `apps/erp/api` · `apps/erp/web` · `apps/verticals/food/api` (achado relevante, ver §3.5)

---

## 1. Resumo executivo

O PDV Flutter (`apps/pdv/app`) hoje é **um esqueleto visual sem nenhuma
integração**: zero HTTP client, zero autenticação, zero persistência, zero
sincronização. Todas as telas (Balcão, Pagamento, Clientes) operam sobre
fixtures locais em memória. Isso não é dívida técnica escondida — está
documentado explicitamente no `AGENTS.md` do módulo e confirmado pelo
`pubspec.yaml`, que declara uma única dependência de runtime
(`flutter_riverpod`).

Do lado do ERP, a notícia é mista:

- **Existe uma base sólida para o que o PDV precisa ler**: catálogo de
  produtos, estoque com saldo por depósito, clientes (CRM), e desde
  2026-08-03 um módulo `sales` com `SaleOrder` (pedidos que aceitam múltiplos
  pagamentos e já baixam estoque ao fechar).
- **Não existe nada do que o PDV precisa para *operar***: sessão de caixa
  (abertura/sangria/suprimento/fechamento), cadastro/pareamento de terminal,
  catálogo de formas de pagamento, emissão fiscal (NFC-e/SAT), nem um endpoint
  de checkout pensado para o ritmo de um balcão (uma chamada, resposta rápida).
- **A tela "Ponto de venda" já existe no `erp-web`** (`/ponto-de-venda/cadastros`,
  `/caixas`, `/kds`) — mas é **100% mock**: nenhuma dessas telas tem módulo
  correspondente na API. É a UI de gestão que vai precisar do mesmo backend que
  o PDV Flutter vai consumir.
- **Achado mais importante da varredura**: o único endpoint do monorepo que já
  faz exatamente o que o Balcão do PDV precisa — `POST /v1/sales/quick` — existe
  na `food-api` (abre conta, lança pedido, fecha financeiramente, tudo numa
  chamada) mas **está órfão**. A `food-api` perdeu seu consumidor em
  2026-07-31 quando `food` e `varejo` foram fundidos em "Comércio" (`apps/erp`)
  — o próprio `AGENTS.md` da vertical registra que a Etapa 5 ("plugar o PDV")
  foi adiada e nunca aconteceu. Não é reaproveitável como está (schema `food`,
  vertical errada, API sem consumidor ativo), mas é a referência de forma mais
  próxima do que se precisa construir em `erp-api`.

Este documento mapeia o estado exato dos dois lados, o que existe no mercado
(ConnectPlug/Cplug como referência direta + padrões gerais de PDV offline-first),
e propõe a arquitetura de integração — autenticação, sincronização offline,
novos módulos de backend e um roadmap faseado.

---

## 2. Estado atual — `apps/pdv/app` (Flutter, o PDV real)

Fonte: `apps/pdv/app/AGENTS.md` (lido integralmente) + `pubspec.yaml` (lido).

### 2.1 O que existe

| Peça | Estado |
|---|---|
| Tema (`core/theme/`) | 🟢 único, escuro, tokens completos (cor/raio/espaçamento/tipografia/movimento) |
| Moldura da janela (`PdvScaffold`) | 🟢 barra de título própria no desktop (`window_manager`), app bar de conteúdo |
| Tela inicial (`features/home/`) | 🟢 grade de ações + coluna de apoio ao turno, atalhos de teclado, catálogo fixo de `HomeAction` |
| Balcão (`features/counter/`) | 🟢 visual completo: categorias, carrinho, totais, CPF/CNPJ, grade de produtos — **catálogo e carrinho 100% fixture** |
| Pagamento (`features/payment/`) | 🟢 visual completo: múltiplas formas de pagamento, teclado numérico, bandeira+parcelas, vendedor, observação, fechamento — **tudo local, nada vai para TEF/maquininha** |
| Clientes (`features/customer/`) | 🟢 busca + cadastro/edição — **fixture local**, sem backend |
| Módulos (`features/modules/`) | 🟢 liga/desliga funcionalidades — fonte única de "o que está ligado", mas o catálogo em si ainda é lista fixa |
| Navegação | 🟡 `Navigator.push` via `pushWithPageTitle` — `go_router` deliberadamente **não** instalado ainda |

### 2.2 O que não existe (por decisão de escopo, não esquecimento)

Autenticação, cliente HTTP, persistência local, sincronização offline,
leitura de código de barras, impressão, TEF/gaveta, emissão fiscal, sessão de
caixa real. A saúde de rede/Sefaz na barra de título é **fixture fixa em "tudo
ok"**.

### 2.3 Dependências declaradas (`pubspec.yaml`)

```yaml
dependencies:
  flutter_riverpod: ^2.6.1   # único pacote de runtime não-Flutter
  intl: ^0.20.2
  window_manager: ^0.5.2
  package_info_plus: ^10.2.1
```

Nenhum HTTP client (`dio`/`http`), nenhum banco local (`drift`/`sqflite`/`isar`),
nenhum `flutter_secure_storage`, nenhum `go_router` — todos citados apenas como
comentário de intenção no `pubspec.yaml`. Confirma exatamente o que o
`AGENTS.md` descreve.

### 2.4 O que o próprio `AGENTS.md` já antecipa (§6, "ao integrar com o backend")

Vale registrar porque parte está **desatualizada** (ver achado em 3.6):

- Keycloak, realm `citybox-dev`; "o realm não tem client de PDV — será preciso
  criar"; cita `citybox-backoffice` (confidencial, não serve para PKCE nativo)
  e `citybox-app` como "o público, com redirect `citybox://*`".
- `X-Organization-Id` obrigatório em toda rota de negócio da erp-api;
  `X-Branch-Id` opcional.
- Catálogo/estoque/clientes: `erp-api` :3114.
- **"Venda/comanda/checkout: hoje só existem na `food-api` :3171 [...] A
  erp-api não tem módulo de vendas."** — isso era verdade quando escrito, mas
  **não é mais**: a erp-api ganhou o módulo `sales` (`SaleOrder`) em
  2026-08-03, um dia antes da última edição registrada deste `AGENTS.md`
  (2026-08-04). O documento não foi atualizado com a mudança. Corrigir isso é
  o primeiro ajuste a fazer nesse arquivo quando a integração começar.

---

## 3. Estado atual — ERP (o que o PDV vai consumir)

### 3.1 `apps/erp/api` — módulos relevantes hoje

Fonte: `apps/erp/api/AGENTS.md` (lido integralmente, 1026 linhas).

| Módulo | Cobre | Maturidade |
|---|---|---|
| `tenancy` | Organizações, unidades (branches), membros, permissões por papel | 🟢 completo, 14 rotas |
| `catalog` | Produtos (por empresa, vínculo por unidade via `ProductBranch`), categorias, UoM, variações, listas de preço, parâmetros fiscais, fichas técnicas | 🟢 completo |
| `stock` | Depósitos, categorias de movimentação, ledger (movimentações/saldo), inventário, transferências, compras, fornecedores, transportadoras | 🟢 completo |
| `customers` | CRM de clientes + categorias, soft-delete/restore | 🟢 completo |
| `sales` | **`SaleOrder`** (linhas + pagamentos, fecha e baixa estoque idempotentemente) + submódulos finos (`service-orders`, `sales-contracts`, `promotions`) | 🟡 pensado para retaguarda, não para balcão (ver 4.1) |
| `finance` | Contas bancárias, lançamentos, centros de custo, grupos financeiros, plano de contas, **contratos de cartão + métodos de pagamento** (mas escopados ao contrato de cartão, não um catálogo geral) | 🟢 completo para o que cobre |

**O que não existe em `erp-api`, em nenhum módulo:** sessão de caixa/turno,
cadastro de terminal/PDV, catálogo genérico de formas de pagamento (dinheiro,
PIX, cartão, voucher — hoje só existe o conceito de "método de pagamento de um
contrato de cartão"), emissão fiscal (NFC-e/SAT/contingência), endpoint de
checkout rápido, device pairing/API key de terminal.

**Detalhe relevante do `SaleOrder`** (o que mais se aproxima de um checkout
hoje): aceita `payments?[]` na criação — **múltiplos pagamentos por venda já é
suportado estruturalmente** — e `status=closed` já dispara a baixa de estoque
e gera 1 `FinancialEntry` `receivable` na mesma transação. Isso é reaproveitável
como base do checkout do PDV, mas tem atrito para o ritmo de balcão: exige
`productId` real por linha (sem item avulso/livre), `quantity` como
decimal-string, `stockId` obrigatório quando há linha com controle de estoque,
e não tem noção de sessão de caixa nem de terminal — cada venda fica solta,
sem vínculo com "quem, em qual caixa, em qual turno".

### 3.2 `apps/erp/web` — módulo "Ponto de venda" (já existe, 100% mock)

Fonte: `apps/erp/web/AGENTS.md` (parcialmente lido — seção de navegação e
estrutura de pastas).

Rota `/ponto-de-venda` (grupo "Canais de Venda" no rail):

| Tela | Rota | O que tem hoje |
|---|---|---|
| **Cadastros** (terminais) | `/ponto-de-venda/cadastros` | Lista mock (`features/pos-registers`): nome, impressora, balança, status; diálogo "Novo PDV" com nome, status, **NFC-e contingência**, ponto de impressão, balança, **servidor offline**. Editar = toast "Em breve". Tudo em store local, sem API. |
| **Gerenciar Caixas** | `/ponto-de-venda/caixas` | Lista mock (`features/pos-cash-sessions`): filtros por PDV/vendedor/operador/período, drawer de vendas por sessão, "Valores de fechamento" (comprovante gerencial). Sem API. |
| **KDS** | `/ponto-de-venda/kds` | Lista mock de telas de expedição — **mas o vínculo de produtos usa o catálogo real** (`useCatalogProductsQuery`), então é parcialmente integrado. |
| Mesas, Comandas, Configurações (contingência, consignado, crediário, painel de senhas, recibos) | — | `PlaceholderPage` — nada implementado, nem mock rico. |

Isto é o achado mais acionável do levantamento: **o campo "Novo PDV" do
`erp-web` já modela, na UI, exatamente os campos que o PDV Flutter vai
precisar declarar de si mesmo no pareamento** (nome, contingência NFC-e,
impressora, balança, servidor offline). Construir o backend desse cadastro
serve os dois lados ao mesmo tempo — é o primeiro módulo de API a criar.

### 3.3 `apps/verticals/food/api` — achado crítico: checkout órfão

Fonte: `apps/verticals/food/AGENTS.md` (lido integralmente).

A `food-api` tem hoje o desenho mais completo de "venda de balcão" do
monorepo:

- **`Conta`** generaliza Comanda: `type` (`balcao|comanda|mesa|delivery|retirada`),
  `status`, pagamento, taxa de serviço, desconto, total **derivado** dos
  pedidos.
- **`POST /v1/sales/quick`** (`QuickSaleUseCase`) — "venda balcão relâmpago":
  abre uma Conta `balcao` já paga, lança o pedido, fecha financeiramente, tudo
  numa chamada. Body: `items[]`, `paymentMethod`, `discountCents?`,
  `customer?`. Item sem estação de cozinha nasce `completed` direto (nunca
  toca o KDS); item com estação vai para o KDS normalmente, mesmo com a conta
  já fechada financeiramente.
- Já resolve exatamente o problema de UX que um PDV de balcão tem: uma
  chamada, sem estado intermediário, sem exigir "abrir comanda → lançar item →
  fechar" como 3 round-trips.

**Mas**: desde 2026-07-31 esta API **não tem consumidor ativo**. O catálogo de
verticais do admin da plataforma passou a ter uma vertical por sistema —
`Food` e `Varejo` viraram `Comércio`, atendida por `apps/erp`. A `food-api`
ficou congelada de propósito ("não conserte trocando o filtro de vertical"). O
próprio `AGENTS.md` da vertical registra: *"Endpoint pronto no backend
aguardando o PDV ser plugado (Etapa 5, adiada). Sem consumidor no frontend por
ora."* — ou seja, este trabalho já foi cogitado e nunca veio a acontecer
porque o rearranjo das verticais (food+varejo → Comércio) mudou o alvo.

**Implicação prática:** não dá para simplesmente "ligar o PDV na food-api" —
seria integrar contra uma vertical fora do catálogo cadastrável, sem tenancy
compatível com `erp-api` (schema `food`, escopo `X-Store-Id`, não
`X-Organization-Id`+`X-Branch-Id`) e sem manutenção ativa. O valor da
`food-api` aqui é **de referência de design** — o padrão `Conta`/quick-sale é
a forma certa de pensar o checkout do PDV, só que implementado no lugar
errado. Recomendação: portar o *padrão*, não o código, para um novo submódulo
`sales/pdv-checkout` (ou equivalente) dentro de `erp-api`.

### 3.4 Autenticação — o que já existe no Keycloak

Fonte: `infra/keycloak/import/citybox-dev-realm.json` (grep confirmado).

O client `citybox-app` — citado no `AGENTS.md` do PDV como candidato a
reaproveitar — é na verdade **o client do app consumidor B2C** (`"name": "App
Consumidor"`), público, PKCE, redirect `citybox://*` e `https://app.citybox.com/*`.
É o padrão certo a copiar (client público, sem secret, `directAccessGrantsEnabled`
+ `standardFlowEnabled`), mas **não deve ser reaproveitado literalmente** — um
PDV de balcão não é o app consumidor, e misturar redirect schemes de dois apps
diferentes no mesmo client é uma fonte de bug de deep-link. Precisa de um
client novo e dedicado, ex. `citybox-pdv`, mesmo shape (`publicClient: true`,
PKCE S256), com seu próprio redirect (`citybox-pdv://*` mais loopback
`http://localhost:*`/`http://127.0.0.1:*` para o fluxo de desktop, que
tipicamente não usa custom scheme mas um servidor loopback efêmero).

> ⚠️ **Superado em 2026-08-06.** Este parágrafo descreve o desenho que foi
> descartado: o PDV **não usa Keycloak**. O Keycloak segue autenticando o
> gerente no `erp-web`; o terminal usa device token emitido pela `erp-api`, e o
> operador de caixa usa PIN contra `PosOperator`. Ver §D1/§D2 do PRD de
> autenticação.

Isso corrige e substitui a nota do `AGENTS.md` do PDV, que sugeria
"`citybox-app` é o público" como se já fosse o client a usar.

### 3.5 Resumo visual do gap

```
                    PDV Flutter                    ERP
                 (apps/pdv/app)              (apps/erp/api + web)

  Auth ──────────────  ❌ nada        ⇄        🟡 client Keycloak certo
                                                    não existe ainda
  Catálogo ──────────  ❌ fixture     ⇄        🟢 catalog completo
  Estoque ───────────  ❌ n/a         ⇄        🟢 stock completo (saldo)
  Clientes ──────────  ❌ fixture     ⇄        🟢 customers completo
  Checkout/Venda ────  ❌ fixture     ⇄        🟡 SaleOrder existe, não
                                                    pensado p/ balcão
  Sessão de caixa ───  ❌ n/a         ⇄        ❌ não existe
  Terminal/pareamento  ❌ n/a         ⇄        ❌ não existe (só UI mock)
  Forma de pagamento ─ ❌ fixture     ⇄        ❌ não existe catálogo geral
  Fiscal (NFC-e/SAT) ─ ❌ n/a         ⇄        ❌ não existe
  Persistência local ─ ❌ n/a         —        —
  Sincronização ─────  ❌ n/a         —        —
  Impressão/TEF/gaveta ❌ n/a         —        —
```

---

## 4. Lacunas por área (o que falta construir)

| Área | Falta no PDV (Flutter) | Falta no ERP (api/web) |
|---|---|---|
| **Autenticação** | Cliente Keycloak OIDC nativo (PKCE), armazenamento seguro de token (`flutter_secure_storage`), refresh, logout, seleção de empresa/unidade | Client `citybox-pdv` no realm; decidir se o PDV usa login por operador (PIN/senha curta, comum em PDV) sobre o mesmo `Membership`, ou login completo Keycloak por sessão de turno |
| **Pareamento de terminal** | Fluxo de "ativar este dispositivo" (código/QR gerado no `erp-web` → confirmado no app) | Módulo `pos-registers`: `CreatePosRegister`, emissão de credencial/token de dispositivo, vínculo unidade↔terminal |
| **Sessão de caixa (turno)** | Tela de abertura (valor inicial), sangria, suprimento, fechamento (conferência) — hoje só existe *layout* fixture da Home ("apoio ao turno") | Módulo `cash-sessions`: abrir/fechar, registrar sangria/suprimento, snapshot de vendas por forma de pagamento, "valores de fechamento" que o `erp-web` mock já desenha |
| **Checkout** | Fluxo Balcão→Pagamento precisa gravar contra API real, com idempotência (retry seguro) | Endpoint de venda rápida (padrão `POST /v1/sales/quick` da food-api, portado para `erp-api`/`sales`), vinculado a `cashSessionId` |
| **Formas de pagamento** | Catálogo hoje é fixture (`payment_catalog.dart`) | Catálogo organization-scoped de formas de pagamento (dinheiro, PIX, débito, crédito c/ parcelas, voucher), configurável por loja — hoje só existe o conceito estreito de "métodos de um contrato de cartão" |
| **Persistência local** | Nenhum banco embutido | — |
| **Sincronização offline** | Nenhuma fila, nenhum outbox, nenhuma detecção de conectividade | Endpoints precisam aceitar idempotency key para tolerar reenvio |
| **Emissão fiscal** | Nenhuma | Nenhuma — é o maior item de escopo do documento inteiro (ver 6.9) |
| **Hardware** | Impressora térmica, gaveta, leitor de código de barras, balança, TEF — nenhum integrado | Contrato de payload que a impressora/TEF vão consumir ainda não existe |
| **Observabilidade** | Sem telemetria de sync, sem log de erro de venda perdida | Sem endpoint de heartbeat/health de terminal |

---

## 5. Pesquisa de mercado

### 5.1 ConnectPlug / Cplug (referência direta pedida)

A ConnectPlug vende ERP + PDV integrados como um produto único — não dois
sistemas conectados por API pública documentada para terceiros, o que limitou
o quanto dá para inspecionar de fora (a documentação técnica de API
(`manual.cplug.com.br/books/api-cplug`) e a página de ajuda de instalação do
PDV offline não ficaram acessíveis para leitura direta durante esta pesquisa).
O que ficou claro pelas páginas de produto/blog:

- **Modelo de produto**: "PDV + pagamentos + emissão de nota em um único
  dispositivo" — venda no PDV é enviada automaticamente para o
  sistema de gestão, com controle de vendas/estoque/caixa centralizado.
  Comunicação com maquininha (TEF) é automática — sem digitação manual do
  valor.
- **Offline explícito**: "o PDV continua vendendo mesmo sem internet e
  sincroniza automaticamente quando a conexão volta" — confirma que
  operação offline com sync automático ao reconectar é uma feature de
  produto anunciada, não um detalhe de implementação escondido. É o mesmo
  compromisso que o `AGENTS.md` da barra de título do PDV Citybox já reserva
  espaço visual para ("saúde de rede" no title bar).
- **App mobile próprio** (`CPlug PDV`, Android, na Play Store) — reforça que o
  padrão de mercado é ter um app nativo dedicado ao caixa, não reaproveitar o
  backoffice web — exatamente a decisão já tomada no Citybox (`apps/pdv/app`
  em Flutter, deliberadamente não herdando `apps/pdv/frontend`).
- API própria versionada (V2 → V3 mencionado em nota de migração de
  integração) — indica que expuseram contrato estável o bastante para terceiros
  (Bling) integrarem por anos, com migração coordenada entre versões.

**Conclusão para o Citybox**: a arquitetura de produto da ConnectPlug confirma
a direção já tomada (app nativo dedicado, offline com sync automático,
TEF integrado, PDV como fonte de verdade operacional que alimenta o ERP) — mas
não deu para extrair detalhe de protocolo de sincronização por trás do
marketing. A pesquisa geral de arquitetura offline-first de PDV (5.2) preenche
essa lacuna com um nível de detalhe técnico maior.

### 5.2 Padrões gerais de arquitetura offline-first para PDV

Fonte: pesquisa web sobre arquitetura de sistemas de ponto de venda
offline-first, incluindo um relato técnico de um sistema de varejo real
("Retail OS" — Manikarnika Engineering) e literatura de patente/prática sobre
sincronização de PDV.

**Princípio central: o terminal nunca espera a rede para confirmar uma
venda.**

- **Banco local como fonte de verdade imediata**: SQLite embutido no
  terminal, em modo WAL (Write-Ahead Logging), com o commit da venda
  acontecendo **localmente em milissegundos**, sem esperar confirmação de
  rede. A rede é uma **camada de sincronização, não uma dependência** do
  caminho crítico de vender.
- **Eventos imutáveis, não "estado atual"**: cada venda vira um evento
  (`transactionId`, `storeId`, `terminalId`, `timestamp`, itens, forma de
  pagamento, checksum) gravado localmente e depois enviado como stream
  imutável, nunca como "atualiza o registro X". Isso evita a classe de bug
  onde duas gravações concorrentes se sobrescrevem — o dado bruto (o que
  aconteceu) nunca é perdido, mesmo que a agregação (saldo, totais) precise
  ser recalculada depois.
- **Daemon de sincronização separado do processo de vendas**: um processo
  (ou isolate, no caso Flutter) fora do caminho de UI streama os eventos
  pendentes para o backend assim que a conectividade volta — nunca bloqueia a
  tela de venda.
- **Idempotência é o problema real, não "enviar de novo"**: tratar sync como
  binário ("funcionou / não funcionou") é a causa mais comum de retry infinito
  e perda silenciosa de dado. Cada evento carrega uma chave de idempotência
  (ex.: UUID gerado no terminal no momento da venda) que o backend usa para
  descartar reenvios duplicados sem duplicar a venda. Erros devem ser
  classificados — transitório (timeout, tenta de novo), permanente (validação,
  não adianta reenviar sem intervenção) e conflito (dado mudou nos dois
  lados) — cada categoria com sua estratégia, em vez de um retry-loop único.
- **Resolução de conflito**: para inventário/saldo compartilhado entre
  terminais que sincronizam depois de ficarem offline ao mesmo tempo, o
  padrão mais citado é CRDT (Conflict-free Replicated Data Type) ou, mais
  simples e mais comum na prática, "last write wins" por timestamp — aceitável
  quando o domínio tolera pequena divergência transitória (ex.: saldo de
  estoque, que já é eventual mesmo em sistemas 100% online, por conta de
  concorrência de venda). Para o PDV Citybox, o caso mais crítico não é
  conflito de edição (o carrinho é local e single-writer por terminal) e sim
  **saldo de estoque decrementado por dois terminais offline ao mesmo tempo**
  — decisão de produto a tomar: aceitar overselling ocasional (mercado
  aceita isso, é raro) versus bloquear venda offline de item com estoque
  baixo (pior UX, mais seguro).

**Emissão fiscal offline (achado específico do Brasil, não da literatura
genérica de PDV):**

- **Contingência** é o termo técnico: quando a SEFAZ está indisponível (ou o
  PDV está sem internet), a nota (NFC-e) é emitida em modo de contingência —
  gerada e armazenada localmente com uma numeração/série própria de
  contingência — e **precisa ser transmitida para autorização definitiva em
  até 24h** (o prazo exato varia por UF) depois que a conexão volta.
- Alguns estados não permitem contingência offline pura e exigem hardware
  fiscal dedicado — SAT em São Paulo, MFE no Ceará — o que significa que a
  estratégia de contingência **não é universal no Brasil**; precisa ser
  parametrizável por UF da loja.
- O campo "NFC-e contingência" que já aparece no formulário mock de "Novo PDV"
  do `erp-web` (`/ponto-de-venda/cadastros`) mostra que esse requisito já foi
  antecipado no design da tela, mesmo sem o backend existir — é sinal de que
  a intenção de produto já inclui isso.

### 5.3 Escolhas técnicas para o lado Flutter

Fonte: pesquisa sobre bibliotecas de banco local e sincronização no
ecossistema Flutter (2026).

- **Banco local**: `drift` é a recomendação consistente entre as fontes
  pesquisadas como escolha "seguro e certo" para 2026 — SQL-backed, type-safe,
  ativamente mantido, com threading em isolate embutido, funciona em todas as
  plataformas-alvo do PDV (Linux, Windows, Android). `hive`/`isar` foram
  citados como **abandonados pelo autor original** e `Realm` teve seu sync
  descontinuado pela MongoDB — apostar neles em 2026 significa herdar migração
  forçada, não recurso. Para o PDV Citybox (que já roda em 3 plataformas
  desktop+mobile), `drift` é o candidato natural.
- **Motor de sincronização**: para não reinventar a fila de sync do zero,
  `PowerSync` foi citado como solução pronta que integra com `drift` — mas é
  um serviço de terceiro com seu próprio backend de sync; adotar isso trocaria
  "construir sync" por "integrar um serviço de sync gerenciado", uma decisão de
  arquitetura maior que este documento não resolve — só registra como opção a
  avaliar (ver §9, decisões em aberto). A alternativa é implementar a fila de
  sync (outbox local em `drift` + worker de envio) direto no domínio do PDV,
  sem dependência de serviço externo — mais trabalho, mais controle.

---

## 6. Arquitetura proposta

### 6.1 Visão geral

```
┌─────────────────────────── apps/pdv/app (Flutter) ───────────────────────────┐
│                                                                                │
│  UI (Riverpod)  →  Domínio (use cases)  →  Repositório  →  Drift (SQLite)    │
│                                                    │              ▲            │
│                                                    │              │            │
│                                              [online?]      outbox local      │
│                                                    │              │            │
│                                                    ▼              │            │
│                                          SyncWorker (isolate) ────┘            │
│                                                    │                           │
└────────────────────────────────────────────────────┼───────────────────────────┘
                                                       │ HTTPS + JWT (Keycloak)
                                                       │ X-Organization-Id / X-Branch-Id
                                                       │ Idempotency-Key
                                                       ▼
┌─────────────────────────────── apps/erp/api (NestJS) ─────────────────────────┐
│  novos módulos:  pos-terminals · cash-sessions · payment-methods · pdv-sales  │
│  módulos existentes reaproveitados: catalog · stock · customers · sales      │
└────────────────────────────────────────────────────────────────────────────────┘
                                                       │
                                                       ▼
                                         apps/erp/web (telas de gestão,
                                         mesmas rotas que hoje são mock:
                                         /ponto-de-venda/{cadastros,caixas})
```

O ERP web e o PDV Flutter consomem **o mesmo backend novo** — não há
duplicação de módulo por app. Isso significa que o trabalho de backend desta
integração paga a dívida dupla: tira o `erp-web` do mock em
`/ponto-de-venda/*` **e** dá ao PDV o que ele precisa.

### 6.2 Autenticação e pareamento de terminal

**Duas identidades diferentes, não uma só:**

1. **Identidade do terminal** — o dispositivo físico (o desktop do caixa, o
   tablet do garçom). Pareado uma vez, credencial de longa duração
   (guardada em `flutter_secure_storage`). Resolve "esta loja, esta unidade,
   este terminal existe e está ativo" — é o que o `erp-web` cria hoje em
   `/ponto-de-venda/cadastros` (mock).
2. **Identidade do operador** — quem está logado no turno agora. Em PDV de
   balcão, login completo por OIDC a cada troca de operador é fricção real
   (fila de cliente esperando). Padrão de mercado (inclusive citado na
   pesquisa de PDV em geral): **login rápido por PIN/código curto**, validado
   localmente contra a lista de operadores da unidade (já sincronizada), com
   sessão associada guardando *qual* `Membership` do Keycloak abriu aquele
   turno — a autenticação "pesada" (token OIDC) acontece uma vez no
   pareamento/login do terminal; a troca de operador durante o dia é local e
   rápida, mas **carimba cada venda com o operador correto** para
   relatório/comissão.

**Fluxo de pareamento sugerido:**
1. No `erp-web` (`/ponto-de-venda/cadastros`), operador com permissão gera um
   código/QR de ativação para um novo terminal.
2. No PDV Flutter, tela de "Ativar terminal" lê o código, troca por um refresh
   token de longa duração via o novo client `citybox-pdv` (PKCE) — ou, se o
   fluxo de código curto for preferido a um OIDC completo na tela de
   ativação, um endpoint dedicado de troca de código→credencial no `erp-api`.
3. Terminal guarda a credencial em `flutter_secure_storage`; dali em diante
   toda chamada carrega `X-Organization-Id`/`X-Branch-Id` fixos (a unidade não
   muda depois que o terminal é pareado a ela).

**Ação corretiva**: o `AGENTS.md` do PDV precisa deixar de citar `citybox-app`
como candidato e passar a apontar para um client novo dedicado (`citybox-pdv`
sugerido) — ver §3.4.

> ⚠️ **Revisado em 2026-08-06 (M2 do plano de autenticação, já entregue).**
> O client `citybox-pdv` **não foi criado e não será**: o pareamento é
> máquina-a-máquina, e encaixá-lo em OIDC exigiria um client por terminal ou
> token exchange com service account. A `erp-api` emite um **device token**
> opaco (SHA-256 no banco), revogável pela tela de terminais e validado pelo
> `DeviceAuthGuard`. Ver `.claude/prds/_platform/pdv-erp-auth.prd.md` §D2 e a
> seção "Pos-terminals" do `apps/erp/api/AGENTS.md`.

### 6.3 Persistência local e modelo offline

- `drift` como banco local (ver §5.3) — schema espelha o subconjunto do
  domínio do ERP que o PDV precisa **para operar sem rede**: produtos +
  preços + saldo de estoque (snapshot, não em tempo real), clientes
  recentes/frequentes, formas de pagamento, sessão de caixa aberta, fila de
  vendas pendentes de sincronização.
- Catálogo/clientes/formas de pagamento: sincronização **downstream**
  (servidor → terminal), sob demanda ou periódica — não precisa de fila de
  outbox, é sempre "pega o que há de novo". Aceitável ficar levemente
  desatualizado (minutos) — não é o caminho crítico.
- Vendas/movimentos de caixa (sangria, suprimento, abertura, fechamento):
  sincronização **upstream** (terminal → servidor), via outbox local — é o
  caminho que precisa da fila de sync descrita em 6.4.

### 6.4 Fila de sincronização (outbox pattern)

Cada mutação que precisa chegar ao servidor (venda fechada, sangria,
abertura/fechamento de caixa) grava **localmente primeiro**, num registro
imutável com:

```
{
  localId: uuid,          // gerado no terminal — vira a idempotency key
  type: 'sale' | 'cash_movement' | 'session_open' | 'session_close',
  payload: {...},          // o corpo que vai para a API
  createdAt: timestamp,
  status: 'pending' | 'syncing' | 'synced' | 'failed',
  attempts: int,
  lastError: string?,
}
```

Um worker (isolate separado da UI, seguindo o princípio "nunca bloquear a
venda na rede" de 6.2) drena a fila quando há conectividade:
`POST` com header `Idempotency-Key: <localId>` — o backend recusa reprocessar
o mesmo `localId` (retorna a venda já criada, não erro), o que torna o reenvio
seguro em caso de timeout de rede sem confirmação de recebimento.

Erros classificados como no padrão de 5.2: transitório (rede caiu no meio —
retry com backoff), permanente (ex.: produto foi descontinuado depois da venda
ter sido feita offline — fica em `failed`, precisa de tela de "vendas com
pendência" para o operador resolver, nunca falha silenciosamente), conflito
(ex.: estoque zerou entre a venda offline e a sincronização — decisão de
produto pendente, ver §9).

### 6.5 Novos módulos necessários no `erp-api`

| Módulo novo | Rotas (sugestão) | Cobre |
|---|---|---|
| `pos-terminals` | `POST/GET /v1/pos-terminals`, `POST .../pair`, `PATCH .../:id` | Cadastro + pareamento de terminal — tira `/ponto-de-venda/cadastros` do mock |
| `cash-sessions` | `POST /v1/cash-sessions` (abrir), `POST .../:id/movements` (sangria/suprimento), `POST .../:id/close`, `GET /v1/cash-sessions` | Turno de caixa — tira `/ponto-de-venda/caixas` do mock |
| `payment-methods` | `GET/POST /v1/payment-methods` | Catálogo organization-scoped de formas de pagamento (hoje só existe o caso estreito de métodos de contrato de cartão em `finance/card-contracts`) |
| `sales` (extensão) | `POST /v1/sale-orders/quick` (ou submódulo dedicado) | Checkout de balcão — porta o padrão `POST /v1/sales/quick` da food-api (§3.3) para dentro do módulo `sales` já existente, vinculando `cashSessionId` e aceitando `Idempotency-Key` |

Todos seguem o mesmo padrão Clean Architecture já estabelecido em `erp-api`
(ver `apps/erp/api/AGENTS.md` §4.1) — organization-scoped, `TENANT_SCOPED_MODELS`,
guards já ligados.

### 6.6 Checkout (Balcão → Pagamento → venda fechada)

Reaproveitar o desenho da `food-api` (§3.3), adaptado ao formato de
`SaleOrder` que já existe em `erp-api`:

1. PDV monta o payload localmente (linhas do carrinho + pagamentos lançados)
   assim que "Finalizar" é confirmado na tela de Pagamento — **não espera
   rede**, grava no outbox imediatamente e mostra a tela de venda concluída.
2. Sync worker envia `POST /v1/sale-orders/quick` (ou equivalente) com
   `status=closed` implícito, `payments[]`, `cashSessionId`, `Idempotency-Key`.
3. Backend: mesma baixa de estoque idempotente que `SaleOrder` já faz hoje
   (§3.1) + geração do `FinancialEntry` `receivable` — sem trabalho novo
   nessa parte, só o empacotamento "rápido" em volta.
4. Se a venda tinha item sem controle de estoque suficiente (§6.4, caso de
   conflito), o backend recusa com 409 — a UI do PDV precisa de uma tela de
   "pendências de sincronização" para o operador decidir (não é silencioso).

### 6.7 Emissão fiscal e contingência

Este é o item de maior escopo e maior risco de todo o levantamento — não
existe hoje **nada** no monorepo (nenhuma vertical, nenhum serviço) que emita
NFC-e ou fale com SAT/MFE. Não é uma lacuna que se fecha estendendo um módulo
existente; é integração nova com um provedor de emissão fiscal (SaaS
especializado — ex. Focus NFe, eNotas, Facilita NFe [citado como placeholder
já na navegação do `erp-web`], NFe.io) ou implementação direta do protocolo
SEFAZ (desaconselhado — complexidade e manutenção regulatória contínua por
UF).

Recomendação de escopo: **tratar emissão fiscal como fase própria, depois do
checkout funcionar sem nota fiscal em ambiente de homologação/piloto** — o
campo "NFC-e contingência" já desenhado no mock de `/ponto-de-venda/cadastros`
confirma que o produto já antecipa isso, mas não precisa bloquear a primeira
integração PDV↔ERP. Quando entrar: o desenho de contingência do §5.2
(gerar localmente, transmitir em até 24h ao reconectar) se encaixa
naturalmente na mesma fila de outbox do §6.4 — é só mais um `type` de evento
pendente.

### 6.8 Hardware (impressora, gaveta, leitor de código de barras, TEF, balança)

Fora do escopo de API do ERP — são integrações locais do terminal Flutter:

- **Impressora térmica**: pacotes Flutter de impressão ESC/POS (USB/rede) —
  puramente client-side, sem contrato com o backend além dos dados já
  disponíveis na venda fechada.
- **Gaveta**: normalmente pulso elétrico via a própria impressora térmica
  (comando ESC/POS) — não é hardware separado na maioria dos casos.
- **Leitor de código de barras**: no desktop, majoritariamente HID (emula
  teclado) — não precisa de plugin nativo. Em Android, pode precisar de
  integração com scanner dedicado dependendo do hardware do tablet escolhido.
- **TEF (maquininha de cartão)**: é a integração mais delicada — protocolos
  proprietários por operadora (Stone, Cielo, Rede, PagSeguro, ...) ou um
  agregador (Pay Kit / SDK único, como a própria ConnectPlug parece usar pela
  descrição "tudo em um dispositivo"). Decisão de produto pendente: qual(is)
  operadora(s)/agregador priorizar — não é uma decisão técnica que este
  documento resolve.
- **Balança**: já citado no mock de `/ponto-de-venda/cadastros`, relevante só
  para o segmento com produto pesável (ex. adega, açougue no varejo) —
  integração serial/USB local ao terminal.

Nenhum desses depende do offline-sync em si — mas o **payload da venda**
enviado ao backend precisa carregar o suficiente (ex.: peso capturado, se
aplicável) para que o relatório gerencial no `erp-web` bata com o que saiu
impresso no terminal.

### 6.9 Observabilidade

Cada terminal deveria reportar heartbeat (`GET /v1/pos-terminals/:id/health`
ou similar) com: última sincronização bem-sucedida, tamanho da fila pendente,
versão do app. É o dado que preenche a "saúde de rede" que a barra de título
do PDV já reserva espaço para (hoje fixture fixa em "tudo ok" — §2.2) e que o
`/ponto-de-venda/cadastros` do `erp-web` provavelmente vai querer mostrar por
terminal (status: online/offline, há quanto tempo).

---

## 7. Decisões de produto que este documento não resolve (levar para discussão)

1. **Login de operador**: PIN local vs. troca de usuário via OIDC completo a
   cada turno (§6.2). Afeta UX de balcão diretamente.
2. **Overselling offline**: bloquear venda de item com saldo baixo quando
   offline (mais seguro, pior UX) vs. aceitar e reconciliar depois (§6.4).
3. **Fila de emissão fiscal por UF**: quais estados o piloto (Ilhéus/BA)
   precisa cobrir primeiro, e se contingência pura é aceitável ali ou se
   exige hardware fiscal dedicado (§6.7 — depende da legislação da UF da
   loja).
4. **Provedor de emissão fiscal**: serviço terceirizado (mais rápido de
   integrar, custo recorrente por nota) vs. implementação direta do protocolo
   SEFAZ (mais controle, muito mais trabalho de manutenção).
5. **TEF**: qual(is) operadora(s)/agregador. Trava o cronograma de "pagamento
   com cartão real" até decidido.
6. **PowerSync (ou similar) vs. outbox caseiro** (§5.3): adotar uma
   plataforma de sync gerenciada, trocando esforço de implementação por
   dependência de serviço externo — vale uma avaliação técnica dedicada antes
   da Fase 2 do roadmap abaixo.

---

## 8. Roadmap sugerido (fases)

Cada fase abaixo é candidata a virar seu próprio `/plan-prd` → `/plan` quando
priorizada — este roadmap só ordena o trabalho, não o detalha a nível de
tarefa.

| Fase | Entrega | Depende de |
|---|---|---|
| **0 — Higiene de documentação** | Corrigir `apps/pdv/app/AGENTS.md` §6 (erp-api já tem `sales`; `citybox-app` não é o client certo) | Nada — é imediato |
| **1 — Autenticação + pareamento** | Client `citybox-pdv` no Keycloak; fluxo de ativação de terminal; PDV Flutter autentica e resolve organização/unidade | Fase 0 |
| **2 — Leitura online (sem offline ainda)** | PDV consome `catalog`/`stock`/`customers` reais via HTTP direto (sem persistência local ainda) — Balcão para de usar fixture | Fase 1 |
| **3 — Backend de operação** | Novos módulos `pos-terminals`, `cash-sessions`, `payment-methods`, endpoint de checkout rápido em `sales` (§6.5) — e o `erp-web` sai do mock em `/ponto-de-venda/{cadastros,caixas}` no mesmo passo | Fase 2 (reaproveita os mesmos DTOs de leitura) |
| **4 — Checkout online** | Balcão→Pagamento do PDV grava venda real contra os endpoints da Fase 3, ainda **sem** tolerância a offline (falha se sem rede) | Fase 3 |
| **5 — Persistência local + sync downstream** | `drift` no PDV; catálogo/clientes/formas de pagamento cacheados localmente; app funciona para *consultar* offline | Fase 2 |
| **6 — Sync upstream (outbox) + operação offline completa** | Fila de vendas/movimentos de caixa (§6.4), idempotência ponta a ponta, tela de pendências de sincronização | Fases 4 + 5 |
| **7 — Hardware** | Impressão térmica + gaveta + leitor de código de barras (desktop primeiro, Android depois); TEF (após decisão de operadora, §7.5) | Fase 6 (payload de venda precisa estar estável) |
| **8 — Fiscal** | Integração com provedor de emissão + contingência offline (§6.7) | Fase 6 (mesma fila de sync) + decisões §7.3/§7.4 |
| **9 — Observabilidade** | Heartbeat de terminal, saúde de rede real na barra de título (substitui a fixture atual) | Fase 3 |

A ordem prioriza **online primeiro, offline depois** — é mais barato validar
o contrato de API e a UX do checkout contra uma rede estável antes de somar a
complexidade de sincronização. Offline é a promessa central do produto (o
usuário pediu isso explicitamente), mas construir a fila de sync contra um
contrato de API que ainda pode mudar é retrabalho garantido.

---

## 9. Referências

**Internas (lidas integralmente ou em profundidade nesta análise):**
- `apps/pdv/app/AGENTS.md`, `apps/pdv/app/pubspec.yaml`
- `apps/pdv/frontend/AGENTS.md` (contexto — não é referência de design)
- `apps/erp/AGENTS.md`, `apps/erp/api/AGENTS.md`, `apps/erp/web/AGENTS.md`
- `apps/verticals/food/AGENTS.md`
- `infra/keycloak/import/citybox-dev-realm.json` (client `citybox-app`)
- `AGENTS.md` raiz do monorepo

**Externas (pesquisa de mercado, 2026):**
- ConnectPlug/Cplug — [Sistema ERP + PDV](https://www.cplug.com.br/lp/sistema-erp) · [Blog: 8 motivos PDV](https://blog.connectplug.com.br/sistema-frente-de-caixa-pdv-connectplug/) · [Instalação PDV 2.0 offline](https://ajuda.connectplug.com.br/como-instalar-o-pdv-2-0-offline/) (offline + sync automático confirmado via resultado de busca, página não acessível diretamente)
- [Engineering Offline-First Distributed Systems: Lessons from Retail OS](https://www.manikarnikatechnologies.in/blog/building-offline-first-pos-systems) — arquitetura de referência (SQLite WAL local, eventos imutáveis, CRDT)
- [The Hidden Problems of Offline-First Sync: Idempotency, Retry Storms, and Dead Letters](https://dev.to/salazarismo/the-hidden-problems-of-offline-first-sync-idempotency-retry-storms-and-dead-letters-1no8)
- [Flutter Offline-First Architecture (DEV Community)](https://dev.to/anurag_dev/implementing-offline-first-architecture-in-flutter-part-1-local-storage-with-conflict-resolution-4mdl)
- [The Flutter Local Database Landscape in 2026 (Luci Studio)](https://luci-studio.com/blog/the-flutter-local-database-landscape-in-2026-a-maintenance-first-guide-fe6d267c/)
- [Flutter Database Comparison: sqlite_async, sqflite, ObjectBox, Isar (PowerSync)](https://powersync.com/blog/flutter-database-comparison-sqlite-async-sqflite-objectbox-isar)
- [Um Guia Completo para a Emissão de NFC-e em Modo Offline (in4)](https://www.in4.com.br/um-guia-completo-para-a-emissao-de-nfc-e-em-modo-offline/)
- [Contingência NFCe: o que fazer quando a Sefaz fica indisponível (Avalara/Oobj)](https://oobj.com.br/legislacao/contingencia-nfce-sefaz/)
