# PDV Flutter (`apps/pdv/app`) — o que falta para fechar o frontend

> Levantamento de 2026-08-05, feito só sobre `apps/pdv/app`. Escopo: telas e
> comportamento de interface. **Integração está fora** — onde este documento
> menciona backend é só para dizer o que a tela precisa mostrar, não como
> buscar o dado.

---

## 1. Premissa: um PDV só, modular por segmento

O PDV atende o ERP, e o ERP atende **food** (restaurante, lanchonete, pizzaria)
e **varejo** (loja de roupa, mercado, conveniência). Não são dois aplicativos:
é **um app cujo conjunto de módulos ligados muda por loja**.

Uma loja de roupa não vê Mesas nem Comandas. Um restaurante não vê consulta de
preço por código de barras nem grade de tamanho/cor. As duas veem Balcão,
Cliente, Caixa, Sangria, Últimas vendas.

Isso tem duas consequências que atravessam todo o resto deste documento:

1. **Nenhuma tela pode assumir que outra existe.** O Balcão não pode ter um
   botão fixo de Comandas; a tela de venda finalizada não pode ter uma saída
   fixa para Delivery. Cada ponto de entrada pergunta ao catálogo de módulos.
2. **A diferença entre os segmentos não está só em quais telas aparecem — está
   dentro das telas.** O Balcão do varejo precisa de código de barras, balança
   e grade de variação; o Balcão do food precisa de adicional, observação de
   cozinha e meia-pizza. É a mesma tela com blocos diferentes ligados, não duas
   telas.

**A boa notícia:** o app já tem o mecanismo certo. `features/modules/` é a
fonte única de "o que está ligado", e desligar um módulo já o esconde em
qualquer tela que consulte o mesmo `id` — o bloco da Home, o atalho de teclado
e o botão equivalente na app bar. A arquitetura está certa; o que falta é
alcance (§5) e origem do estado (§5.1).

---

## 2. Resumo

O app tem **5 páginas** e **6 diálogos/painéis** construídos, todos sobre
fixture local. O fluxo "abrir Balcão → lançar produto → pagar → fechar venda"
funciona de ponta a ponta na tela.

O que falta é grande e previsível: **11 das 13 ações do catálogo da tela
inicial não têm destino**, mais um conjunto de telas que nem estão no catálogo
(caixa/turno, login de operador, configurações do terminal). São **13 botões
que hoje caem em `showNotImplementedFeedback`**.

Além das telas ausentes, há quatro lacunas transversais que ficam mais caras a
cada tela nova — e por isso deveriam ser resolvidas **antes** de escalar: o
sistema de módulos precisa crescer (§5), dinheiro está em `double`, não há
layout compacto/médio, e a navegação é `Navigator.push`.

---

## 3. Inventário do que existe

### 3.1 Páginas

| Tela | Arquivo | Estado |
|---|---|---|
| Início | `features/home/presentation/home_page.dart` | ✅ completa — grade + coluna, atalhos, 2 breakpoints, sobrevive a qualquer subconjunto de módulos |
| Balcão | `features/counter/presentation/counter_page.dart` | 🟡 layout completo, 3 botões mortos, sem os blocos por segmento |
| Pagamento | `features/payment/presentation/payment_page.dart` | 🟡 fluxo completo, 2 botões mortos |
| Venda finalizada | `features/payment/presentation/sale_completed_page.dart` | 🟡 5 das 7 saídas mortas, e nenhuma consulta módulo |
| Cadastro de cliente | `features/customer/presentation/customer_form_page.dart` | ✅ formulário completo |

### 3.2 Diálogos e painéis

`CustomerPickerDialog` · `SellerPickerDialog` · `SaleNoteDialog` ·
`PaymentBrandPicker` · `ModulesPanel` (endDrawer) · confirmação de cancelar
venda.

### 3.3 O que já funciona de verdade

- Carrinho com edição inline de quantidade e desconto por linha, remoção,
  hover, estado vazio.
- Busca de produto e filtro por categoria.
- Pagamento com **múltiplas formas** na mesma venda, bandeira, parcelas,
  teclado em centavos, atalhos (ENTER, INSERT, F2), remoção de pagamento.
- Vendedor e observação da venda, com limpeza correta ao fechar.
- **Módulos**: `moduleVisibilityProvider` como fonte única, consultado pela
  Home (bloco + atalho) e pela app bar do Balcão (Cliente, Comandas).
- Barra de título própria no desktop.

---

## 4. Telas que faltam — classificadas por segmento

Legenda: **⬛ Núcleo** (as duas verticais) · **🍽 Food** · **🏬 Varejo**

### 4.1 Ações do catálogo sem destino

Das 13 ações de `features/home/data/home_actions.dart`, só **Balcão** e
**Cliente** navegam.

| Ação | Atalho | Seg. | O que a tela precisa ter |
|---|---|---|---|
| **Sangria / reforço** | `S` | ⬛ | retirada e aporte na gaveta, motivo, comprovante |
| **Últimas vendas** | `U` | ⬛ | histórico do turno, detalhe, reimprimir, cancelar venda |
| **Devolução** | `V` | ⬛ | busca da venda original, itens a devolver, forma de estorno |
| **Crédito dos clientes** | `C` | ⬛ | saldo/fiado por cliente, lançar pagamento, extrato |
| **Configurações** | `Ç` | ⬛ | terminal, impressora, gaveta, balança, **módulos** (§5.4). **Três pontos de entrada mortos**: Home, toolbar do Balcão, app bar do Pagamento |
| **Vendedor** | `F9` | ⬛ | o seletor **já existe** (`seller_picker_dialog.dart`), só é alcançável pela app bar do Pagamento. A ação da Home não chama ele — item mais barato da lista |
| **Mesas** | `M` | 🍽 | mapa de mesas com estado (livre/ocupada/fechando), abrir → Balcão vinculado, transferir, juntar, dividir conta |
| **Comandas** | `Q` | 🍽 | comandas abertas, abrir por número/cartão, lançar item, fechar → Pagamento. Também é botão morto na app bar do Balcão |
| **Atendimentos** | `A` | 🍽 | fila de atendimentos em curso, retomar, cancelar |
| **Delivery** | `D` | 🍽 | novo pedido: cliente + endereço + taxa + entregador. *Varejo com entrega pode ligar* |
| **Pedidos delivery** | `W` | 🍽 | pedidos recebidos, status, despacho. *Idem* |

### 4.2 Telas que nem estão no catálogo

| Tela | Seg. | Por que é necessária |
|---|---|---|
| **Abertura e fechamento de caixa** | ⬛ | Sangria existe, mas o turno não. Nenhum PDV opera sem abrir com fundo de troco e fechar com conferência. É pré-requisito de Sangria, Últimas vendas e relatório |
| **Login / identificação do operador** | ⬛ | O app abre direto na Home. Sem operador não há comissão, trilha de quem cancelou, nem bloqueio entre atendimentos |
| **Ativar terminal (pareamento)** | ⬛ | Primeira tela numa instalação nova. Já antecipada no `AGENTS.md` §6 |
| **Configurações → Módulos** | ⬛ | Hoje o painel só abre pela barra de título, que **não existe no Android** (§5.4) |
| **Menu geral / Sair** | ⬛ | Dois botões mortos no `PdvAppBar`. Ou ganham destino, ou saem da moldura |
| **Seletor de loja/filial** | ⬛ | O nome da loja é clicável em duas app bars e não faz nada |
| **Relatório gerencial** | ⬛ | Saída morta na venda finalizada |
| **Estados de sistema** | ⬛ | Offline, sincronizando, erro. A barra de título reserva o espaço visual; nenhuma tela reage |
| **Consulta de preço** | 🏬 | Ler código de barras sem lançar no carrinho — padrão de loja |
| **Gerar nota / enviar NF por e-mail** | ⬛ | Duas saídas mortas. O documento difere (NFC-e/SAT no varejo, NFC-e no food), o fluxo de tela é o mesmo |
| **Reimpressão / segunda via** | ⬛ | Depende de Últimas vendas |

---

## 5. O sistema de módulos precisa crescer

Esta é a seção nova, e a mais importante: o mecanismo está certo, mas o alcance
dele hoje cobre só uma fatia do que o modelo multi-segmento exige.

### 5.1 🔴 Quem decide os módulos é o ERP — o painel de hoje é ferramenta de dev

**O `ModulesPanel` não é funcionalidade de produto.** É um instrumento de
desenvolvimento: existe para conseguir ver o app configurado como restaurante
ou como loja de roupa sem ter backend. Nenhum lojista vai abrir esse drawer.

Na operação real, **o conjunto de módulos é configuração da loja no ERP**, e o
PDV apenas obedece. A composição — vertical, plano contratado, permissão do
operador, preferência daquele terminal — é resolvida **do lado do ERP**; o PDV
recebe o resultado já pronto e não recalcula nada. Isso é bom: mantém o app
burro nesse ponto, e um lojista não consegue ligar um módulo que não contratou
mexendo no terminal.

O que a Fase 0 precisa entregar, então, **não é** um seletor melhor. É:

| Item | Por quê |
|---|---|
| **`build()` lê de uma fonte injetável**, não de `const <String>{}` | hoje o valor está cravado no controller; o dia da integração troca a fonte sem tocar em quem consome |
| **Cache local do último conjunto conhecido** | o PDV precisa abrir e vender sem rede. Sem cache, um terminal offline sobe sem saber quais módulos tem |
| **O painel dev fora do build de release** | `kReleaseMode` ou `--dart-define`. Um switch que reconfigura o PDV inteiro não pode existir no terminal do lojista, nem escondido |
| **Módulo é leitura, não escrita, para o operador** | ver §5.4 |

O contrato atual (`isVisible`, guardar os escondidos, um provider lido de todo
lugar) continua válido inteiro. **Só a origem muda** — e é exatamente por isso
que a estrutura de hoje aguenta: quem consome já pergunta a um lugar só.

### 5.2 🔴 "Escondido" é um estado só para três situações diferentes

Hoje um módulo ou aparece, ou não existe. Na prática são três casos com
tratamento de interface distinto:

| Situação | O que o operador deve ver |
|---|---|
| **Não contratado** (plano/vertical) | nada — o módulo não existe para essa loja |
| **Desligado neste terminal** | nada na tela, mas reversível nas Configurações do próprio terminal |
| **Sem permissão do operador** | depende: ou some, ou aparece e pede senha de gerente |

O terceiro caso é o que quebra o modelo binário atual. "Cancelar venda" e
"Sangria" tipicamente aparecem para todos e pedem autorização — não somem. Sem
um estado `bloqueado`, cada tela vai inventar o seu.

Quem sabe em qual dos três um módulo está é o ERP (§5.1). O que falta **no app**
é o vocabulário de interface para cada um: o que some, o que aparece apagado, e
o que abre o pedido de senha de gerente.

### 5.3 🟠 Módulo de núcleo pode ser desligado — e o PDV fica sem tela de venda

O `ModulesPanel` lista **todas** as ações, inclusive **Balcão**. Desligar o
Balcão deixa o PDV sem nenhuma forma de abrir uma venda, e sem nada na tela que
explique o que aconteceu.

Mesmo sendo o painel só uma ferramenta de dev, a distinção precisa existir no
catálogo: **módulo de núcleo** (Balcão, Cliente, Configurações — a configuração
do ERP não deveria conseguir desligar) × **módulo opcional** (Mesas, Comandas,
Delivery — o que a loja escolhe). É a marcação que impede uma configuração
errada do outro lado de derrubar o terminal, e ela vale como validação de
entrada mesmo quando o dado vem pronto.

### 5.4 🟠 O painel dev é desktop-only — e isso está certo; o que falta é o oposto

O botão vive na `PdvTitleBar`, que só existe no desktop, então **não há como
abrir o painel num tablet ou celular**. Para uma ferramenta de desenvolvimento
isso não é defeito: quem desenvolve está no desktop, e o teste em tablet pode
subir com o conjunto escolhido via `--dart-define`.

O que falta é o outro lado. Em **Configurações** (`Ç`) o lojista precisa ver
**quais módulos estão ligados nesta loja — em modo leitura**, com a indicação
de onde se muda ("configurado no ERP"). Isso resolve a pergunta real do suporte
("por que o Comandas não aparece no caixa 2?") sem dar ao terminal um botão que
contradiz a configuração central.

Ou seja: o painel dev **não vira** seção de Configurações. São duas coisas
diferentes — uma escreve e sai no release, a outra só lê e fica.

### 5.5 🟠 Os módulos só cobrem telas inteiras — falta o nível de comportamento

`PdvModuleIds` tem 13 entradas, uma por ação da Home. Mas boa parte da diferença
entre food e varejo acontece **dentro do Balcão**, e não tem id nenhum:

| Comportamento | Seg. | Onde entra |
|---|---|---|
| Código de barras | 🏬 | toolbar do Balcão (hoje campo decorativo) |
| Balança / produto por peso | 🏬 | lançamento no Balcão |
| Grade e variação (tamanho, cor) | 🏬 | seleção do produto |
| Adicional / opcional do item | 🍽 | lançamento no Balcão |
| Observação de cozinha por item | 🍽 | lançamento no Balcão |
| Meia-a-meia (pizza) | 🍽 | lançamento no Balcão |
| Impressão de cozinha/produção | 🍽 | ao lançar ou ao fechar |
| Taxa de serviço (10%) | 🍽 | painel de totais |
| Couvert / entrada | 🍽 | painel de totais |

Sem ids para esses, ou o Balcão vira dois arquivos por segmento — o que
contradiz "um PDV só" — ou cada bloco ganha um `if` solto, e a fonte única de
verdade deixa de ser única. **A extensão de `PdvModuleIds` para o nível de
comportamento é pré-requisito da Fase 2 e 3.**

### 5.6 🟡 Perfis de segmento — conceito do ERP, fixture no PDV

Configurar uma loja nova no ERP não deveria ser marcar 13+ caixas. O padrão é
escolher um **perfil** — *Restaurante*, *Lanchonete com delivery*, *Loja*,
*Mercado* — que já traz o conjunto certo, e depois ajustar o que destoa. **Essa
tela é do ERP, não do PDV.**

Mas o PDV precisa dos mesmos perfis por outro motivo: como **fixture nomeada**.
São eles que dão os presets do painel dev (§5.1) e os cenários de golden e
teste de fluxo (§7.4) — em vez de combinações arbitrárias de switches, 3–4
configurações com nome que espelham o que o ERP vai mandar.

Vale definir os perfis uma vez e deixar os dois lados lendo a mesma lista.

### 5.7 ✅ O que já está certo e não deve mudar

- **Um provider, lido de vários lugares** — não um flag por tela. É o que faz
  desligar Comandas sumir do bloco da Home, do atalho `Q` e do botão da app bar
  do Balcão de uma vez só.
- **Guardar os escondidos, não os visíveis** — o padrão "tudo aparece" não
  precisa listar o catálogo à mão.
- **A Home sobrevive a qualquer subconjunto.** As sub-colunas usam `Expanded`;
  esconder um bloco faz os vizinhos crescerem, sem lógica de prioridade. Se uma
  sub-coluna esvazia, a outra assume a largura toda. Já há teste travando isso
  (`home_grid_columns_test.dart`). **É o comportamento que uma loja de roupa vai
  exercitar todo dia** — com Mesas, Comandas e Atendimentos desligados, a grade
  fica com 3 dos 6 blocos.
- **Atalho de teclado segue o módulo.** Um bloco escondido não responde à
  própria tecla.

### 5.8 Onde o modelo ainda não é consultado

Duas telas construídas ignoram os módulos:

- **`SaleCompletedPage`** — as saídas Delivery e Atendimentos são fixas. Numa
  loja de roupa, os dois botões aparecem e não deveriam.
- **`PaymentAppBar`** — Vendedor e observação são fixos; vendedor é módulo
  (`PdvModuleIds.seller`) e uma loja sem comissão desliga.

São dois consertos pequenos, mas é o tipo de coisa que se multiplica: **toda
tela nova precisa nascer perguntando ao catálogo.**

---

## 6. Lacunas dentro das telas que já existem

### 6.1 Balcão

- **Código de barras é decorativo.** `_ToolbarField` em `counter_toolbar.dart`
  é um `Text` com ícone — sem controller, sem `onSubmitted`, sem foco. É o
  campo mais usado do PDV de varejo (🏬).
- **Sem desconto ou acréscimo na venda inteira.** O desconto só existe por
  linha; a linha "Desconto" do painel é o percentual **derivado**, não editável.
  Sem isso não há como dar 10% no total nem lançar taxa de serviço (🍽).
- **Sem entrada por quantidade × produto** (`3 * ENTER` antes de bipar) (🏬).
- **Sem navegação por teclado na lista lançada** — nem setas, nem remoção da
  linha selecionada. O único atalho da tela é F2.
- **Faltam todos os blocos de segmento da §5.5.**
- Botões mortos: **Comandas** (🍽), **nome da loja**, **Configurações**.

### 6.2 Pagamento

- Botões mortos: **Configurações**, **nome da loja**.
- Sem estado de **aguardando maquininha** nem de **recusa**. Mesmo sem TEF, o
  layout precisa prever os dois — senão a tela é redesenhada quando o TEF entrar.
- Sem confirmação de troco em dinheiro (conferir/imprimir).
- Sem cancelamento de pagamento lançado **com motivo** — só remoção direta.
- Não consulta módulos (§5.8).

### 6.3 Venda finalizada

5 das 7 saídas mortas (Delivery, Atendimentos, Gerar nota, Relatório gerencial,
Enviar NF). E as saídas são fixas, não filtradas por módulo (§5.8).

### 6.4 Cliente

O formulário é o mais completo do app (nome, CPF/CNPJ com máscara, nascimento,
RG, e-mail, dois telefones, endereço com 7 campos, categoria, observação).
Faltam:

- **Busca de CEP** — o campo é só digitação manual.
- **Validação de CPF/CNPJ**: `brazilian_masks.dart` formata mas não confere
  dígito verificador. Um CPF inválido entra sem reclamação.
- **Excluir cliente** e **histórico de compras**.

---

## 7. Lacunas transversais

Além do sistema de módulos (§5), três decisões que toda tela nova herda.

### 7.1 🔴 Dinheiro em `double` — contradiz o próprio `AGENTS.md`

A regra §4.6 do `AGENTS.md` do módulo diz, textualmente: *"inteiro em centavos,
nunca `double`"*. O código faz o contrário:

- `CounterProduct.price` → `double`
- `CounterTotals.subtotal` / `.discount` / `.total` → `double`
- `PaymentSummary.total` / `.received` / `.remaining` / `.change` → `double`
- Fixture com `price: 2.5`, `price: 5.5`

`PaymentSummary.canFinalize` compara `received >= total` em ponto flutuante — o
caso exato que a regra existe para evitar: uma venda que não fecha porque o
recebido deu `29.999999999999996`.

Hoje são 3 domains e 2 fixtures. Depois de Mesas, Comandas, Delivery, Devolução
e Crédito, são 10+. **Migrar agora é uma tarde; migrar depois é uma semana com
risco de divergência de caixa.**

### 7.2 🟠 Nenhuma tela operacional tem layout compacto ou médio

O `AGENTS.md` §4.7 define três formatos (< 720 celular, 720–1199 tablet, ≥ 1200
caixa fixo). Há `LayoutBuilder` em **dois** lugares: `home_page.dart` (um
breakpoint em 900) e `counter_product_grid.dart` (colunas da grade).

Balcão soma 250 + 400 = 650 px em colunas rígidas; Pagamento, 200 + 400 = 600
px. `main.dart` fixa a janela mínima em 1024×640. **Num tablet Android de 10"
em retrato (800 px) as duas telas quebram** — e tablet do salão e celular do
garçom são plataformas declaradas em escopo, além de serem exatamente o
hardware do segmento **food**, que é o piloto.

Mesas e Comandas são, por natureza, telas de tablet. Construí-las antes de
resolver isso é construí-las duas vezes.

### 7.3 🟠 Navegação por `Navigator.push` com 11 telas pela frente

`pushWithPageTitle` funciona para 4 telas. Com Mesa → Comanda → Balcão →
Pagamento → Venda fechada, mais retorno à mesa de origem, aparecem problemas que
`Navigator` não resolve bem: voltar a um ponto específico da pilha, deep-link de
pedido delivery, restauração de estado depois de o app ser morto pelo Android.

O `pubspec.yaml` já declara a intenção (`go_router → quando existir a segunda
tela`) — e já existem cinco. **A dívida está vencida.**

### 7.4 Menores

- **Sem estados de carregamento e erro.** Tudo é fixture síncrono; só existe um
  estado vazio (`_EmptyCart`). O vocabulário visual desses estados ainda não
  foi desenhado.
- **Sem teclado numérico na tela para Android.** Balcão e Pagamento pressupõem
  teclado físico.
- **Acessibilidade**: nenhum `Semantics` no app.
- **Testes**: 12 unit + 20 widget, boa cobertura do que existe. Mas
  `test/golden/` e `integration_test/` estão previstos no `AGENTS.md` §5 e **não
  existem**. Com o modelo modular, o golden precisa ser **por perfil de
  segmento** (§5.6), não por tela isolada.
- **`TerminalSession`** (`features/shared/domain/`) está órfão desde que a
  identificação de operador saiu da barra de título.

---

## 8. Sequência sugerida

Ordem pensada para que cada fase entregue algo operável e não gere retrabalho.

### Fase 0 — Fundação (antes de qualquer tela nova)

1. **Módulos**: estender `PdvModuleIds` ao nível de comportamento (§5.5); marcar
   núcleo × opcional (§5.3); trocar o estado binário por
   `disponível / desligado / bloqueado` (§5.2); tornar a fonte do `build()`
   injetável, com cache local e perfis nomeados como fixture, e isolar o painel
   dev fora do release (§5.1).
2. Migrar dinheiro para centavos (`int`).
3. Introduzir `go_router` e portar as 5 telas.
4. Definir a estratégia responsiva: `PdvBreakpoints` aplicado a Balcão e
   Pagamento — ou registrar por escrito o adiamento do mobile.
5. Padronizar estados de carregamento / erro / vazio como widgets do `ui/`.
6. Consertar as duas telas que ignoram módulos (§5.8).

*Sem backend nenhum. É refatoração de base.*

### Fase 1 — Núcleo comum às duas verticais ⬛

Sem isso o PDV não opera um turno inteiro, em nenhum segmento.

7. Abertura e fechamento de caixa (turno).
8. Sangria / reforço (`S`).
9. Últimas vendas (`U`) + detalhe da venda.
10. Configurações do terminal (`Ç`), com a lista de módulos **em modo leitura**
    (§5.4) — "por que o Comandas não aparece neste caixa?" precisa ter resposta
    na tela, sem virar um botão que contradiz o ERP.
11. Desconto e acréscimo na venda inteira.
12. Vendedor a partir da Home (`F9`) — religar o seletor existente.

### Fase 2 — Food 🍽 (vertical piloto)

13. Mesas (`M`).
14. Comandas (`Q`) — Home **e** app bar do Balcão.
15. Atendimentos (`A`).
16. Blocos do Balcão: adicional, observação de cozinha, meia-pizza.
17. Taxa de serviço e couvert no painel de totais.
18. Delivery (`D`) e Pedidos delivery (`W`).

### Fase 3 — Varejo 🏬

19. Código de barras funcional no Balcão.
20. Grade e variação (tamanho, cor).
21. Produto por peso / balança.
22. Consulta de preço.
23. Devolução (`V`) e Crédito dos clientes (`C`) — ⬛, mas o varejo pressiona mais.

### Fase 4 — Sessão, fiscal e pós-venda ⬛

24. Login/identificação do operador + bloqueio de tela.
25. Ativar terminal (pareamento).
26. Gerar nota, relatório gerencial, enviar NF por e-mail.
27. Estados de sistema: offline, sincronizando, erro.
28. Menu geral, Sair, seletor de loja — ou remoção dos botões.

### Fase 5 — Qualidade

29. Goldens **por perfil de segmento** nos três formatos.
30. `integration_test/` do fluxo de venda: um por perfil.
31. Passada de acessibilidade.

---

## 9. Decisões que precisam de você

1. **Quais são os perfis de segmento?** (§5.6) Proposta: *Restaurante*,
   *Lanchonete com delivery*, *Loja*, *Mercado*. A tela que os aplica é do ERP,
   mas o PDV precisa da lista já na Fase 0 — é dela que saem os presets de dev
   e os cenários de golden.
2. **A configuração de módulos é por loja ou por terminal?** Se o caixa 2 pode
   ter um conjunto diferente do caixa 1, isso é cadastro de terminal no ERP —
   e muda o que o PDV pede ao parear (§4.2, "ativar terminal").
3. **Mobile entra agora ou é adiado?** Muda a Fase 0 inteira — e Mesas/Comandas
   (Fase 2) são telas de tablet por natureza.
4. **Food ou varejo primeiro?** As Fases 2 e 3 são intercambiáveis.
5. **Módulo bloqueado por permissão some ou pede senha de gerente?** (§5.2)
   Define o vocabulário de todas as telas sensíveis.
6. **Abertura de caixa é obrigatória?** Se for, vira a primeira tela depois do
   login e muda o ponto de entrada da Home.
7. **Existe menu geral?** Ou a moldura perde "Menu" e "Sair"?
8. **O nome da loja é seletor de filial ou rótulo?**
