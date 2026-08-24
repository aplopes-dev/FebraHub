# AGENTS.md — `apps/pdv/app` (`citybox_pdv`)

> Fonte de verdade deste módulo. Leia antes de escrever qualquer linha aqui.
> Onde houver conflito com o `CLAUDE.md` da raiz sobre um fato local (caminho,
> comando, convenção deste app), **este arquivo prevalece**.

---

## 1. O que é

**PDV Citybox em Flutter** — frente de caixa para os lojistas que usam o ERP
Citybox (`apps/erp`). Atende os dois segmentos que o ERP cobre: **food** e
**varejo**.

| | |
|---|---|
| Pacote Dart | `citybox_pdv` |
| Localização | `apps/pdv/app` |
| Plataformas | **Linux, Windows, Android** (tablet e celular) |
| Flutter | ≥ 3.29 (validado em 3.44.8 / Dart 3.12.2) |
| Estado | `flutter_riverpod` 2.6 — **sem** code-generation |

### Plataformas: o que está dentro e o que está fora

**Dentro:** Linux e Windows (o caixa de balcão) e Android (tablet do salão,
celular do garçom).

**Fora, por decisão:** iOS, macOS e **web**. Não os adicione sem registrar a
decisão neste arquivo — cada plataforma extra é superfície de teste permanente,
não uma linha a mais no `flutter create`. O `tool/bootstrap.sh` já fixa
`--platforms=android,linux,windows`.

### Status atual

🟢 **Fase 1 — Núcleo comum** entregue (`specs/pdv/002-common-core-phase1`),
sobre a **Fase 0** (`specs/pdv/001-foundation-phase0`). Existem: tema
(`core/theme/` — **único e escuro**, ver 4.0.1), moldura de janela
(`PdvScaffold`, barra de título no desktop, app bar no conteúdo), a tela
inicial (`features/home/`) com a grade de ações do caixa e a coluna de apoio ao
turno, a **tela de Balcão** (`features/counter/`) com barra de ferramentas,
categorias, lista de itens lançados, totais (ajuste de venda XOR
desconto/acréscimo) e grade de produtos, a **tela de Pagamento**
(`features/payment/`) com formas de pagamento, teclado de valor, pagamentos
lançados e fechamento da venda, o **cadastro/seleção de Clientes**
(`features/customer/`), o **Hub Caixa** (`features/cash/`) com abrir/fechar
turno, sangria/reforço e esperado em gaveta (só dinheiro líquido), **Últimas
vendas** (`features/sales_history/`) e **Configurações** (`features/settings/`)
com preferências locais + módulos **somente leitura** (“configurado no ERP”).
Navegação por **`go_router`** (`app/router/pdv_router.dart`) com **guard de
turno** (Balcão/Pagamento/Sangria/Histórico/**Consulta de preço/Devolução/Crédito**
exigem turno aberto; Configurações e Vendedor não). Persistência local:
`pdv.cash_shift.v1`, `pdv.terminal_settings.v1`, `pdv.modules.v1`,
`pdv.catalog.v1`, `pdv.customers.v1`, `pdv.payment_methods.v1`,
`pdv.refund.v1`, `pdv.credit.v1`. Dinheiro do domínio em
**centavos (`int`)** com `formatCents` na UI. Catálogo de módulos tipado
(inclui `cash_hub` no núcleo e `price_check` opcional varejo), fonte HTTP +
cache local (configuração só no ERP). Estados compartilhados `PdvLoadingState` /
`PdvErrorState` / `PdvEmptyState` em `lib/ui/`.

Checkout **online** já grava `SaleOrder` fechado no ERP (`POST /v1/pos/sales`)
e espelha no turno local; **abrir/fechar caixa e sangria/reforço** vão ao
servidor (`/v1/pos/cash-sessions`, device auth) com cache local `pdv.cash_shift.v1`
para vendas do turno e fallback offline na hidratação. Meios vêm de
`GET /v1/pos/payment-methods` (ver §4.11.4). Ainda fora de escopo: fila offline
de vendas, TEF/maquininha, impressão real (driver), NFC-e/SAT, gaveta física. A saúde dos canais
(conexão, Sefaz) na barra de título é **fixture** — sempre "tudo ok" —
até haver emissão fiscal de verdade para observar.

Delivery também é **online-first**: `PosDeliveryApi` usa `/v1/pos/delivery-orders`
e `/v1/pos/couriers`; criação, linhas, cancelamento e transições do Kanban só
alteram o espelho `pdv.salon.v1` depois do sucesso no ERP. O checkout vincula
`posDeliveryOrderId` e envia `deliveryFeeCents` = frete + couvert + serviço +
acréscimo (mesma composição do balcão sem delivery); o servidor **não** marca
`delivered` no pagamento — Concluído no Kanban é só avanço operacional.
Espelho local guarda `saleOrderId` / `isPaid`; tom **Pago** vs **Aguardando
pagamento**.
**Pedidos delivery:** cartão/tabela mostram `totalCents` (itens + taxa); filtro
padrão **Abertos**; botões Novo delivery + Atualizar; poll a cada 15s + refresh
ao entrar na tela; `refreshDeliveryOrders()` também após cancelar venda; modo de
vista em `pdv.delivery_view_mode.v1`; toque abre sheet (itens, avançar até
Concluído, entregador, cancelar se não pago, abrir balcão só se não pago /
não delivered, **Registrar pagamento**, **Ver recibo** se houver venda).
Colunas Kanban: Novo → Em preparo → Despachado → Concluído. Novo delivery abre
o Balcão em **rascunho**; **SALVAR E VOLTAR** / **PAGAR AGORA** sincronizam
cliente/endereço no header ERP enquanto não pago; cliente no app bar fica
somente leitura após pago. `closeAccount` grava `saleOrderId` sem forçar
`delivered`. Tom `awaitingPayment` quando `dispatched` + conta ativa (COD) e
ainda não pago.

**Fase 2 food entregue** (`specs/pdv/003-food-phase2`): Mesas, Comandas,
Atendimentos, Delivery (novo + pedidos), blocos food do Balcão (adicionais /
observação / meia-a-meia), taxa/couvert, breakpoints compact/medium/expanded
em Balcão e Pagamento, `PdvFilledField` canônico.

**Fase 3 varejo entregue** (`specs/pdv/004-varejo-phase3`): código de barras no
Balcão (`barcode` + `pendingQty`), grade de variantes (`variant_grid`), peso/
balança (`scale` + half-up), **Consulta de preço** (`/price-check`),
**Devolução** (`/refund` + sangria) e **Crédito dos clientes** (`/credit` +
reforço). Perfis Loja/Mercado ligam behaviors varejo; Restaurante desliga.
UI operacional em Filled (`PdvFilledField`) e diálogos Md/Lg.

### Relação com `apps/pdv/frontend`

`apps/pdv/frontend` é um PWA Next.js do PDV, também em estado de scaffold.

**Ele não é referência para este app.** A interface aqui não segue o layout, a
navegação nem o tema de lá — a decisão foi construir do zero, para um app
nativo, sem herdar escolhas feitas para um projeto web. Não copie
`pdv-theme.css`, não replique a estrutura de telas dele.

---

## 2. Comandos

O Flutter **não** entra no Turborepo/pnpm — este app tem ciclo próprio.

```bash
cd apps/pdv/app
export PATH="$HOME/flutter/bin:$PATH"   # só se o SDK não estiver no PATH

flutter pub get
flutter analyze                 # DEVE terminar com "No issues found!"
flutter test
dart format .

flutter run -d linux            # desktop
flutter run -d windows          # desktop (no Windows)
flutter run                     # tablet/celular Android conectado

flutter build linux --release
flutter build apk --release --obfuscate --split-debug-info=./debug-info/
```

### Regenerar os runners nativos

`flutter create .` num diretório existente **sobrescreve** `pubspec.yaml`,
`analysis_options.yaml`, `README.md`, `.gitignore` e `lib/main.dart`. Nunca o
rode direto. Use:

```bash
./tool/bootstrap.sh
```

Ele preserva os arquivos do projeto, gera as plataformas e restaura.

---

## 3. Estrutura

Hoje:

```
lib/
├── main.dart                       # ProviderScope → PdvApp (MaterialApp.router)
├── core/
│   ├── theme/
│   │   ├── pdv_tokens.dart         # ← EDITE AQUI para mudar a aparência
│   │   └── pdv_theme.dart          # traduz os tokens em ThemeData
│   ├── crypto/                     # pdv_pin_hasher.dart — espelho do PinHasher da API
│   ├── http/                       # pdv_api_client.dart — Dio + timeout + redação
│   ├── format/                     # pdv_currency.dart — formatCents(int);
│   │                               # normalize_for_search.dart
│   ├── feedback/                   # showNotImplementedFeedback
│   └── platform/                   # AppPlatform.isDesktop
├── ui/                             # widgets compartilhados entre features
│   ├── pdv_app_bar_button.dart
│   ├── pdv_app_bar_filled_button.dart
│   ├── pdv_loading_state.dart      # loading / erro / vazio padronizados
│   ├── pdv_error_state.dart
│   ├── pdv_empty_state.dart
│   ├── pdv_filled_field.dart       # pdvFilledDecoration + PdvFilledField
│   ├── pdv_money_field.dart        # PdvMoneyField — TODO campo de dinheiro
│   ├── pdv_table.dart              # PdvTableColumn/Header (com loading)/Cell/Empty
│   ├── pdv_table_footer.dart       # paginação + itens por página
│   ├── pdv_dialog.dart             # corpo/tamanho de diálogos desktop
│   └── pdv_form_section.dart       # seção de form + frame + KPI card
├── app/
│   ├── router/
│   │   └── pdv_router.dart         # go_router + guard de turno (cash_shift)
│   └── shell/
│       ├── pdv_scaffold.dart        # showBack: true por padrão (ver 4.7.1)
│       ├── pdv_back.dart            # popOrHome — regra única de voltar
│       ├── pdv_menu_drawer.dart     # menu lateral (homeActions + handleHomeAction)
│       ├── pdv_title_bar.dart
│       ├── pdv_app_bar.dart         # Voltar + menu (sem "Sair" — ver 4.7.2)
│       ├── pdv_app_bar_chrome.dart   # moldura da barra + Fechar caixa fixo
│       ├── pdv_close_shift_action.dart # Fechar caixa (ver 4.7.2)
│       ├── pdv_page_title.dart     # pushWithPageTitle (diálogos / legado)
│       └── widgets/                # brand, status, window_controls
└── features/
    ├── shared/                     # shell providers, conectividade, StartingPage,
                                    # reset_open_sale (zera venda ao desativar/trocar org)
    ├── home/
    ├── counter/                    # domínio em *Cents; SaleAdjustment XOR
    ├── catalog/                    # snapshot ERP → cache pdv.catalog.v1 (§4.11.2)
    ├── tables/                     # mapa de mesas + salon store
    ├── tabs/                       # comandas
    ├── service/                    # fila de atendimentos
    ├── delivery/                   # novo pedido + quadro de pedidos (kanban/cartões/tabela)
    ├── payment/                    # meios ERP + checkout online + cupom não fiscal (§4.11.4)
    ├── customer/                   # CRM via /v1/pos/customers* + cache pdv.customers.v1 (§4.11.3)
    ├── terminal/                   # credencial do dispositivo + tela de ativação (§4.12)
    ├── operators/                  # sessão, login por PIN, bloqueio (§4.13),
    │                               # autorização de supervisor (§4.14),
    │                               # cache offline + hashes (§4.15)
    ├── policies/                   # alçada: PosPolicy + cache + controller (§4.14)
    │                               # + exception_gate (portão único, §4.15)
    ├── fiscal/                     # GET /v1/pos/fiscal-settings + indicador Sefaz (§4.11.4)
    ├── cash/                       # turno, movimentos, expected drawer, SaleRecord
    ├── sales_history/              # tabela do turno (busca/filtro/página) + detalhe + cancelamento
    ├── settings/                   # nav lateral + 5 seções (sessão/touch/favoritos/terminal/módulos)
    ├── price_check/                # consulta de preço (não altera carrinho)
    ├── refund/                     # devolução + pdv.refund.v1
    ├── credit/                     # crédito cliente + pdv.credit.v1
    └── modules/
        ├── domain/                 # enums, ids (incl. cash_hub), catalog, snapshot
        ├── data/                   # HTTP source, segment_profiles, cache, fixture
        └── application/            # module_visibility_controller
```

**`features/modules/` é a fonte única de "o que está ligado".** Desligar um
módulo ali o esconde em **qualquer** lugar que consulte o mesmo `id` — o bloco
da tela inicial, o atalho de teclado dele e o botão equivalente na app bar de
uma tela (Comandas no Balcão, por exemplo). Quem adiciona um controle ligado a
um módulo checa `moduleVisibilityProvider`; não existe segundo lugar de verdade.

O catálogo ainda é a lista fixa de `HomeAction`. Quando ele vier de configuração
real da loja (plano contratado, vertical, permissão), só a **origem** do estado
muda — o filtro por `id` continua o mesmo.

### Para onde ela cresce

Use **feature-first com camadas** em cada `features/<nome>/`. Não crie as
pastas antes de haver conteúdo para elas — pasta vazia é promessa, não estrutura.

```
features/<nome>/
├── domain/           # models imutáveis, enums, regras puras
├── data/             # fontes de dados, DTOs, repositórios
├── application/      # controllers Riverpod, estado de tela
└── presentation/     # páginas e widgets
```

| Camada | Não pode |
|---|---|
| `domain/` | importar Flutter; importar `data/` |
| `data/` | importar `presentation/` |
| `application/` | importar widgets |
| `presentation/` | importar `data/` diretamente |

`presentation` fala com `application`, que fala com `data`. Uma página que
importa uma fonte de dados pula uma camada — e é exatamente o import que vai ter
de ser caçado no dia em que o backend entrar.

---

## 4. Regras

### 4.0 Tema: nenhum valor visual solto numa tela

```dart
// ERRADO
Container(color: const Color(0xFFF4F5F7), padding: const EdgeInsets.all(16))
BorderRadius.circular(12)
Text('Total', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600))

// CERTO
ColoredBox(color: PdvColors.background, ...)
const EdgeInsets.all(PdvSpacing.lg)
PdvRadius.baseAll
Text('Total', style: PdvTypography.label)
```

| Preciso de… | Token |
|---|---|
| cor | `PdvColors` |
| arredondamento | `PdvRadius` — **`base` é 0; o PDV tem cantos vivos** |
| espaçamento e padding | `PdvSpacing` |
| altura, largura, espessura, tamanho de ícone | `PdvSizes` |
| estilo de texto | `PdvTypography` (família **Inter** embutida em `assets/fonts/`) |
| duração e curva de animação | `PdvMotion` |

Falta um valor? Adicione **no token**, não na tela. Um `Color(0xFF...)` numa
tela é um valor que ninguém vai encontrar no dia em que a identidade mudar.

**Divisão dos dois arquivos:**

- `pdv_tokens.dart` — o que você edita para mudar a aparência. Cor de marca,
  paleta, raios, escala de espaço, tipografia (**família Inter embutida** em
  `assets/fonts/`, SIL OFL — não depende da fonte do SO), movimento.
- `pdv_theme.dart` — traduz tokens em `ThemeData`. Só se mexe quando um
  componente do Material precisa de um ajuste que os tokens não expressam.

`PdvColors.brand` é o ponto de troca da identidade: todo o resto do tema deriva
dela.

**Cantos vivos.** `PdvRadius.base` é **0** e vale para tudo — botão, campo,
cartão, diálogo, folha, chip. Não existe escala de raios de propósito: um raio
por componente vira decisão repetida em cada tela, e é assim que uma interface
perde a unidade. Para arredondar o app inteiro, mude `base`. Um valor diferente
num componente isolado exige justificativa escrita no código. `PdvRadius.full`
continua existindo, mas para **forma** (avatar, indicador redondo), não para
canto.

### 4.0.1 Um tema só, e ele é escuro

**O PDV não tem modo claro.** Não existe `ThemeMode`, `darkTheme`, interruptor
de tema nem acompanhamento da preferência do sistema — existe `PdvTheme.data()`
e ponto. O terminal fica ligado o turno inteiro, muitas vezes de frente para
uma vitrine, e tela clara nesse cenário vira espelho. Um tema só também elimina
a classe inteira de bug em que uma tela é conferida num modo e quebra no outro.

Consequências práticas para quem escreve tela aqui:

- **Não escreva `if (isDark)`, `Theme.of(context).brightness`, nem
  `MediaQuery.platformBrightnessOf`.** Não há segundo caminho para escolher.
- **`PdvColors` é a paleta escura.** `background` é `#303030`, `surface` é um
  cinza acima dele, `textPrimary` é claro. Não existe par `x`/`xDark`.
- **Elevação é luz, não sombra.** Toda superfície "acima" de outra é **mais
  clara** que ela. A exceção é a moldura — barra de título e app bar afundam
  abaixo de `background`, e é isso que separa a janela do conteúdo. Há teste
  travando essa ordem (`counter_theme_colors_test.dart`).
- **Semânticas são os tons claros.** `PdvColors.success`, `.warning`,
  `.danger` e `.info` já estão calibrados para fundo escuro; as `*Surface`
  correspondentes são versões profundas. Não pegue um verde de material design
  pensado para fundo branco.
- **Campo de texto tem fundo próprio** (`PdvColors.inputFill`, `#414141`), um
  degrau acima de `surface`: o campo precisa se destacar do cartão em que está.

Uma armadilha que já mordeu: **o `TextField` do Material 3 não tira a cor do
texto digitado do `textTheme`** — ele usa `colorScheme.onSurface`. Se alguém
mexer nesse valor, o texto some dentro do campo sem nenhum teste de layout
reclamar. Há uma asserção específica para isso.

**A moldura tem paleta própria.** `PdvTitleBarColors` (barra de título) e
`PdvAppBarColors` (app bar) não reaproveitam `PdvColors`: as duas **afundam**
abaixo de `PdvColors.background`, ao contrário de todo o resto, que sobe. É essa
inversão que separa a janela do app e o app do conteúdo, sem precisar de sombra.
Três superfícies empilhadas, cada uma um degrau da anterior — fundir duas
apagaria a fronteira.

**Ações da tela inicial têm cor fixa por ação** (`PdvActionColors`) — ali a cor
é atalho de memória, não decoração. Regra: uma ação, uma cor, para sempre.
Trocar a cor de uma ação existente custa mais caro que mudar o nome dela.

**Valores monetários usam `PdvTypography.tabular`** (já embutido nos estilos
`amount*`). Sem dígitos de largura fixa, uma coluna de totais dança na
horizontal a cada atualização e R$ 9,90 não alinha com R$ 10,00.

### 4.1 `analyze` limpo é condição de entrega

`flutter analyze` **precisa** terminar com `No issues found!`. O
`analysis_options.yaml` promove a erro coisas que a maioria dos projetos deixa
passar (`prefer_const_constructors`, `avoid_print`,
`always_declare_return_types`) e liga `strict-casts`, `strict-inference` e
`strict-raw-types`. Consequências práticas:

- literais de coleção levam o tipo: `<Widget>[...]`, `<String>{...}`
- variáveis locais declaram o tipo: `final Money total = ...`
- `prefer_final_locals`, `require_trailing_commas`, `prefer_single_quotes`
- **imports sempre absolutos**: `package:citybox_pdv/...`, nunca `../`

Nunca silencie um lint com `// ignore:` sem um comentário na linha acima
explicando por quê.

### 4.2 Ordem dos imports

`directives_ordering` está **desligado** de propósito (ele jogaria
`package:citybox_pdv/...` acima de `package:flutter/...`). A convenção é dizer de
onde a dependência vem antes de dizer como se chama:

```dart
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/pos/domain/cart.dart';
```

Blocos separados por linha em branco, cada bloco em ordem alfabética.

### 4.3 Imutabilidade

`final` por padrão, `const` sempre que possível. Models imutáveis com
`copyWith`. Estado de controller nunca é mutado no lugar — `state =
state.copyWith(...)`. Listas em `state` são substituídas, nunca sofrem `.add()`.

### 4.4 Riverpod sem code-generation

```dart
final NotifierProvider<CartController, CartState> cartProvider =
    NotifierProvider<CartController, CartState>(CartController.new);

class CartController extends Notifier<CartState> {
  @override
  CartState build() => const CartState();

  void addItem(Product product) {
    state = state.copyWith(lines: <CartLine>[...state.lines, CartLine(product)]);
  }
}
```

A escolha é deliberada: sem `build_runner`, sem `.g.dart`, sem um passo de
geração entre editar e ver o resultado. Se um dia o volume de providers
justificar `riverpod_generator`, isso é uma decisão de projeto — registre-a aqui
antes de introduzir o primeiro `@riverpod`.

### 4.5 Dependências entram no primeiro uso, não antes

Runtime atuais: `flutter_riverpod`, `go_router`, `shared_preferences`,
`intl`/`flutter_localizations`, `window_manager` (desktop). Novas dependências
só quando houver o primeiro uso real — não adicionar "por precaução".

### 4.6 Dinheiro em centavos, sempre

Quando houver valor monetário: **inteiro em centavos**, nunca `double`.
`0.1 + 0.2 != 0.3` em ponto flutuante, e num fechamento de caixa isso vira
divergência que ninguém consegue explicar. Domínio counter/payment usa
`priceCents` / `*Cents`; formatação só na UI via `formatCents` em
`core/format/pdv_currency.dart`. É a mesma convenção das APIs Citybox.

### 4.7 Responsividade por formato de tela, nunca por plataforma

```dart
// ERRADO — um tablet Android de balcão opera como desktop,
// e uma janela de desktop pode estar estreita
if (Platform.isAndroid) { ... }
```

Decida por largura disponível. Os três modos de operação do PDV:

| Formato | Largura | Operação |
|---|---|---|
| compacto | < 720 | celular do garçom — uma coisa por vez |
| médio | 720–1199 | tablet no balcão — catálogo + pedido |
| expandido | ≥ 1200 | caixa fixo — tudo simultâneo |

**Breakpoints entregues (Fase 2):** `lib/core/layout/pdv_breakpoints.dart` —
`PdvFormat` compact (&lt;720) / medium / expanded (≥1200). Balcão e Pagamento
usam `LayoutBuilder` + `PdvFormat`. Telas food (Mesas/Comandas/fila/Delivery)
também respondem à largura.

### 4.7.1 Toda tela tem saída — o Voltar não é opcional

O `PdvScaffold` desenha o **Voltar** na app bar padrão com `showBack: true`
**por default**. Isso é deliberado: tela sem saída é defeito, então o caminho
preguiçoso — não passar nada — tem que ser o correto. Só a raiz (`/`) e
`/sale-completed` passam `showBack: false`, e cada uma diz no código por quê.

Quem passa `appBar:` própria assume o Voltar dentro dela — é o caso do Balcão
(`CounterAppBar`), Pagamento (`PaymentAppBar`), cadastro de Cliente,
Configurações, Caixa, Sangria e Últimas vendas.

O destino sai sempre de **`popOrHome(context)`** (`app/shell/pdv_back.dart`),
nunca de um `context.pop()` seco: numa tela alcançada por `go` não existe rota
anterior, e o `pop` silencioso prende o operador.

`test/widget/back_button_coverage_test.dart` percorre **as 16 rotas
navegáveis** e falha se alguma ficar sem Voltar — tela nova sem saída quebra a
suíte.

🚫 **`AppBar` do Material não entra aqui.** Mesas, Comandas, Atendimentos e
Delivery usavam uma, dentro do `PdvScaffold`, e ficavam com altura, cor e
tipografia fora do padrão. Nenhuma tela do app usa mais. Se precisar de ação
própria na barra, use `PdvAppBarChrome` + `PdvAppBarButton` (exemplo:
`delivery_orders_page.dart`); se não precisar, não passe `appBar` nenhuma.

**Título da tela não vai na app bar** — vive na barra de título. Repetir o
nome nos dois lugares foi o que manteve as `AppBar` cruas vivas por tanto
tempo.

**O título é derivado da rota**, por `pdvPageTitleForLocation` em
`app/router/pdv_router.dart`, lido pela `PdvTitleBar`. 🚫 **Nunca chame
`setTitle` antes de um `push`/`go`.** Era assim que funcionava, com ~27
atribuições espalhadas, e ninguém devolvia o título no `pop`: voltar de Mesas
para o Início deixava "Mesas" na barra. Tela nova só precisa entrar no `switch`
da função — se esquecer, cai em "Citybox PDV", não no nome da tela anterior.

`pageTitleOverrideProvider` (`String?`, `null` = derive da rota) é a **única**
exceção, e existe só para páginas empurradas pelo `Navigator` fora do
`go_router` — hoje apenas o cadastro de cliente aberto pelo seletor, via
`pushWithPageTitle`, que grava e limpa. Trava em
`test/widget/page_title_from_route_test.dart`.

### 4.7.2 Fechar caixa é fixo na barra, e mora no chrome

O **Fechar caixa** é o último botão da app bar, encostado na borda direita, em
**toda** tela. Ele é montado pelo `PdvAppBarChrome` (`app/shell/`), não pelo
`child` que cada tela passa — mesma razão do Voltar em 4.7.1: se cada tela
tivesse que lembrar de incluí-lo, a próxima nasceria sem.

Foi por isso que `pdv_app_bar_chrome.dart` **saiu de `lib/ui/`** e foi para
`lib/app/shell/`: para montar a ação ele precisa ler o turno
(`cashShiftProvider`) e navegar, e `lib/ui/` não pode depender de feature nem
de rota.

Três opt-outs, e só três, via `showCloseShift: false`:

| Tela | Por quê |
|------|---------|
| Balcão (`CounterAppBar`) | venda em andamento — `saleInProgress` recusa o fechamento |
| Pagamento (`PaymentAppBar`) | idem |
| Fechamento (`CashClosePage`) | já se está nela |

O botão **some sozinho quando não há turno aberto** — oferecer o fechamento de
um caixa fechado é botão que só sabe dar erro. Ele é **só ícone**
(`Icons.exit_to_app`), com o nome no tooltip: numa barra que já carrega Voltar,
cliente e loja, mais um rótulo comprido empurraria os outros para fora.

🚫 **Não existe mais "Sair" na `PdvAppBar`.** Dois botões de saída lado a lado,
um fechando o turno e o outro não, é convite para o operador clicar no errado
no fim do expediente — e o "Sair" nem encerrava sessão nenhuma, era um toast de
"não implementado". Quando houver login de verdade, ele volta no menu lateral,
não colado no fechamento de caixa.

Trava em `test/widget/close_shift_action_test.dart`: 12 rotas exigem o botão,
Balcão e Pagamento exigem a ausência dele.

### 4.7.3 Fechamento confere cinco canais, não só a gaveta

`/cash/close` (`CashClosePage`) pede **Dinheiro, Cartão de Crédito, Cartão de
Débito, Voucher e Outros** — os cinco canais de `CashCloseChannel`
(`features/cash/domain/cash_close_channel.dart`), que agrupam as formas de
pagamento do catálogo. Forma sem canal próprio cai em **Outros**, para que uma
forma nova cadastrada na loja continue sendo conferida em vez de sumir.

Duas decisões que o código depende:

- **Dinheiro é a gaveta** (`expectedDrawerCents`), não a soma dos pagamentos em
  dinheiro: entram fundo de abertura e reforços, saem sangrias e troco. Os
  outros quatro canais são soma de pagamentos das vendas **concluídas**.
- **Os campos nascem vazios e o esperado não aparece ao lado deles.** Conferência
  com a resposta na tela vira um "Enter". O confronto sai depois, no resumo por
  canal, com o sinal explícito da diferença.

O antigo `closeCashShiftDialog` do `CashHubPage` **foi removido**: pedia só o
dinheiro e fechava o mesmo turno por um caminho mais fraco. O botão do hub
agora navega para a tela.

### 4.8 Alvo de toque

`PdvSizes.controlHeight` é **56 px**. O mínimo absoluto de um alvo de toque é
44 px (WCAG 2.2 / HIG); 56 dá margem no desktop. `controlHeightSm` (toolbar do
Balcão) é **48**. `controlHeightLg` (ação principal) é **64**. **Não reaproveite
alturas de 36/40 px** do backoffice web.

### 4.8.1 Campos e diálogos desktop

- **Dinheiro: `PdvMoneyField`, sempre.** Qualquer campo de valor usa
  `lib/ui/pdv_money_field.dart` — nunca `PdvFilledField` com um filtro de
  dígitos. A máscara é de **caixa registradora**: só dígitos, preenchendo dos
  centavos para cima (`1` → R$ 0,01, `1250` → R$ 12,50), sem vírgula para
  acertar. Leia o valor com `PdvMoneyField.centsOf(controller)` ou
  `onChangedCents`; nunca com `int.tryParse` sobre o texto, que agora vem
  mascarado. Campo em branco fica **vazio**, não "R$ 0,00".

  Isto existe porque `50` era ambíguo e o app discordava de si mesmo: três
  telas liam centavos crus ("Ex.: 5000 = R$ 50,00") e quatro liam reais. Trava
  em `test/widget/pdv_money_field_test.dart` e `test/unit/pdv_currency_test.dart`.

- **Campos: o padrão é o `TextField` _filled_ do Material — nunca o
  _outlined_.** Preenchido (`filled: true` + `PdvColors.inputFill`) com
  **underline**, sem contorno fechado em volta. Campo preenchido *e* contornado
  desenha um retângulo dentro do outro; a caixa quem faz é o preenchimento, e o
  traço fica só embaixo.

  O tema (`pdv_theme.dart`) já aplica isso em `InputDecorationTheme`, então um
  `TextField()` sem decoração **já nasce correto** — o `filled` do tema só é
  perdido se a tela declarar o próprio. Para forms, use
  `pdvFilledDecoration` / `PdvFilledField` (`lib/ui/pdv_filled_field.dart`).

  🚫 **Não use `OutlineInputBorder`** em campo de formulário, nem passe
  `filled: false`. `test/widget/input_filled_standard_test.dart` trava os dois
  (tema e helper) e quebra se o contorno voltar.

  Exceções conscientes — campos embutidos numa moldura que **já tem fundo
  próprio**, onde um segundo preenchimento empilharia superfície sobre
  superfície: busca e código de barras da toolbar do Balcão
  (`counter_toolbar.dart`), linha do documento (`counter_document_row.dart`),
  células editáveis da lista de itens (`counter_cart_table.dart`) e a busca na
  app bar de Últimas vendas. Fora dessas, campo sem fundo é defeito.
- **Diálogos:** larguras em `PdvSizes.dialogMdWidth` (560) / `dialogLgWidth`
  (720); corpo via `PdvDialogBody` (`lib/ui/pdv_dialog.dart`). Formulários
  curtos → `medium`; listas com busca → shell `PdvEntityPickerDialog`
  (`lib/ui/pdv_entity_picker_dialog.dart`, clientes e vendedores) com
  `dialogCustomerListHeight`. Não espalhe larguras fixas (`480`/`360`/`720`)
  nas features.
- **Seções de form / KPIs:** `PdvFormSection`, `PdvFormFrame`, `PdvStatCard` em
  `lib/ui/pdv_form_section.dart` — hub de caixa, sangria, settings, histórico.

### 4.9 Tamanho de arquivo

200–400 linhas típico, **800 máximo**. Quebre em widgets privados
(`class _Foo extends StatelessWidget`) no mesmo arquivo enquanto forem só desse
arquivo; mova para `presentation/widgets/` quando passarem a ter vida própria.

### 4.10 Segurança (quando a integração chegar)

- Token e credencial em `flutter_secure_storage` — nunca em `SharedPreferences`
  nem em arquivo local em texto claro.
- Nenhum segredo no código. `--dart-define` para configuração de build (que não
  é segredo — é só configurável).
- HTTPS obrigatório; `cleartextTrafficPermitted=false` no
  `network_security_config.xml` do Android.
- Timeout explícito em todo cliente HTTP.
- Release Android com `--obfuscate --split-debug-info=`; o diretório de
  debug-info fica fora do versionamento.

Regras completas em `.claude/rules/ecc/dart/security.md`.

### 4.11.0 Módulos — quem decide o que aparece

**A fonte é o ERP**, em *Ponto de venda → Configurações → Módulos* (padrão da
loja) e na seção Módulos do cadastro de cada PDV (sobrescrita do terminal). O
app **lê** de `GET /v1/pos/modules` e aplica.

`HttpModuleConfigSource` substituiu a `FixtureModuleConfigSource` — a interface
`ModuleConfigSource` existia desde o M0 justamente para esta troca. Ordem de
tentativa em `load()`:

| # | Fonte | Quando |
|---|---|---|
| 1 | **Servidor** | terminal pareado e com rede; grava no cache ao voltar |
| 2 | **Cache local** | sem rede — o último conjunto conhecido |
| 3 | **Perfil neutro** | primeiro boot offline. Nunca "tudo ligado por acidente" |

⚠️ **A rota devolve o conjunto já resolvido** — padrão mesclado com sobrescrita.
O app **não remescla**. Se recebesse as duas camadas, teria de reimplementar a
regra do servidor, e uma divergência mostraria mesa que o ERP diz estar
desligada.

`ModuleSetValidator.ensureValid` roda **também sobre a resposta do servidor**,
não só sobre o cache: a garantia do núcleo não pode depender de qual
implementação de `PosModuleApi` está injetada. **Exceções temporárias:**
`credit`/`refund` (núcleo) e `tables`/`tabs` (opcionais —
`temporarilyDisabledOptional`) ficam `disabled` até existirem APIs/sync ERP;
`delivery` **espelha** `delivery_orders` (um módulo Delivery no produto).
Perfis de segmento offline espelham o mesmo estado.

🚫 **Não há painel de edição de módulos no app.** Configurar é só no ERP.
`save()` no `HttpModuleConfigSource` grava **só no cache** (fallback offline /
overrides de teste) — nunca manda alteração de volta ao servidor. A seção
Módulos em Configurações é **somente leitura**.

Repareamento **rebusca**: `ref.listen` na credencial dispara `refresh()`, porque
o terminal pode ter sido pareado noutra loja.

⚠️ **O catálogo é duplicado com a `erp-api`** — TypeScript de um lado, Dart do
outro, sem pacote compartilhado possível. A trava é
`test/unit/module_catalog_contract_test.dart` aqui e
`pos-module.catalog.spec.ts` lá; ela já pegou uma divergência real (`settings`
faltando no núcleo da API).

### 4.11.2 Catálogo de produtos — Balcão e Consulta de preço

**A fonte é o ERP** (`GET /v1/pos/catalog` sob `DeviceAuthGuard`). O preço já
chega **resolvido** para o canal `pdv` — o app **não** remescla listas de preço.

`HttpCatalogSource` + `catalogProvider` (`features/catalog/`):

| # | Fonte | Quando |
|---|---|---|
| 1 | **Servidor** | terminal pareado e com rede; grava no cache ao voltar |
| 2 | **Cache local** (`pdv.catalog.v1`) | sem rede — último snapshot conhecido |
| 3 | **Vazio** | primeiro boot offline. **Nunca** a fixture de produtos |

A fixture `counter_catalog.dart` permanece **só para testes** (`FixtureCatalogSource`
/ override de `catalogProvider`). Produção sem rede e sem cache = grade vazia
(`PdvEmptyState`), não o cardápio de demo.

Balcão (grade, sidebar, barcode) e Consulta de preço leem de `catalogProvider`.
`hydrate()` no boot (junto às outras hidratações); repareamento dispara
`refresh()` — pode ser outra unidade.

**Consulta de preço — sync ao abrir.** Ao entrar em `/price-check`, a tela
chama `refresh(preferNetwork: true)` (`HttpCatalogSource.loadFresh`): força o
ERP e mostra “Atualizando preços…”. Sem rede, mantém o snapshot em memória e
exibe aviso + botão **Atualizar**. A consulta pelo barcode continua liberada
durante o sync (usa o cache até a resposta chegar; se já havia resultado na
tela, reavalia após sync ok).

**Estoque no lançamento.** O snapshot inclui `trackStock` + `stockQty` (saldo
no depósito default da unidade; `null` se sem controle ou sem depósito). A
grade mostra “Sem estoque” quando `trackStock && (stockQty ?? 0) <= 0`
(inclui negativo), mas **não bloqueia** toque/scan/qty — a venda sempre
pode seguir; o ERP aceita saldo negativo na baixa. Após venda ok, o app
decrementa `stockQty` local (pode ficar negativo) e faz `refresh()` em
background.

**Variantes (`grid`).** O servidor flattena o produto cartesiano; `composite`
chega com `variants: []` e o PDV trata como item simples. Quando
`product.hasVariants` (lista não vazia), o Balcão **sempre** abre
`VariantGridDialog` — vender o pai sem SKU é bug, independente do módulo
`variant_grid`. O mesmo no código de barras: scan do barcode do **pai**
devolve `BarcodeSubmitResult.needsVariant` e não lança; scan do barcode da
variante (uma opção só no combo) lança a linha com `skuId`/`variantLabel`.
`variant_grid` no catálogo de módulos continua existindo para o perfil Loja
(atalho/visibilidade residual), mas **não** é o portão do picker.

⚠️ Fora desta fatia: imagens MinIO, Drift, `allowsHalf` (fica `false` até o
ERP modelar meia). Chooser de `composite` (adicionais/ponto de carne) não
entra nesta fatia. Clientes CRM estão em §4.11.3; checkout em §4.11.4.

### 4.11.3 Clientes CRM — seletor e cadastro rápido

**A fonte é o ERP** (`GET`/`POST /v1/pos/customers*`, `GET /v1/pos/customer-categories`
sob `DeviceAuthGuard`). O CRM JWT (`/v1/customers`) **não** serve ao terminal.

`HttpCustomerCatalogSource` + `customerCatalogProvider` (`features/customer/`):

| # | Fonte | Quando |
|---|---|---|
| 1 | **Servidor** | terminal pareado e com rede; busca com debounce ~400 ms (`search`) |
| 2 | **Cache local** (`pdv.customers.v1`) | sem rede — último resultado conhecido (lista recente / search vazio) |
| 3 | **Vazio** | primeiro boot offline. **Nunca** a fixture de clientes |

A fixture `customer_catalog.dart` / `seedCustomers` permanece **só para testes**
(`FixtureCustomerCatalogSource`). Produção sem rede e sem cache = lista vazia
(`PdvEmptyState`).

- `hydrate()` / `refresh()` no boot e no repareamento (junto ao catálogo).
- **Novo** no form → `POST /v1/pos/customers` (upsert no provider; opcional
  “Salvar e selecionar”). Sem rede: create recusado com mensagem clara (sem fila).
- **Cliente existente** nesta fatia: só leitura / seleção — sem PUT no device.
- Categorias do form: `GET /v1/pos/customer-categories` (cache leve).
- **Data de nascimento:** máscara `dd/MM/yyyy` (`birthDateMaskFormatter`); API recebe ISO `yyyy-mm-dd`.
- **CEP:** máscara `#####-###`; ao completar 8 dígitos → `GET /v1/pos/cep/:digits` (debounce 400 ms). Loading desabilita demais campos de endereço; falha/offline → SnackBar + preenchimento manual.

⚠️ Fora: edição/exclusão no servidor, sync offline de create em fila,
campo `gender` (só mock local antigo). Checkout com `customerId` → §4.11.4.

### 4.11.4 Checkout online — meios, venda e cupom não fiscal

**Modo online-only.** Sem rede ou erro 4xx/5xx no `POST /v1/pos/sales` →
SnackBar, permanece em Pagamento; **não** grava venda fantasma só no turno.

| Peça | Endpoint / artefato |
|---|---|
| Meios ativos | `GET /v1/pos/payment-methods` → cache `pdv.payment_methods.v1` |
| Vendedores | `GET /v1/pos/sellers` → cache `pdv.sellers.cache.v1`; `sellerId` = **userId** |
| Fechar venda | `POST /v1/pos/sales` (`SaleOrder` `closed`, `channelId=pdv`; `discountAuthorizedByUserId` se desconto acima da alçada) |
| Cancelar venda | `POST /v1/pos/sales/:id/cancel` (online-only; depois `cancelSale` local) |
| CPF/CNPJ na nota | `invoiceDocumentProvider` → `consumerDocument` no body |
| Espelho local | `CashShiftController.recordSale` após sucesso; `cancelSale` após cancel remoto |
| Cupom | CTA **CUPOM** / `showNonFiscalReceiptDialog` (não fiscal; sem emissão NFC-e nesta fatia) |
| Fiscal settings | `GET /v1/pos/fiscal-settings` → `posFiscalSettingsProvider` (SharedPreferences); indicador Sefaz **nunca verde** até emissão real |

`PaymentMethod.id` = UUID do ERP (vai no POST). Comportamento local
(`isCash`, bandeiras, canal de fechamento) usa `systemKey`
(`pm-dinheiro`, `pm-pix`, `pm-cartao`, …). Fixture `payment_catalog.dart`
**só em testes**.

**Vendedor da venda:** lista via `terminalSellersProvider` (API + cache;
sem fixture em produção). Default **E**: se não há escolha e o operador
logado está na lista, pré-seleciona ele (`saleSellerProvider` /
`prepareForNewSale` no `resetOpenSale`). Troca de operador **reaplica** o
default do novo (não gruda o vendedor anterior). “Sem vendedor” e troca
manual permanecem. Fixture `testSellers` só em testes.

Fluxo: Finalizar → `completeSaleOnline` → loading → sucesso navega
`/sale-completed` (reset do carrinho + dialog do cupom). **CUPOM** e
"Reimprimir" (histórico) reabrem o mesmo dialog não fiscal.

`buildPosSaleBody` envia `discountAuthorizedByUserId` quando
`SaleAdjustment.authorizedByOperatorId` está preenchido — o servidor
revalida a alçada (`PosPolicy.requiresSupervisorForDiscount`).

Fora: fila offline, TEF, NFC-e/SAT emissão, impressora real.
**Caixa/turno no servidor:** entregue — ver §4.11.5.

**Cancelamento de venda** (`sale_detail_page`): exige rede + `serverSaleId`;
após `requestException`, chama `PosSalesApi.cancel` e só então
`cashShift.cancelSale`. Falha da API → SnackBar via
`cancelSaleErrorMessage` (códigos conhecidos) e **não** altera o cache local.
Número na UI: `displaySaleNumber` = `serverNumber ?? number`. Sem
`serverSaleId` ou offline → recusa.

### 4.11.5 Turno de caixa no servidor

Abrir, sangrar/reforçar e fechar o caixa passam por
`PosCashSessionApi` (`features/cash/data/pos_cash_session_api.dart`) →
`/v1/pos/cash-sessions` (Device auth). `CashShiftController`:

- `hydrate`: GET current; sessão → mapeia + mantém movimentos locais se mesmo id;
  em seguida `refreshSessionSales` (GET `…/current/sales`) **substitui** a lista
  de vendas pela do servidor quando online; `null` limpa cache; offline/falha →
  fallback do cache aberto (vendas locais preservadas).
- `refreshSessionSales`: chamado no hydrate e ao abrir Últimas vendas; lista
  vazia no servidor zera histórico fantasma. `sessionSaleToSaleRecord` mapeia
  `operatorName`, `methodId`/`methodSystemKey` e **recalcula** `cashNetCents`
  (dinheiro − troco) — sem isso o esperado em gaveta vira só fundo ± sangrias.
- `openShift` / `addWithdrawal` / `addReinforcement` / `closeShift` (5 canais
  `CashCloseCounts`): POST no servidor; falha **não** inventa turno local.
- `recordSale` / `resetSaleNumbering`: espelho local após checkout online /
  numeração.
- `cancelSale`: só após `POST /v1/pos/sales/:id/cancel` bem-sucedido
  (ver §4.11.4) — não cancela só no cache.

**Branding:** `DeviceCredential.organizationName` / `branchName` (redeem +
refresh `GET /v1/pos/terminal`); `establishmentNameProvider` =
`branchName ?? organizationName ?? terminalName ?? 'Loja'`.

### 4.11.1 Abertura do app — o que o operador vê, em ordem

`main()` inicializa locale pt-BR e, no desktop, a janela sem decoração do
sistema. No primeiro frame dispara as hidratações em paralelo: credencial,
alçada, contador de tentativas, cache de operadores (+ `sync`), módulos,
**catálogo**, **clientes**, **meios de pagamento**, turno, configurações,
salão, devolução, crédito e **fiscal settings**.

**A `initialLocation` é `/starting`, não a Home.** Enquanto o cofre não foi
lido, o `redirect` não tem como decidir, e o que estiver como rota inicial é o
que fica na tela nesse intervalo. Com a Home ali, o PDV **piscava a tela
operacional** — blocos de venda visíveis — antes de saber quem estava no caixa.
Mandar para a ativação também não serve: piscaria em todo boot de terminal já
pareado. Daí a terceira tela, que não é nenhuma das duas.

`StartingPage` é deliberadamente sem ação: sem menu, sem Voltar, sem Fechar
caixa. A barra de título fica, e não é enfeite — no desktop é ela que oferece
arrastar, minimizar e fechar, porque a janela é desenhada sem decoração do
sistema.

Depois da hidratação, os três guards decidem, **nesta ordem**:

| Estado | Primeira tela | Por quê |
|---|---|---|
| Nunca pareado | `/terminal/activate` | Sem credencial não há loja. Nenhuma outra rota é alcançável |
| Pareado, app recém-aberto | `/operator/login` | **Sempre** — a sessão do operador não é persistida; fechar o app é sair |
| Operador entrou, sem turno | Home | Tocar em algo que exige caixa leva a `/cash?intent=open`, que abre o diálogo de abertura sozinho |
| Operador entrou, turno aberto | Home | O turno **é** persistido: reabrir o app no meio do expediente não faz reabrir caixa |

`/starting` não é alcançável depois do boot — navegar para lá devolve a Home.
O guard dela fica **depois** dos outros de propósito: sem credencial ou sem
operador, quem tira de lá são eles, para a rota final sair certa numa passada
só.

Trava em `test/widget/boot_first_screen_test.dart`, que monta o **router real**
(não o harness de `pumpWithRouter`): o bug estava justamente na
`initialLocation` de produção, e um harness com redirect próprio passaria
mesmo com ela errada.

### 4.10.1 Quando o cofre não existe

`flutter_secure_storage` depende de um provedor de `org.freedesktop.secrets`
no Linux. Em desktop com GNOME/KDE ele existe; em **WSL2, headless ou
container, não** — e o plugin levanta `PlatformException`.

**Não há plano B, e isso é decisão.** O que mora no cofre é credencial: token
do terminal e hashes de PIN. Cair para `SharedPreferences` trocaria uma falha
visível por um vazamento silencioso.

O tratamento está em `core/storage/secure_store_failure.dart`, e é assimétrico
de propósito:

| Operação | Cofre indisponível | Por quê |
|---|---|---|
| **Ler** qualquer coisa | vira "não existe" | Todas as ausências erram para o lado seguro: sem credencial cai na ativação, sem alçada vale a restritiva, sem cache não há login offline |
| **Gravar a credencial** | **lança** `SecureStoreUnavailableException` | O código de pareamento é de uso único. Um "ativado" que não persiste queima o código por nada, e o gerente gera outro atrás do outro sem entender |
| **Gravar alçada / cache / contador** | silencioso | São caminhos de fundo, e a consequência já aparece: a alçada é rebuscada a cada boot; sem cache, a barra de título avisa que não há entrada sem rede |

⚠️ **No Linux o plugin guarda todas as chaves num único item libsecret** (JSON
com read-modify-write). Acesso concorrente no boot apagava a credencial do
terminal: o ERP seguia "pareado" e o PDV pedia ativação de novo. Todas as
leituras/escritas passam por `runInVault` (fila global); o boot hidrata a
credencial **antes** de alçada/cache. Trava em `test/unit/vault_gate_test.dart`.

⚠️ **`hydrate()` marca `markHydrated` no `finally`.** Esse sinal é o que tira o
app da tela de abertura — sem ele, uma falha na leitura deixa o PDV **preso
carregando para sempre, sem mensagem**. Foi exatamente o que aconteceu num
Linux sem chaveiro. Vale para qualquer hidratação que alimente um guard do
router.

Para rodar em WSL2, ver a Parte 0 do roteiro manual
(`.claude/plans/_platform/roteiro-manual-erp-pdv.md`) — cofre de credenciais em
0.4 e o **bloqueio conhecido da janela sob WSLg** em 0.1.

Trava em `test/widget/vault_unavailable_test.dart`, que intercepta o **canal de
plataforma** do plugin e levanta a `PlatformException` real — testar contra um
fake que lança provaria só o fake.

### 4.12 Terminal pareado — a credencial que dá identidade ao app

Um PDV recém-instalado **não opera**. O redirect do router manda tudo para
`/terminal/activate` até haver credencial no cofre — sem isso, bastaria ter o
app e um PIN de funcionário para vender em nome da loja de qualquer lugar.

**Ordem dos guards é única e explícita: credencial → operador → turno.** Os
três estão no mesmo `redirect` de `pdv_router.dart`, nessa sequência, com
retorno cedo. Redirects independentes competindo produziriam laço de
navegação.

`deviceCredentialHydratedProvider` existe para separar **"ainda não sei"** de
**"não está pareado"**: enquanto a leitura assíncrona do cofre não volta, o
redirect não decide nada. Sem essa distinção o app pisca a tela de ativação em
todo boot de terminal já pareado.

🚫 **A credencial nunca vai para `SharedPreferences`.** Cofre do sistema
(`flutter_secure_storage`), via `SecureDeviceCredentialStore`. O token dá
direito de vender em nome da loja; em texto claro, ele sai junto num backup do
dispositivo.

**Organização e unidade vêm da credencial, não de escolha do app.** O PDV não
decide em nome de que loja está vendendo — quem resolve isso no servidor é o
`DeviceAuthGuard`, a partir do terminal.

Configuração da URL por `--dart-define=PDV_API_BASE_URL=…`. Não é segredo, é
configuração — muda entre dev, homologação e loja.

Em Configurações → Terminal, com o terminal pareado a **identificação vira só
leitura** (vem do ERP) e aparece **Desativar terminal**, que apaga a credencial
local. Isso **não** revoga no servidor: revogar é ação do gerente no ERP.

### 4.12.1 Revogação — quando o gerente desliga o terminal

Revogar em **ERP → Ponto de venda → Cadastros → Revogar dispositivo** derruba a
credencial no servidor. O PDV descobre na primeira requisição que fizer e
**despareia sozinho**, voltando para a tela de ativação com o aviso de que o
acesso foi encerrado.

**A detecção é por `error.code`, nunca por mensagem.** Os dois 401 de
`v1/pos/*` pedem reações opostas:

| `code` | Significa | O app faz |
|---|---|---|
| `PosTerminalDeviceUnauthorizedError` | credencial do **dispositivo** recusada | apaga o cofre, derruba sessão e cache, vai para a ativação |
| `PosOperatorCredentialsUnauthorizedError` | **PIN de operador** errado | conta uma tentativa e mostra o erro no login |

⚠️ Confundir os dois faria um **dedo escorregado no PIN desparear o terminal**,
e o caixa pararia até o gerente gerar código novo. A trava é
`test/widget/device_revoked_test.dart`.

O detector mora no **interceptor `onError` do `PdvApiClient`**, não em cada
chamada: o cenário comum é o terminal ser desligado enquanto está parado na tela
de login, e quem descobre é a busca da lista de operadores ou a sincronização de
fundo — nenhuma das duas tem tela esperando resposta. O cliente HTTP só avisa
por callback (`onDeviceUnauthorized`); quem apaga cofre e navega é o
`DeviceCredentialController`, porque cliente HTTP não deve conhecer router nem
cofre.

`_handleRevoked` é **idempotente**: uma revogação costuma ser descoberta por
três requisições ao mesmo tempo, e sem a guarda seriam três limpezas e três
reavaliações de rota para o mesmo fato.

Sessão do operador e cache offline caem junto, por `ref.listen` na credencial —
mesma mecânica da alçada (§4.14). A direção da dependência é operadores →
terminal, nunca o contrário.

🚧 **A revogação só faz efeito quando o dispositivo alcança o servidor.** Um
terminal sem rede com cache válido continua operando por até 48 h (§4.15). O TTL
do cache é o limite real da revogação, não o clique no ERP.

### 4.13 Sessão do operador — entrar, bloquear, trocar

Terminal pareado ainda não vende: falta saber **quem** está no caixa. Sem
sessão, todo caminho cai em `/operator/login` (código + PIN, contra
`POST /v1/pos/operators/authenticate`).

Três estados distintos, e a diferença entre eles é o ponto:

| Ação | Sessão | Turno | Carrinho |
|---|---|---|---|
| **Bloquear** | intacta | aberto | intacto |
| **Trocar operador** | zerada | **aberto** | intacto |
| **Desativar terminal** | zerada | aberto | **zerado** |

🚫 **Nenhuma delas fecha o caixa.** Fechar turno é operação de dinheiro, com
conferência, e tem tela própria.

O **bloqueio mora no `builder` do `MaterialApp`**, não numa rota
(`OperatorLockOverlay`): por cima do `Navigator` ele cobre também diálogos
abertos, que uma rota nova deixaria visíveis por baixo. Desbloquear passa pela
API como qualquer login — bloquear a tela não pode virar um caminho de
autenticação mais fraco que a entrada normal.

`InactivityLocker` (também no `builder`) bloqueia por tempo parado.
**Desligado por padrão** (`TerminalSettings.lockAfterMinutes == 0`): num balcão
movimentado o bloqueio automático interrompe venda em andamento; quem liga é a
loja onde o terminal fica sozinho.

**As tentativas erradas são contadas também no dispositivo**
(`OperatorSessionController.attemptsFor`). Parece redundante com o contador do
servidor e não é: no M4 o PIN passa a ser conferido offline, e um contador que
só existisse no servidor seria zerado por qualquer queda de rede.

⚠️ **Não há token de sessão de operador.** O que autentica cada requisição
continua sendo a credencial do **terminal**; o operador é estado local do app.
Isso basta enquanto nenhuma rota precisa saber *qual* operador está agindo —
quando o checkout contra a API entrar, o `operatorId` vai no payload e o
servidor valida contra a unidade do terminal. Emitir token agora seria emitir
o que ninguém verifica.

O turno abre **em nome de quem está logado** — não há seletor de operador no
diálogo de abertura (isso era do M0, quando não havia login).

### 4.14 Alçada — até onde o operador vai sozinho

Acima do limite, o PDV para e pede o **PIN de um supervisor**. Os limites são
cadastrados no ERP (Ponto de venda → Configurações → Alçadas) e chegam por
`GET /v1/pos/policy`.

**A decisão mora na entidade `PosPolicy`, não nas telas.** Três telas fazem a
mesma pergunta ("preciso de supervisor?"), e a resposta espalhada em `if` de
widget é a forma clássica de uma delas divergir — quase sempre a menos
visitada, que é onde o furo interessa a quem quer burlar.

| Operação | Compara | Onde é pedido |
|---|---|---|
| Desconto | **percentual** do subtotal | `counter/.../sale_adjustment_row.dart` |
| Sangria | **permissão** `pdv.operacao.caixa.withdrawal` + **centavos** (alçada) | `cash/presentation/cash_movement_page.dart` |
| Cancelamento | liga/desliga | `sales_history/presentation/sale_detail_page.dart` |
| Devolução | liga/desliga | (ainda não ligado — `refund/` não passa pela alçada) |

**Sangria exige quem tem a permissão fina** (`PosOperator.canWithdraw` ←
`permissionIds` contém `pdv.operacao.caixa.withdrawal`). Se o operador da
sessão não tem, o PDV pede PIN via `authorizeWithPermission` — a lista do
diálogo filtra só quem tem essa permissão (não basta `alcada.authorize`).
Mensagem: *“Este operador não pode registrar sangria…”*. Depois, se o valor
passar do limite de alçada, ainda pode cair em `requestException` /
`alcada.authorize`. **Reforço não exige** `withdrawal`.

**O limite é exclusivo:** com o corte em 10%, um desconto de exatamente 10%
passa. O campo no ERP diz "sem supervisor **até** 10%", e pedir gerente no
valor que a tela apresenta como permitido vira chamado.

**Desconto em reais é convertido para percentual antes de comparar**
(`SaleAdjustment.discountPercentOf`). Sem isso, R$ 90 numa venda de R$ 100
passariam sem supervisor — 90% de desconto pela porta dos fundos.

**Acréscimo e reforço nunca pedem autorização.** Alçada existe para conter o
que **reduz** o que a loja recebe; dinheiro entrando não é o problema.

**`posPolicyProvider` nunca é `null`.** Antes da primeira sincronização vale
`PosPolicy.restrictive` — na dúvida, pede supervisor. Um provider anulável
convidaria a `policy?.requiresSupervisor(…) ?? false`, que é literalmente "sem
política, pode tudo". Falha de rede também não altera o estado: o terminal
continua com a última alçada conhecida.

O cache fica **no cofre do sistema**, não em `SharedPreferences`. O motivo é
integridade, não sigilo: `SharedPreferences` é XML em texto claro que qualquer
um edita num aparelho com root, e o que está guardado ali é justamente até onde
o operador vai sem pedir autorização.

**Autorizar não troca a sessão.** `SupervisorAuthorizer` existe em vez de
reusar `OperatorSessionController.signIn` justamente por isso: `signIn` publica
o operador na sessão, e autorizar um desconto passaria a transferir o caixa
para o supervisor — as vendas seguintes sairiam no nome errado, um erro
silencioso que só apareceria no fechamento.

**Quem autorizou fica no registro**, e em campos separados por operação:

| Campo | Onde | Por quê |
|---|---|---|
| `authorizedByOperatorId`/`Name` | `SaleAdjustment` | a autorização é **do desconto** |
| `cancellationAuthorizedByOperatorId`/`Name` | `SaleRecord` | nome longo de propósito |
| `authorizedByOperatorId`/`Name` | `CashMovement` | uma exceção por movimento |

Um `authorizedBy` genérico no `SaleRecord` colidiria com a autorização do
desconto: a mesma venda pode ter as duas exceções, com responsáveis
diferentes, e um par de campos guardaria só a última.

⚠️ **A alçada é enforçada no app, e só nele.** O PIN é conferido pelo servidor;
a **permissão** `pdv.operacao.alcada.authorize` (via
`PosOperator.isSupervisor` ← `permissionIds`) e o limite são conferidos aqui.
Não há mais campo `role` nas respostas device — identidade é Membership
(`id` = userId, `membershipId`, `permissionIds`). Hoje não há rota de venda
para o servidor revalidar a exceção. **Quando o checkout contra a API entrar,
a checagem tem que ser refeita lá** — do contrário a alçada vale apenas para
quem usa o app oficial, e um cliente HTTP qualquer contorna tudo.

**Sem rede, as exceções ficam bloqueadas** — ver §4.15.

### 4.15 Operação sem rede

O caixa continua vendendo com o link caído. O que muda é quem consegue entrar e
o que fica bloqueado.

#### Login offline

`GET /v1/pos/operators/sync` traz **os hashes de PIN** e `permissionIds` dos
membros elegíveis da unidade, com validade de **48 h** carimbada pelo servidor.
É a única rota do sistema que devolve `pinHash`. Cada item: `id` (userId),
`membershipId`, `code`, `name`, `permissionIds`, `pinHash` — sem `role`.

O hash é conferido em Dart por `core/crypto/pdv_pin_hasher.dart`, **espelho do
`PinHasher` da API**. Ele lê `N`, `r` e `p` do próprio valor gravado, e não de
constantes locais — é o que permite mudar o custo no servidor sem quebrar
terminal nenhum. A trava dessa compatibilidade é
`test/unit/pdv_pin_hasher_test.dart`, que confere um hash **gerado pela API**.

⚠️ **Custo medido: ~750 ms com N=65536 num desktop de desenvolvimento.** Num
tablet Android fraco é plausível passar de 2 s. Por isso o login offline usa
`PdvPinHasher.verifyOffThread`, que roda num isolate — 2 s de thread de UI
travada é a tela inteira congelada, que o operador lê como "o caixa travou".
Se doer no aparelho, o parâmetro vem no próprio hash e desce sem migration.

**A regra que não pode ser afrouxada:** o app só cai no cache quando
`PdvApiException.isOffline` — quer dizer, quando a requisição **não chegou ao
servidor**. Um 401 é o servidor dizendo que o PIN não vale; consultar o cache
depois disso ressuscitaria credencial revogada. `receiveTimeout` também não
conta como offline: ali o servidor recebeu e está processando.

| Situação | O que acontece |
|---|---|
| Sem rede, cache válido | entra |
| Sem rede, cache vencido | recusa, dizendo para sincronizar |
| Sem rede, nunca sincronizou | recusa, dizendo para conectar |
| Servidor responde 401 | recusa; **não** consulta o cache |

**O contador de tentativas é persistido** no cofre (`pdv.operator_attempts.v1`).
Em memória ele seria zerado fechando e reabrindo o app — e o bloqueio por
tentativas é a única defesa real de um PIN de 4 dígitos. Desativar o terminal
**não** apaga o contador, pelo mesmo motivo.

Entram no cache **todos os operadores ativos da unidade**, não só quem já
entrou naquele aparelho: o funcionário de cobertura precisa abrir o caixa numa
manhã sem link. Em troca o aparelho guarda credencial da equipe inteira — a
mitigação é o TTL de 48 h e a revogação do dispositivo.

#### Degradação: o que trava e o que não trava

| Continua funcionando | Bloqueado sem rede |
|---|---|
| Vender | Cancelamento (se a alçada o exige) |
| Abrir e fechar caixa | Devolução (idem) |
| Sangria **dentro** do limite | Desconto **acima** do limite |
| Reforço | Sangria **acima** do limite |

⚠️ **É escolha de política, não limitação técnica.** Com o cache offline o PIN
do supervisor *poderia* ser conferido sem rede. O bloqueio existe porque uma
exceção feita offline não pode ser conferida contra o estado do servidor no
momento em que acontece — e é justamente a operação sem testemunha que se quer
evitar. Está escrito aqui para não virar "bug" depois.

A decisão mora em `PosPolicy.blockedOffline`, e o portão único que a aplica é
`policies/presentation/exception_gate.dart` (`requestException`). **As três
telas de exceção chamam o portão; nenhuma consulta `PosPolicy` por conta
própria.** O portão checa offline **antes** de pedir o PIN: chamar o supervisor
até o balcão para depois recusar desperdiça o tempo dele e ensina a equipe a
desconfiar do pedido de autorização.

#### Estado visível

`syncStatusProvider` deixou de ser fixture no que diz respeito à **rede** e ao
**cache offline**:

- `network` vem de `terminalOnlineProvider`, alimentado pelo resultado das
  requisições que o app já faz. **Não é `connectivity_plus`**, e a diferença
  importa: ter Wi-Fi não é ter servidor.
- `offlineCacheExpiresAt` vem do pacote sincronizado. A barra de título ganha um
  terceiro indicador — **só quando há algo a dizer**: vencendo em menos de um
  dia (amarelo) ou vencido/indisponível (vermelho). O aviso aparece **mesmo com
  o terminal online**, que é quando o operador ainda resolve sozinho.

🚧 `pendingSales` **continua fixture** — não há fila offline de vendas.

**`fiscal`** lê `posFiscalSettingsProvider` (`GET /v1/pos/fiscal-settings`):
sem modelo → `ChannelHealth.down` (“Fiscal não configurado”); modelo setado →
`degraded` (“NF configurada · emissão ainda não no PDV”); **nunca `ok`** até
haver emissão real no PDV.

### 4.11 Operador × vendedor — duas perguntas, dois campos

`CashShift`, `SaleRecord` e `CashMovement` guardam **operador**
(`operatorId` + `operatorName`); `SaleRecord` guarda também **vendedor**
(`sellerId`/`sellerName`). Nunca funda os dois:

| | Operador | Vendedor |
|---|---|---|
| Responde | quem **digitou** | de quem é a **comissão** |
| Serve para | auditoria, sangria, cancelamento | relatório de venda |
| Quem atribui | `CashShiftController`, a partir do turno | escolha explícita na tela de Pagamento |

No balcão costumam ser a mesma pessoa; em loja com equipe de vendas, não são.

**O nome vai por cópia, ao lado do id.** Id sem nome vira linha ilegível no dia
em que o funcionário sai do cadastro — e o histórico precisa continuar dizendo
quem operou.

**Quem carimba o operador na venda é o `CashShiftController.recordSale`**, a
partir do operador **logado** embutido no `SaleRecord` (`completeSaleOnline`).
Se a record vier sem operador (espelho legado / teste), cai no quem abriu o
turno. A venda **não** escolhe o próprio operador na UI — Operador ≠ Vendedor.

`openShift` exige `PosOperator`, e o parâmetro é `required`: turno sem dono
produz venda e sangria que ninguém atribui depois, e não há migração que
recupere isso. Campo nulo existe **só** para registro gravado antes destes
campos — a UI mostra `—`, nunca vazio nem `0`.

🚧 **Fixture:** `features/operators/data/operator_catalog.dart` sai no M3 do
plano de autenticação (`.claude/plans/_platform/pdv-erp-auth.plan.md`), quando a
lista vier de `GET /v1/pos/operators`. O domínio já é o definitivo.

---

## 5. Testes

`flutter_test` + `ProviderScope` com overrides. Nada de
`await Future.delayed` para "esperar a UI" — use `tester.pumpAndSettle()`.

| Tipo | Onde | Quando |
|---|---|---|
| Unitário | `test/unit/` | toda regra de domínio e todo controller |
| Widget | `test/widget/` | todo widget com comportamento |
| Golden | `test/golden/` | telas críticas, nos três formatos |
| Integração | `integration_test/` | fluxos de ponta a ponta em aparelho real |

Meta de 80% de cobertura em lógica de negócio. Teste comportamento observável,
não implementação: busque por texto, ícone ou semântica, nunca por tipo de widget
interno. Prefira fakes escritos à mão a mocks para dependências complexas.

---

## 6. Ao integrar com o backend (ainda não é hoje)

Quando o escopo abrir, estes são os contratos do monorepo — levantados de
`apps/erp/api`, `apps/erp/web` e `apps/verticals/food/api`. **Reconfirme antes de
implementar**, porque nada disso está exercitado aqui e o backend se move.

- **Autenticação**: Keycloak, realm `citybox-dev`. O realm **não tem** client de
  PDV — será preciso criar um dedicado (sugestão: `citybox-pdv`, público, PKCE
  S256, redirect próprio). **`citybox-app` não serve como candidato** — é o
  client do app consumidor B2C (`"App Consumidor"`), não do PDV; misturar
  redirect schemes de dois apps diferentes no mesmo client é fonte de bug de
  deep-link. `citybox-backoffice` é confidencial (não serve para PKCE puro em
  app nativo de qualquer forma). Ver `.claude/plans/_platform/pdv-erp-integration.plan.md`
  §3.4/§6.2 para o desenho completo do pareamento.
- **Tenant**: `X-Organization-Id` é **obrigatório** em toda rota de negócio da
  erp-api (ausente → 400). `X-Branch-Id` é opcional. A food-api é store-scoped e
  exige `X-Store-Id`. O vínculo é resolvido no banco (`Membership`), **não** em
  claim do token — o Keycloak autentica, o ERP autoriza.
- **Catálogo, estoque, clientes**: `erp-api` :3114, prefixo `/api/v1/...`.
- **Venda/comanda/checkout**: desde 2026-08-03 a `erp-api` **tem** módulo
  `sales` (`SaleOrder`, com múltiplos pagamentos e baixa de estoque ao fechar)
  — a afirmação anterior de que "a erp-api não tem módulo de vendas" está
  desatualizada. Ainda não é pensado para o ritmo de balcão (ver plano de
  integração citado acima, §3.1/§6.6); a `food-api` :3171 (`contas`, `orders`,
  `POST /v1/sales/quick`) continua sendo a referência de *design* mais próxima
  de um checkout rápido, mas não tem tenancy compatível com a erp-api.
- **Cadastro de terminal (`pos-terminals`)**: primeiro módulo real da
  integração — `erp-api` ganha `POST/GET/PATCH/DELETE /v1/pos-terminals` +
  `POST /v1/pos-terminals/:id/pair` (gera código de pareamento). É o que o
  PDV vai consumir na tela "Ativar terminal" quando a fatia de autenticação
  entrar em escopo. Ver `.claude/plans/_platform/pos-terminals-pdv-integration.plan.md`.
- **Formato**: `{ data, meta }` em listagens, `{ data }` em item único, `204` em
  delete. Erro de domínio: `{ error: { code, message } }`; erro de validação sai
  no formato do Nest: `{ statusCode, message, error }`. Trate os dois.
- **Dinheiro em centavos** e datas em ISO 8601.

---

## 7. Manutenção deste arquivo

Política do monorepo (seção 7 do `AGENTS.md` raiz): ao mudar código, estrutura ou
configuração, **atualize este arquivo no mesmo commit**. Documentação
desatualizada é defeito, não pendência. Nunca remova seções — atualize ou
adicione. Mudança estrutural (nova plataforma, nova dependência de peso, mudança
de stack) também atualiza o `AGENTS.md` da raiz.

---

## 8. Histórico

| Data | Mudança |
|---|---|
| 2026-08-16 | **Home sem atalho Delivery:** só **Pedidos delivery** (atalho `D`); novo pedido só via botão na tela de pedidos. Venda concluída → Pedidos delivery. |
| 2026-08-16 | **Delivery unificado nos módulos:** Home/rótulo **Delivery** (id `delivery_orders`); `delivery` só alias espelhado; Configurações não lista o alias. Espelho do ERP. |
| 2026-08-16 | **Mesas/Comandas desligados até a feature:** `ModuleSetValidator.temporarilyDisabledOptional` força `tables`/`tabs` → `disabled`; perfis de segmento não ligam mais esses ids; Home/drawer escondem via visibilidade (código das telas permanece). Espelho do force na erp-api. |
| 2026-08-15 | **Delivery pago ≠ Concluído:** `saleOrderId`/`isPaid`; tom **Pago**; checkout não força `delivered`; sync cliente no Salvar/Pagar; sheet sem Abrir balcão se pago/concluído + Ver recibo; refresh ao entrar/pós-cancel. |
| 2026-08-15 | **Delivery flow hardening:** lock anti-duplo-commit; cliente do Balcão no commit; `deliveryFeeCents` agrega encargos food; Abrir balcão hidrata carrinho; Voltar com itens confirma; poll preserva closing/linhas ricas; `beginClose` ao pagar. |
| 2026-08-15 | **Delivery rascunho no Balcão:** “Continuar no Balcão” não cria no ERP; pedido só nasce em Salvar/Pagar; Voltar descarta. Kanban não mostra montagem abandonada. |
| 2026-08-15 | **Delivery Balcão — Salvar primário:** dual CTA com **SALVAR E VOLTAR** em destaque (verde) e **PAGAR AGORA** secundário; montagem ≠ venda rápida do balcão. |
| 2026-08-15 | **Delivery pagar agora ou na entrega:** Balcão dual CTA (Salvar → Kanban / Pagar agora); sheet **Registrar pagamento**; tom COD (`dispatched` + conta ativa → Aguardando Pagamento); Concluído só após checkout. |
| 2026-08-15 | **Pedidos delivery — Pacote A + sheet:** totais reais (`goodsTotalCents`/`totalCents`); labels Novo/Em preparo/Despachado/Concluído; filtro padrão Abertos; Novo delivery + Atualizar + poll 15s; vista persistida em `pdv.delivery_view_mode.v1`; sheet lateral com itens, avançar, entregador (`PATCH` header) e cancelar. |
| 2026-08-15 | **Delivery sincronizado com o ERP:** novo `PosDeliveryApi`; criação/status/linhas/cancelamento online-first; novo pedido usa cliente CRM, endereço de entrega e entregadores do ERP; Kanban avança recebido→preparo→despachado; checkout vincula `posDeliveryOrderId` sem misturar couvert/serviço na taxa de entrega. |
| 2026-08-14 | **Ativação perdida a cada reopen no Linux:** `flutter_secure_storage` no Linux faz RMW de um JSON único; hidratações paralelas no boot sobrescreviam a credencial. `runInVault` serializa acesso; `main.dart` hidrata a credencial antes de alçada/cache. Trava `test/unit/vault_gate_test.dart`. | `core/storage/secure_store_failure.dart`, `lib/main.dart` |
| 2026-08-13 | **Consulta de preço sincroniza catálogo ao abrir.** `/price-check` chama `refresh(preferNetwork: true)` (`HttpCatalogSource.loadFresh`); UI com “Atualizando preços…” / aviso offline + Atualizar. Ver §4.11.2. |
| 2026-08-13 | **Seeds de crédito/salão removidos.** `pdv.credit.v1` e `pdv.salon.v1` começam vazios (nunca `cust_01` / mesas+delivery demo). `SalonSnapshot.emptyFixture` só para testes. |
| 2026-08-13 | **Sangria por permissão fina:** além da alçada por valor, `cash_movement_page` exige `pdv.operacao.caixa.withdrawal` no operador (ou PIN de quem tem via `SupervisorAuthorizer.authorizeWithPermission`). Reforço não exige. Perfil Caixa no ERP seed não inclui a permissão. Ver §4.14. |
| 2026-08-13 | **Operadores PDV → Membership (Fase 3, app):** `PosOperator` deixa de usar `role` e passa a carregar `permissionIds` (+ `membershipId` opcional). Supervisor = `permissionIds.contains('pdv.operacao.alcada.authorize')` (`isSupervisor`). Cache offline persiste `permissionIds`; JSON legado com `role=supervisor` migra para a permissão de alçada. Ver §4.14. |
| 2026-07-31 | Projeto criado: Flutter + Riverpod, plataformas Android/Linux/Windows, tela inicial em branco. Interface a ser desenhada do zero, sem herdar o PWA `apps/pdv/frontend`. |
| 2026-07-31 | Tema adicionado em `lib/core/theme/`: `pdv_tokens.dart` (cores, raios, espaçamento, dimensões, tipografia, movimento) e `pdv_theme.dart` (`ThemeData`). Cor de marca inicial `#1D4ED8` — placeholder até a identidade oficial ser definida. |
| 2026-08-01 | Arredondamento zerado: `PdvRadius` perdeu a escala `sm/md/lg` e ganhou `base = 0` — cantos vivos em todo o app, por decisão de produto. |
| 2026-08-01 | Barra de título própria no desktop (`PdvTitleBar`, `window_manager`), substituindo a decoração do sistema: logo, data/hora, versão do app, saúde de rede e Sefaz (`PdvTitleBarColors`, fundo escuro `#121417`, 40 px de altura), controles de minimizar/maximizar/fechar. Identificação de operador/terminal (`TerminalSession`) foi removida da barra depois — o model ficou órfão, sem uso hoje. |
| 2026-08-01 | Tela inicial (`features/home/`): grade de ações do caixa (Balcão, Cliente, Mesas, Atendimentos, Comandas, Vendedor) + coluna de apoio ao turno (Delivery, Crédito, Últimas vendas, Devolução, Pedidos delivery, Sangria, Configurações), com tecla de atalho funcionando via `CallbackShortcuts` e cor fixa por ação (`PdvActionColors`). Coluna lateral em 30%/70% por `flex`, não pixel fixo. |
| 2026-08-01 | App bar de conteúdo (`PdvAppBar`) adicionada ao `PdvScaffold`: menu (esquerda), layout dev e sair (direita), fundo escuro próprio (`PdvAppBarColors`, `#151515`). `PdvSpacing.contentPadding` criado para a margem da área de conteúdo. |
| 2026-08-01 | Painel de depuração de layout (`features/dev_tools/`, provisório): switch por `HomeAction`, aberto pelo botão "Layout (dev)" via `endDrawer`. Esconder uma ação também remove o atalho de teclado dela. |
| 2026-07-31 | Arredondamento zerado. A escala de raios (`sm`/`md`/`lg`) deu lugar a `PdvRadius.base = 0`, aplicado a todos os componentes. Decisão de produto: a interface do PDV tem cantos vivos. |
| 2026-08-01 | Grade da tela inicial dividida em duas sub-colunas (`HomeGridColumn.primary`/`.secondary`): a mais larga com Balcão/Mesas/Comandas, a mais estreita com o resto. Esconder um item deixa os vizinhos da mesma sub-coluna crescerem, via `Expanded` — sem lógica de prioridade. |
| 2026-08-01 | Navegação entre telas via `pushWithPageTitle` (`app/shell/pdv_page_title.dart`), que anuncia o nome da tela na barra de título e restaura o anterior ao voltar. **A troca acontece no ponto de navegação, nunca em `initState`/`dispose`** — o Riverpod proíbe mutar provider durante a construção da árvore. Sai quando o `go_router` entrar. |
| 2026-08-01 | Tela de Balcão (`features/counter/`): app bar própria (Voltar, Cliente, Comandas, nome da loja), barra de ferramentas, coluna de categorias, lista de itens lançados, painel de totais com CPF/CNPJ e a grade de produtos. Catálogo e carrinho locais, sem backend. `PdvCounterColors` é a paleta da tela; `PdvScaffold` ganhou `contentPadding` para o conteúdo ir até a borda. |
| 2026-08-01 | `features/dev_tools/` virou `features/modules/`: deixou de ser ferramenta de layout e passou a ser a fonte única de "o que está ligado no terminal". Desligar um módulo o esconde em qualquer tela que consulte o `id` (`PdvModuleIds`), não só na tela inicial. O botão saiu da app bar e foi para a barra de título. |
| 2026-08-01 | **Tema único, escuro.** O modo claro e o interruptor de tema foram removidos: `PdvTheme.data()` substituiu `light()`/`dark()`, `themeModeProvider` deixou de existir e `PdvColors` passou a ser a paleta escura (fundo `#303030`, campo de texto `#414141`) — sem pares `x`/`xDark`. Motivo: terminal de balcão de frente para vitrine, e um tema só elimina a classe de bug em que a tela é conferida num modo e quebra no outro. Ver 4.0.1. |
| 2026-08-02 | Tela de Pagamento (`features/payment/`): coluna de formas de pagamento, teclado numérico de valor (dígitos em centavos, atalhos +10/+20/+50/+100, Receber/Receber valor total), lista de pagamentos lançados e fechamento da venda (Produtos, Desconto, Total, Recebido, A receber, Troco, Finalizar). **A venda aceita vários pagamentos** — `paymentEntriesProvider` é lista, não valor único. Cartão pede **bandeira** antes do valor; crédito ainda pede **parcelas** (teto em `PaymentMethod.maxInstallments`, dado da loja). Atalhos: ENTER recebe, INSERT preenche o que falta, F2 finaliza. |
| 2026-08-02 | Tela de venda finalizada (`SaleCompletedPage`): confirmação + caminhos de saída (Início, Balcão, Delivery, Atendimentos, Gerar nota, Relatório gerencial, Enviar NF por email), com aviso verde no canto inferior direito. **Zera carrinho e pagamentos ao abrir** (em `addPostFrameCallback`, não no `build`), e substitui a pilha até a tela inicial — depois de fechada, a venda não existe para voltar. |
| 2026-08-03 | Vendedor e observação da venda saíram do "não implementado": **Observação** abre diálogo de texto (`sale_note_dialog.dart`, teto de 240 caracteres) e o texto aparece no topo do painel de fechamento (`SaleNoteRow`), onde também se edita e se remove — a faixa só existe quando há observação. **Vendedor** abre seletor com busca por nome ou código (`seller_picker_dialog.dart`, ENTER escolhe o primeiro resultado; `Seller.matches` ignora acento e caixa), e o nome escolhido vira o rótulo do botão na app bar. Estado em `saleNoteProvider`/`saleSellerProvider`. *(Catálogo: fixture na época; desde 2026-08-13 vem de `GET /v1/pos/sellers` — ver §4.11.4.)* `SaleCompletedPage` passou a zerar os dois junto com carrinho e pagamentos — herdar vendedor atribui comissão que ninguém escolheu. Fechar um diálogo **não** apaga o que já estava escolhido: `SellerSelection` separa "sem vendedor" de "desisti". |
| 2026-08-03 | Ordem da app bar de Pagamento: o nome da loja passou do começo para o **fim** do grupo da direita, encostado na margem — mesma posição que ocupa no Balcão. Vendedor, observação e configurações ficam à esquerda dele. |
| 2026-08-03 | App bar de Pagamento: as ações da direita (loja, vendedor, observação, configurações) voltaram a encostar na margem. O botão do cliente é `Flexible` e disputava o espaço livre com um `Spacer` — dois filhos flexíveis dividem a folga meio a meio, e a metade não usada pelo cliente sobrava no fim do `Row`. O grupo da esquerda passou a ser `Expanded` e o `Spacer` saiu. `payment_app_bar_test.dart` trava a borda direita (inclusive com nome de cliente longo) e a ordem das ações. |
| 2026-08-02 | `CounterDocumentRow` extraído de `counter_totals_panel.dart` para widget próprio: o campo de CPF/CNPJ é o **mesmo** no Balcão e no Pagamento, lendo o mesmo `counterDocumentTypeProvider`. `PdvAppBarButton` ganhou modo só-ícone (`label` opcional + `tooltip` obrigatório nesse formato) para as ações secundárias da app bar de Pagamento. |
| 2026-08-04 | **Clientes** (`features/customer/`): diálogo de busca/lista (`barrierDismissible: false`, ESC/INSERT), tela única de cadastrar/editar com seções (dados pessoais, telefones, endereço, categoria/observação) e app bar com **Salvar** / **Salvar e selecionar** (verde, altura total). Fixture local; `counterCustomerProvider` passa a guardar `Customer?`. Entrada pela Home (F8), Balcão e Pagamento. `normalizeForSearch` extraído para `core/format/`. |
| 2026-08-05 | **Fase 0 — Fundação** (`specs/pdv/001-foundation-phase0`): catálogo de módulos tipado (screens + behaviors, `available`/`disabled`/`blocked`, núcleo ⬛ × opcional); `isOperationallyVisible`; fonte/cache SharedPreferences + 4 perfis; painel só em debug; dinheiro em centavos; `go_router` nas 5 telas; `SaleCompleted`/`PaymentAppBar` consultam módulos; estados UI compartilhados; adiamento de compacto/médio até Fase 2 (Mesas/Comandas). |
| 2026-08-05 | **Polimento visual desktop:** tipografia base 17 px; `controlHeight` 56 / `Sm` 48 / `Lg` 64; diálogos `dialogMd`/`dialogLg`; `PdvDialogBody` + `PdvFormSection`/`PdvFormFrame`/`PdvStatCard`; hub caixa com KPIs; fields filled no tema e no form de cliente (outlined filled). |
| 2026-08-05 | **Fase 2 — Food** (`specs/pdv/003-food-phase2`): breakpoints `PdvBreakpoints`/`PdvFormat`; Mesas/Comandas/Atendimentos/Delivery (fixture + `pdv.salon.v1`); Balcão food (addons/obs/meia) + taxa/couvert; Pagamento responsivo; `PdvFilledField` canônico; `SaleRecord` com couvert/taxa/delivery/addons. |
| 2026-08-05 | **Fase 3 — Varejo** (`specs/pdv/004-varejo-phase3`): barcode/`pendingQty` no Balcão; `variant_grid` + `scale` (half-up); `/price-check`, `/refund`, `/credit`; stores `pdv.refund.v1`/`pdv.credit.v1`; módulo `price_check`; perfis Loja/Mercado; Filled + diálogos Md/Lg. |
| 2026-08-05 | **Últimas vendas refeita** (`features/sales_history/`): deixa de ser `ListView` de `ListTile` e vira **tabela de 7 colunas** (Código · Data / Hora · Cliente · Número · Valor · Nota Fiscal · Ações), no molde do PDV de referência — busca na app bar, **Filtros** por situação (`SalesHistoryStatusFilter`), paginação no rodapé e `Shift + Esc` para voltar. `SaleRecord` ganhou `number` (sequência **do turno**, atribuída por `nextSaleNumber` em `CashShiftController.recordSale`, não pelo chamador) e `customerName` (snapshot do cliente do Balcão, lido antes do `reset()` em `SaleCompletedPage`) — ambos com default no `fromJson`, então turno gravado antes disso continua abrindo. `SaleDetailPage` saiu para `sale_detail_page.dart`; widgets da tabela/rodapé/filtro em `presentation/widgets/`. `PdvAppBarButton` ganhou `secondaryLabel` (segunda linha para o atalho). **Coluna Nota Fiscal mostra traço** e **Zerar numeração fica desabilitado**: dependem de emissão fiscal, fora de escopo. |
| 2026-08-05 | **Voltar em todas as telas:** `PdvAppBar` (a barra padrão) ganhou `onBackPressed` e o `PdvScaffold` ganhou `showBack`, **`true` por padrão** — Crédito, Consulta de preço e Devolução estavam sem nenhuma saída, porque a barra padrão só tinha Menu e Sair. `/` e `/sale-completed` passam `showBack: false` (raiz e fim de venda). Regra de destino centralizada em `app/shell/pdv_back.dart` (`popOrHome`), que `settings_page` passou a consumir no lugar da cópia local do `canPop ? pop : go(home)`. Trava em `test/widget/back_button_coverage_test.dart`. Em seguida, Mesas/Comandas/Atendimentos/Delivery-novo largaram a `AppBar` do Material crua e passaram a usar a barra padrão (o título já vinha da barra de título, então era duplicata); Pedidos delivery ganhou `PdvAppBarChrome` + `PdvAppBarButton` por causa do "Novo delivery". **Nenhuma tela do app usa mais `AppBar` do Material.** O helper `pumpWithRouter` passou a registrar as 5 rotas de salão/delivery, e a trava cobre as 15 rotas navegáveis. |
| 2026-08-05 | **Campos passam a ser filled de verdade:** o traço do `InputDecorationTheme` (`pdv_theme.dart`) e do `pdvFilledDecoration` (`ui/pdv_filled_field.dart`) deixa de ser `OutlineInputBorder` e vira `UnderlineInputBorder`. O app já era `filled: true` — o que havia era o híbrido "preenchido + contorno fechado", que lê como *outlined*. Muda a aparência de **todo** campo do app de uma vez; nenhuma tela precisou ser tocada, porque as duas fontes governam todas. Padrão em 4.8.1 e trava em `test/widget/input_filled_standard_test.dart`. Seguem sem preenchimento, por já estarem dentro de moldura com fundo: toolbar/documento/células do Balcão e a busca de Últimas vendas. |
| 2026-08-05 | **Últimas vendas — filtros e numeração:** o filtro sai do diálogo e vira painel embutido (`sales_history_filters_panel.dart`) com **Período** (De/Até via `showDatePicker`) **+ Situação**, rascunho aplicado só no **Aplicar**. `SalesHistoryQuery` ganhou `from`/`to`, comparados **pelo dia** (`startOfDay`/`endOfDay`) — "até 05/08" inclui a venda das 20h. **Zerar numeração** deixa de ser desabilitado: vira azul (`accentMuted`) com confirmação Enter/Esc e grava `CashShift.numberingResetAt`; `nextSaleNumber(sales, resetAt:)` passa a ignorar as vendas anteriores à marca, então a próxima sai como 1 **sem** reescrever o número das já gravadas. |
| 2026-08-05 | **Pedidos delivery refeito:** quadro Kanban de 4 colunas (`deliveryBoardColumns`: recebido → em preparo → a caminho → entregue; cancelado **não** é coluna, é saída do fluxo). App bar com Voltar, busca, **Filtros** (folha lateral: forma de entrega × situação), **Legenda de cores** e **Configurações** (modo Tabela/Cartões/Kanban). Domínio: `DeliveryFulfillment` (entrega/retirada, default `delivery` no `fromJson`) em `DeliveryOrder` e no form de novo pedido — retirada esconde endereço/taxa/entregador e grava taxa 0. Cor do cartão vem de `deliveryToneOf(order, account)`, que cruza o status do pedido com o da conta: **Aguardando Pagamento é conta em `closing`**, não um `DeliveryOrderStatus`. Tons em `PdvDeliveryColors`; a legenda é gerada de `DeliveryTone`, não escrita à mão. Superfícies do quadro em **`PdvBoardColors`**: a coluna **afunda** (`#1E1E1E`) em relação ao fundo do app, que passa a aparecer nos vãos e é o que separa uma coluna da outra — a coluna é o recipiente, os cartões é que flutuam nela. **O quadro aparece sempre**, mesmo sem pedido — as colunas são a estrutura do serviço; só Cartões e Tabela caem em estado vazio. Pedidos de exemplo em `delivery/data/delivery_fixture.dart`, semeados por `SalonSnapshot.emptyFixture()`, cobrindo as 4 colunas **e** os 5 tons (trava em `test/widget/delivery_board_test.dart`). ⚠️ **Modo de exibição não persiste** — só em memória, até haver preferência de terminal para ele. |
| 2026-08-05 | **Anatomia de tabela compartilhada** (`lib/ui/pdv_table.dart` + `pdv_table_footer.dart`): `PdvTableColumn` (rótulo + `flex`, **declarado uma vez** e usado por cabeçalho e linhas), `PdvTableHeader` com `isLoading` (barra fina entre cabeçalho e dados), `PdvTableCell`, `PdvTableEmpty` e `PdvTableFooter` (paginação + **seletor de itens por página**). Últimas vendas migrou para eles (`sales_history_footer.dart` removido) e ganhou o seletor. **Pedidos delivery no modo Tabela** passa a usar o mesmo desenho — colunas Código · Data/Hora · **Caixa** · Número · Valor · **Status** (bolinha do tom + rótulo) · Ações, vazio "Nenhum registro correspondente encontrado", 36 por página. `DeliveryOrder` ganhou `number` (`nextDeliveryOrderNumber`, maior+1, cancelado mantém o dele). Loading ancorado em `salonHydratedProvider`, ligado ao fim do `SalonController.hydrate()` — é carregamento **real**, não enfeite permanente. ⚠️ Coluna **Caixa** mostra o `TerminalSettings.terminalLabel` atual: o pedido não guarda em qual caixa nasceu, e o PDV é um terminal só até haver mais de um. |
| 2026-08-05 | **Sangria / Reforço refeita** (`cash_movement_page.dart`): barra com Voltar + separador + **nome do PDV** (`TerminalSettings.terminalLabel`); corpo em **duas colunas** — lançar à esquerda (abas Sangria/Reforço com a cor da semântica, Tipo de Operação, Valor, Observação, botão cheio na cor da aba), conferir à direita (`CashMovementHistory`, tabela Tipo · Data/Hora · Valor · Operação · Ações sobre `lib/ui/pdv_table.dart`). Domínio: `CashOperationType` + `cashOperationsFor(type)` (operação de saída não aparece no reforço e vice-versa) e `CashMovement.operation`, default `other` no `fromJson`. ⚠️ **O campo Valor passou a ser em reais** — era em centavos crus ("Ex.: 5000 = R$ 50,00"), convertido por `parseCentsFromReais`. Ao confirmar, a tela **não fecha**: limpa os campos, porque o histórico ao lado é onde se confere antes do próximo lançamento. Não implementado da referência: o expansor "Retirada do Caixa" e o segundo select sem rótulo. |
| 2026-08-05 | **Máscara de moeda em todo campo de valor:** `PdvMoneyField` (`lib/ui/pdv_money_field.dart`) + `PdvCurrencyInputFormatter`, sobre `centsFromDigits`/`maskCurrencyInput` (`core/format/pdv_currency.dart`). Leitura de caixa registradora — só dígitos, dos centavos para cima. Migrados **os 7 campos de dinheiro do app**: sangria/reforço, fundo de troco, contagem física, crédito, taxa de entrega, couvert e ajuste de venda (este mascara só no modo Valor; trocar de modo limpa o campo, porque `10` vale 10% de um lado e R$ 0,10 do outro). ⚠️ **Três telas pediam centavos crus** (fundo de troco, contagem física, crédito) e quatro liam reais — o mesmo `50` valia R$ 0,50 ou R$ 50,00 conforme a tela. `PdvFilledField` ganhou `onChanged`/`autofocus`/`helperText`/`errorText`/`style` para o campo de dinheiro não precisar contorná-lo. **Bug corrigido de passagem:** `delivery_new_page` não enviava `fulfillment` ao criar o pedido — retirada era gravada como entrega. |
| 2026-08-05 | **Véu dos diálogos clareado:** `PdvColors.barrier` (32% de preto) aplicado em `dialogTheme.barrierColor` — vale para **todo** diálogo do app, não só o de Clientes; a folha lateral de filtros do delivery passou a usar o mesmo token em vez do valor próprio. Sem isso valia o `Colors.black54` do Flutter, calibrado para app claro: 54% sobre um app já escuro apaga a tela e o operador perde a referência de onde estava. `test/widget/dialog_barrier_test.dart` confirma que `showDialog` de fato lê o tema (nem toda versão do Flutter lê) e que o valor continua abaixo do default. |
| 2026-08-05 | **Menu lateral** (`app/shell/pdv_menu_drawer.dart`): o botão de menu da `PdvAppBar` deixa de ser um toast e abre um `Drawer` à esquerda. Os itens saem de **`homeActions`** e o toque cai em **`handleHomeAction`** — mesmo catálogo e mesmo despacho dos blocos da Home e dos atalhos de teclado, então os três não têm como divergir; a visibilidade de módulos é a mesma. Só existe onde a app bar é a padrão (`appBar == null`): Balcão, Pagamento e Últimas vendas têm barra própria e ficam sem menu, por estarem dentro de um fluxo. `PdvScaffold` ganhou um `Builder` no corpo — sem ele, `Scaffold.of` no botão de menu lançaria, porque o contexto do `build` está **fora** do `Scaffold`. ⚠️ O harness `pumpWithRouter` passou a envolver a Home em `PdvScaffold`, como o router real já fazia — antes a Home de teste não tinha app bar nenhuma. Não implementados da referência (não existem no app): Sincronizar, Suporte, Atalhos, Área administrativa e o toggle **Tema escuro**, este por decisão de produto (§4.0.1: um tema só, e ele é escuro). |
| 2026-08-05 | **Configurações refeita:** navegação à esquerda + conteúdo à direita, com 5 seções (`SettingsSection`): **Informações da sessão** (só leitura: caixa, turno, abertura com "há X horas", fundo), **Touch screen**, **Favoritos da tela inicial**, **Terminal** e **Módulos** — as duas últimas são o conteúdo que já existia, preservado. `TerminalSettings` ganhou `largeScrollbars`, `useHomeFavorites` e `homeFavorites` (6 posições; `_favoritesFromJson` normaliza lista curta/longa para não derrubar a Home). **As duas preferências são ligadas de ponta a ponta:** a barra de rolagem vai ao `scrollbarTheme` via `PdvTheme.data(largeScrollbars:)` (com `thumbVisibility` no modo toque — sem hover não há barra para o dedo), e os favoritos ao layout da grade via `resolveHomeGrid`/`resolveHomeRail` (`features/home/domain/home_grid_layout.dart`), que `HomePage` passa às sub-colunas. Regras do resolvedor: favorito **não** sobrepõe módulo desligado no ERP; ação promovida à grade sai da coluna lateral (senão apareceria duas vezes); com a opção desligada vale o catálogo. ⚠️ **Não implementado da referência:** o "Nome do terminal" separado do nome do caixa (o app tem um campo só) e a "Data da última sincronização", que mostra traço em vez do epoch — não há sincronização no app. |
| 2026-08-05 | **Fechar caixa fixo na app bar + tela de fechamento:** `PdvAppBarChrome` saiu de `lib/ui/` para `lib/app/shell/` e passou a montar, sempre por último à direita, o `PdvCloseShiftAction` — assim nenhuma tela precisa lembrar de incluí-lo (mesma lógica do Voltar, ver 4.7.2). Opt-out só em Balcão e Pagamento (`showCloseShift: false`, venda em andamento faz `saleInProgress` recusar o fechamento) e na própria tela de fechamento; o botão também some quando não há turno aberto. Nova rota `/cash/close` (`CashClosePage`) conferindo os **cinco canais** de `CashCloseChannel` — Dinheiro (= gaveta, via `expectedDrawerCents`), Crédito, Débito, Voucher e Outros (`default` do mapeamento, para forma nova não sumir) —, campos vazios de propósito e resumo com a diferença por canal no fim (ver 4.7.3). O `closeCashShiftDialog` do `CashHubPage` foi removido: pedia só o dinheiro. Travas em `test/widget/close_shift_action_test.dart` e `test/unit/cash_close_channel_test.dart`. |
| 2026-08-06 | **"Sair" removido da `PdvAppBar`** e o **Fechar caixa virou só ícone** (`Icons.exit_to_app` + tooltip). O canto direito da barra agora tem uma ação só: dois botões de saída vizinhos, um encerrando o turno e o outro não, é erro esperando o fim do expediente — ainda mais porque o "Sair" era um `showNotImplementedFeedback`, não uma sessão de verdade. `PdvAppBar` perdeu o parâmetro `onExitPressed` e o `PdvScaffold` deixou de importar `not_implemented_feedback`. `close_shift_action_test.dart` passou a procurar o botão por ícone. |
| 2026-08-06 | **Título da barra passou a vir da rota.** `syncPageTitleFromLocation` era código morto — nunca foi chamado — e o nome da tela era atribuído à mão em **27 pontos** antes de cada `push`, sem ninguém devolvê-lo no `pop`: voltar de Mesas/Comandas/fechamento para o Início mantinha o título antigo na barra. Virou `pdvPageTitleForLocation(String)` (função pura) lida pela `PdvTitleBar` via `GoRouter.maybeOf(context)?.state`; as 27 chamadas de `setTitle` foram removidas. `currentPageProvider` virou `pageTitleOverrideProvider` (`String?`, `null` = derive da rota), usado só por `pushWithPageTitle` para páginas fora do `go_router`. Trava em `test/widget/page_title_from_route_test.dart` — inclui o caminho relatado (Início → fechamento → Voltar). |
| 2026-08-06 | **Operador no domínio (M0 do plano de autenticação):** `CashShift` ganhou `openedByOperatorId`/`openedByOperatorName`, `SaleRecord` e `CashMovement` ganharam `operatorId`/`operatorName` — todos com default no `fromJson`, então turno gravado antes continua abrindo (com traço na UI). `openShift` passou a **exigir** `PosOperator`; o diálogo de abertura escolhe o operador antes do fundo, sem pré-seleção (pré-selecionar abriria o caixa em nome de quem estava no topo da lista com um Enter distraído). Quem carimba venda e movimento é o turno, não quem monta o registro — mesma regra do número da venda. Novo `features/operators/` com `PosOperator` + catálogo **fixture** (sai no M3). `TerminalSession`/`terminalSessionProvider` **removidos**: eram código morto, ninguém os consumia, e o `'Maria'` cravado nunca chegou à tela. Últimas vendas ganhou coluna Operador, o detalhe da venda ganhou a linha, e o histórico de sangria ganhou a coluna. Ver §4.11. Travas em `test/unit/cash_shift_operator_test.dart` (9) e `test/widget/sales_history_operator_column_test.dart` (3). |
| 2026-08-06 | **Pareamento de terminal (M2):** `features/terminal/` — `DeviceCredential` + `SecureDeviceCredentialStore` (cofre do sistema, nunca `SharedPreferences`) + `deviceCredentialProvider` + tela `/terminal/activate`. Dependências novas: `dio` e `flutter_secure_storage`. `core/http/pdv_api_client.dart` com timeout explícito em tudo, header `Authorization: Device <token>` por interceptor e `PdvApiException` traduzindo erro de transporte em texto que o operador entende. **Gate no router**: sem credencial, toda rota cai na ativação; a ordem é credencial → turno, no mesmo `redirect` (ver §4.12). Configurações → Terminal passou a mostrar a identificação como só leitura quando pareado, mais "Desativar terminal". `pumpWithRouter` ganhou `withPairedTerminal` (padrão `true`) e passou a espelhar o redirect real. Travas em `test/widget/activate_terminal_test.dart` (6) e `test/unit/device_credential_test.dart` (3). |
| 2026-08-06 | **Login de operador (M3):** `/operator/login` com lista da unidade + teclado de PIN (`OperatorPinPad`, teclado próprio porque num balcão não há teclado físico à mão); `operatorSessionProvider` + `operatorLockedProvider`; `OperatorLockOverlay` e `InactivityLocker` no `builder` do `MaterialApp` (acima do Navigator, para cobrir diálogos); **Bloquear** e **Trocar operador** no rodapé do menu lateral — nenhuma das duas fecha o caixa. O gate do router virou credencial → operador → turno. A fixture `operator_catalog.dart` **saiu**: a lista vem de `GET /v1/pos/operators`. O diálogo de abertura de caixa perdeu o seletor de operador — o turno abre em nome de quem está logado. `TerminalSettings.lockAfterMinutes` (0 = nunca, padrão). Ver §4.13. Travas em `test/widget/operator_login_test.dart` (8). |
| 2026-08-06 | **Alçada de supervisor (M5):** `features/policies/` — `PosPolicy` (limites + `requiresSupervisor`), `PosPolicyApi` (`GET /v1/pos/policy`), cache no **cofre** e `posPolicyProvider`, que **nunca é `null`** (antes de sincronizar vale `PosPolicy.restrictive`). `SupervisorAuthorizer` + `requestSupervisorAuthorization` conferem o PIN **sem trocar a sessão do caixa** — reusar `signIn` transferiria o caixa para o supervisor e as vendas seguintes sairiam no nome errado. Ligado nos três pontos de exceção: desconto (`sale_adjustment_row`), sangria (`cash_movement_page`) e cancelamento (`sale_detail_page`); acréscimo e reforço nunca pedem. Desconto em reais é convertido para percentual antes de comparar (`SaleAdjustment.discountPercentOf`) — sem isso, R$ 90 numa venda de R$ 100 passariam como "R$ 90", não como 90%. Quem autorizou fica no registro, em campos separados por operação (`SaleAdjustment.authorizedBy*`, `SaleRecord.cancellationAuthorizedBy*`, `CashMovement.authorizedBy*`) — um par genérico na venda perderia um dos dois quando a mesma venda tem desconto **e** cancelamento autorizados por pessoas diferentes. Ver §4.14. ⚠️ **Enforçada só no app**: o servidor confere o PIN, mas não o papel nem o limite — quando o checkout entrar, tem que revalidar. **Bug pré-existente corrigido de passagem:** a linha de venda **cancelada** estourava a última coluna de Últimas vendas (etiqueta "Cancelada" + chevron sem `Flexible`) — só acontecia nesse estado, e nenhum teste passava por ele. Travas em `test/unit/pos_policy_test.dart` (16), `test/widget/supervisor_authorization_test.dart` (7) e `test/widget/supervisor_exception_points_test.dart` (11). |
| 2026-08-06 | **Alçada de supervisor (M5) + PIN offline (M4).** Alçada: `features/policies/` com `PosPolicy` (a decisão mora na entidade, não nas telas), cache no cofre e `posPolicyProvider` que **nunca é `null`** — antes de sincronizar vale `PosPolicy.restrictive`. `SupervisorAuthorizer` confere o PIN **sem trocar a sessão do caixa**. `policies/presentation/exception_gate.dart` virou o **portão único**: as três telas de exceção (desconto, sangria, cancelamento) chamam `requestException` e nenhuma consulta `PosPolicy` por conta própria. Quem autorizou fica no registro, em campos separados por operação (`SaleAdjustment.authorizedBy*`, `SaleRecord.cancellationAuthorizedBy*`, `CashMovement.authorizedBy*`) — um par genérico na venda perderia um dos dois quando a mesma venda tem desconto **e** cancelamento autorizados por pessoas diferentes. Desconto em reais é convertido para percentual antes de comparar (`SaleAdjustment.discountPercentOf`). Offline: `GET /v1/pos/operators/sync` (única rota que devolve `pinHash`, validade de 48 h), `core/crypto/pdv_pin_hasher.dart` com `pointycastle` (dependência nova) espelhando o `PinHasher` da API, `OperatorCache` + `SecureOperatorCacheStore`, contador de tentativas **persistido**, e `PosPolicy.blockedOffline` bloqueando só as exceções — vender, abrir caixa, sangrar dentro do limite e fechar continuam funcionando. `syncStatusProvider` deixou de ser fixture em `network` (de `terminalOnlineProvider`, alimentado pelo resultado das requisições reais — **não** `connectivity_plus`) e ganhou `offlineCacheExpiresAt`, com um terceiro indicador na barra que só aparece quando há algo a dizer. ⚠️ **scrypt em Dart mede ~750 ms com N=65536 num desktop** — daí `verifyOffThread` num isolate; num tablet fraco pode passar de 2 s, e o parâmetro vem no próprio hash se precisar descer. ⚠️ **A alçada é enforçada no app**: o servidor confere o PIN, mas não o papel nem o limite. Ver §4.14 e §4.15. **Bug pré-existente corrigido de passagem:** a linha de venda **cancelada** estourava a última coluna de Últimas vendas. Travas em `pos_policy_test` (16), `pdv_pin_hasher_test` (5), `operator_cache_test` (11), `operator_offline_login_test` (13), `supervisor_authorization_test` (7), `supervisor_exception_points_test` (11), `offline_degradation_test` (6) e `title_bar_status_test` (+4). |
| 2026-08-06 | **Tela de abertura (`/starting`) — o PDV piscava a Home no boot.** A `initialLocation` era `/` e o `redirect` devolvia `null` enquanto o cofre não tinha sido lido, então o primeiro frame desenhava a **tela operacional**, com os blocos de venda, antes de o app saber quem estava no caixa (confirmado com sonda: `ROTA NO PRIMEIRO FRAME: /` → `ROTA APOS HIDRATAR: /operator/login`). A `initialLocation` passou a ser `/starting` (`features/shared/presentation/starting_page.dart`): marca + barra de progresso, **sem ação nenhuma** — sem menu, sem Voltar, sem Fechar caixa —, mantendo só a barra de título, que no desktop é o que oferece arrastar/minimizar/fechar numa janela sem decoração do sistema. O guard de `/starting` fica **depois** dos de credencial e operador, para a rota final sair certa numa passada só; navegar para lá depois do boot devolve a Home. `pumpWithRouter` passou a espelhar o guard novo. Ver §4.11.1. Trava em `test/widget/boot_first_screen_test.dart` (6), que monta o **router real** — o harness tem redirect próprio e passaria mesmo com a `initialLocation` de produção errada, que era exatamente o bug. |
| 2026-08-06 | **Testes da Home passavam por causa do bug da abertura.** `home_screen_test` e `home_grid_columns_test` montavam o `PdvApp` e recebiam a Home **sem credencial, sem operador e sem passar por guard nenhum** — porque a `initialLocation` era `/` e o redirect devolvia `null` antes da hidratação. Com a tela de abertura, os dois pararam de achar a Home. Novo `test/helpers/pump_app_at_home.dart`: monta o app de verdade e o leva à Home **pelo caminho real** (hidrata a credencial de um cofre falso já pareado, entra com código + PIN contra a API falsa), com um `expect` explícito no fim para uma regressão de boot falhar ali, e não numa cascata de "widget não encontrado" longe da causa. É mais lento que plantar estado, e é o ponto: o que se prova sobre a Home passa a valer para a Home que o operador vê. |
| 2026-08-06 | **PDV ficava preso na tela de abertura em Linux sem chaveiro.** Reportado rodando em WSL2: `PlatformException(Libsecret error, ... org.freedesktop.secrets was not provided by any .service files)` nas quatro hidratações. Dois defeitos encadeados: (1) as stores só tratavam `FormatException`, então a falha do plugin escapava; (2) `markHydrated()` ficava **depois** da leitura, então nunca rodava — e é ele que tira o app da tela de abertura. Resultado: carregando para sempre, sem mensagem. Antes da tela de abertura o mesmo erro passava despercebido de forma pior: o app ficava na Home com o gate de credencial **nunca ativado**. Correção em `core/storage/secure_store_failure.dart`, com tratamento assimétrico — ler vira "não existe" (todas as ausências erram para o lado seguro), gravar a credencial **lança** (o código de pareamento é de uso único), gravar alçada/cache/contador é silencioso (consequência já visível em outro lugar). `markHydrated` foi para o `finally`. A tela de ativação passou a mostrar a mensagem do cofre indisponível, mandando chamar o suporte. Ver §4.10.1. Trava em `test/widget/vault_unavailable_test.dart` (9), que intercepta o **canal de plataforma** do plugin — um fake que lançasse provaria só o fake. |
| 2026-08-06 | **Pareamento queimava o código antes de saber se o cofre aceitava.** Relatado em WSL2: o ERP passou a mostrar o terminal como pareado (`Linux · DESKTOP-…`, "agora") e o PDV continuou na tela de ativação — o resgate ia à API primeiro, e a gravação local só falhava depois. Como o código é de **uso único**, sobrava um terminal fantasma no ERP, um PDV sem credencial e um código gasto. `DeviceCredentialStore` ganhou **`ensureWritable()`** (grava e apaga uma chave-sonda própria, `pdv.vault_probe.v1`, para não tocar num pareamento existente), chamado por `pair()` **antes** do `POST /pair/redeem`. Testar leitura não bastaria: cofre ausente e cofre somente-leitura falham no mesmo lugar, e é a escrita que precisa funcionar. A mensagem passou a dizer que **o código continua válido**, senão o gerente gera outro achando que o problema é o código. **Bug de UI corrigido junto:** `errorText` do Material trunca em **uma linha com reticências**, então a mensagem do cofre aparecia cortada em "…não está dispo…" — o operador via que falhou e não descobria o quê. `errorMaxLines: 3` / `helperMaxLines: 2` no `inputDecorationTheme` e em `pdvFilledDecoration`, valendo para **todo** campo do app. Travas em `vault_unavailable_test.dart` (11), incluindo a que afirma que a API **não é chamada** quando o cofre recusa. |
| 2026-08-06 | **Revogar o terminal no ERP não fazia nada no PDV.** O servidor passava a responder 401 em toda rota `v1/pos/*`, mas o app não tratava — `PdvApiException.isUnauthorized` existia e **ninguém consumia**. Na prática o PDV ficava na tela de login mostrando "Terminal não autorizado" como se fosse erro de PIN, sem nunca voltar à ativação; a única saída era Configurações → Terminal → Desativar terminal, à mão. Agora `PdvApiException` carrega o `code` do envelope, `PdvApiClient` ganhou interceptor `onError` + callback `onDeviceUnauthorized`, e o `DeviceCredentialController` apaga o cofre e marca `deviceRevokedProvider` — a tela de ativação passa a explicar que o acesso foi encerrado, em vez de aparecer do nada. Sessão e cache de operadores caem junto por `ref.listen` na credencial. ⚠️ **A distinção é por `code`, não por mensagem**: `PIN errado` e `terminal revogado` são os dois 401 em `v1/pos/*`, e confundi-los faria um dedo escorregado desparear o terminal. Ver §4.12.1. Travas em `test/widget/device_revoked_test.dart` (7), incluindo a que afirma que PIN errado **não** despareia e a de idempotência (três rotas falhando = uma limpeza). |
| 2026-08-10 | **Removido o painel debug de módulos** da barra de título (`ModulesButton` + `endDrawer`/`ModulesPanel`). Quem configura é o ERP; no app só leitura (Configurações → Módulos) e aplicação via `HttpModuleConfigSource`. Removidos `modulesPanelEnabledProvider` e os testes do painel. |
| 2026-08-11 | **Grade de variantes no Balcão.** `launchProductToCart` e `submitBarcode` abrem/pedem variante sempre que `product.hasVariants` — o módulo `variant_grid` deixa de ser o portão (vender o pai sem SKU é bug). Scan do barcode do pai → `needsVariant`. Seed de dados no ERP: `apps/erp/api/scripts/seed-pdv-grid-variants.sql`. Trava em `counter_barcode_cart_test`. Ver §4.11.2. |
| 2026-08-15 | **Sync de vendas do turno — operador + esperado em gaveta:** `sessionSaleToSaleRecord` mapeava `cashNetCents: 0` e omitia `operatorName`; após hydrate/Últimas vendas o esperado virava só fundo − sangrias e o detalhe mostrava Operador `—`. API passa a expor `operatorName` + `methodSystemKey` nos payments. Troca de operador reaplica vendedor default; snackbar de venda fechada some sozinho (sem FECHAR sticky). Ver §4.11.4 / §4.11.5. |
| 2026-08-15 | **PDV A–E:** branding (`organizationName`/`branchName` no redeem + `GET /v1/pos/terminal` → `establishmentNameProvider`); fiscal settings (`GET /v1/pos/fiscal-settings`, Sefaz nunca verde, CTA **CUPOM**); sync vendas do turno (`GET …/cash-sessions/current/sales` no hydrate + Últimas vendas); `discountAuthorizedByUserId` no POST sales; UX cancel (`cancelSaleErrorMessage` + `displaySaleNumber`). Ver §4.11.4 / §4.11.5. |
| 2026-08-14 | **Cancelamento de venda no ERP.** `PosSalesApi.cancel` → `POST /v1/pos/sales/:id/cancel`; `sale_detail_page` online-first (rede + `serverSaleId`); falha não toca cache local. Crédito/devolução desligados no validador/perfis até API. Ver §4.11.0 / §4.11.4. |
| 2026-08-13 | **Turno de caixa no servidor:** `PosCashSessionApi` + `CashShiftController` contra `/v1/pos/cash-sessions` (open/current/movements/close); fechamento envia os 5 canais; cache local só para vendas/numeração e fallback offline no hydrate. Ver §4.11.5. |
| 2026-08-13 | **Vendedores via API (`isSeller`):** `GET /v1/pos/sellers` + cache `pdv.sellers.cache.v1`; fixture só em testes; default do vendedor = operador logado se elegível; `sellerId` = userId no POST sale. Ver §4.11.4. |
| 2026-08-12 | **Checkout online PDV.** Meios via `GET /v1/pos/payment-methods` (`pdv.payment_methods.v1`); Finalizar → `POST /v1/pos/sales` (SaleOrder closed) + `recordSale` local; falha/offline não grava fantasma. CPF/CNPJ na nota (`invoiceDocumentProvider`, prefill do cliente). Cupom não fiscal em dialog (Gerar nota / Reimprimir). Sem fila offline, TEF ou NFC-e. Travas em `complete_sale_test`, `invoice_document_controller_test`, `payment_page_test`. Ver §4.11.4. |
| 2026-08-12 | **Estoque no lançamento (Balcão).** Catálogo POS traz `trackStock`/`stockQty`; badge “Sem estoque” na grade; **não** bloqueia lançamento; pós-venda decrementa saldo local (pode negativo). ERP ledger aceita negativo. Ver §4.11.2. |
| 2026-08-12 | **Clientes CRM a partir do ERP.** `features/customer/`: `GET`/`POST /v1/pos/customers*` + `GET /v1/pos/customer-categories` → cache `pdv.customers.v1` → vazio (nunca fixture em produção). Busca server-side (debounce 400 ms); cadastro rápido no form novo; existente só leitura. `hydrate` no boot; create offline recusado. Travas em `http_customer_catalog_source_test`, picker/create widget. Ver §4.11.3. |
| 2026-08-12 | **Máscara de nascimento + CEP no form de cliente.** Nascimento `dd/MM/yyyy` ↔ ISO; CEP com lookup `GET /v1/pos/cep/:cep` (loading/disable + aviso offline). Travas em `brazilian_masks_test`, `pos_cep_api_test`. Ver §4.11.3. |
| 2026-08-10 | **Catálogo do Balcão a partir do ERP.** `features/catalog/`: `GET /v1/pos/catalog` → cache `pdv.catalog.v1` → vazio (nunca fixture em produção). Preço já resolvido (canal `pdv`). Grade/sidebar/barcode/Consulta de preço leem `catalogProvider`; `hydrate` no boot; repareamento faz `refresh`. Fixture `counter_catalog.dart` só para testes. AC: unidade ativa, preço lista pdv, barcode, cache offline, boot offline vazio, repareamento troca catálogo, sem supply. Travas em `test/unit/http_catalog_source_test.dart` e `test/widget/catalog_from_api_test.dart`. Ver §4.11.2. |
| 2026-08-10 | **Após ativar o terminal, o PDV abria o Início sem login.** O redirect, ao sair de `/terminal/activate` com credencial, devolvia sempre `PdvRoutes.home` *antes* do guard de operador. Na prática o refreshListenable aplicava esse único salto e o Início ficava na tela até o próximo clique — aí sim o guard mandava para `/operator/login`. Ao deixar a ativação o destino agora depende da sessão numa passada só: sem operador → login; com operador → Home. Travas em `activate_terminal_test.dart`. |
| 2026-08-07 | **Módulos passam a vir do ERP.** `HttpModuleConfigSource` substitui a `FixtureModuleConfigSource` como fonte de `moduleVisibilityProvider`: lê `GET /v1/pos/modules`, grava no cache local e cai nele sem rede; primeiro boot offline usa o perfil neutro, nunca "tudo ligado". A interface `ModuleConfigSource` existia desde o M0 exatamente para esta troca — o catálogo, os três estados e o `ModuleSetValidator` já estavam prontos. `ModuleSetValidator.ensureValid` passou a rodar **também sobre a resposta do servidor** (um teste pegou: a garantia do núcleo dependia de qual implementação de `PosModuleApi` estivesse injetada). `save()` grava só no cache — nunca no servidor. Repareamento dispara `refresh()` — pode ser outra loja. Ver §4.11.0. Travas em `test/unit/http_module_config_source_test.dart` (6) e `test/unit/module_catalog_contract_test.dart` (5), este último espelho de `pos-module.catalog.spec.ts` na API. |
| 2026-08-11 | **Venda em curso some ao desativar o terminal.** Carrinho (e pagamentos, cliente, vendedor, observação, ajuste, taxa/couvert, qty pendente, erro de barcode, categoria, mesa selecionada) é memória do processo — desativar sem matar o app deixava as linhas no Balcão; ao parear outra organização, o operador via itens que nem existiam lá. `resetOpenSale` + `openSaleResetBindingProvider` escutam a credencial e zeram quando ela some **ou** quando org/unidade/terminal mudam. A decisão não mora em `DeviceCredentialController.forget` — o terminal não importa counter/payment. `SaleCompletedPage` passou a chamar o mesmo reset (depois de `closeAccount`). Bloquear/Trocar operador **não** limpam o carrinho. O turno **não** fecha. Trava em `test/unit/open_sale_reset_test.dart`. Ver §4.13. |
| 2026-08-13 | **Fonte Inter embutida.** `PdvTypography.fontFamily = 'Inter'` + TTF 400/500/600/700 em `assets/fonts/` (SIL OFL, mesma família do `@citybox/ui`). O PDV deixa de herdar a fonte do SO em Linux/Windows/Android. |
