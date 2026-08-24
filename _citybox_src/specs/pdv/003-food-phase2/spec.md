# Feature Specification: PDV Food (Fase 2)

**Feature Branch**: `003-food-phase2`

**Created**: 2026-08-05

**Status**: Draft

**Input**: User description: "Fase 2 do PDV Flutter: módulos e telas da vertical food (Mesas, Comandas, Atendimentos, blocos do Balcão food, taxa/couvert, Delivery e Pedidos delivery) conforme gap frontend 2026-08-05. Sem integração backend — UI e fixtures."

**Fonte de análise**: `.claude/docs/pdv-app-frontend-gap-2026-08-05.md` (Fase 2 itens 13–18; §4.1 food; §5.5 comportamentos food; §6.1 Balcão; §7.2 breakpoints; §8 sequência; premissa §1)

**Escopo de produto**: app nativo de ponto de venda (`apps/pdv/app`), **um único PDV** cujo conjunto de módulos muda por loja. Esta fase entrega a fatia **🍽 Food** (vertical piloto): salão (mesas/comandas/atendimentos), blocos de lançamento no Balcão, taxa/couvert e delivery.

**Pré-requisitos**:
- Fase 0 (`001-foundation-phase0`) — catálogo com ids de comportamento food, estados, rotas, centavos, estados UI, telas consultando o catálogo; **dívida de breakpoints reabre aqui**.
- Fase 1 (`002-common-core-phase1`) — turno/caixa, sangria, últimas vendas, configurações, ajuste genérico de total, vendedor na Home; operações de venda/gaveta exigem turno aberto.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Layouts compacto, médio e expandido (reabertura da dívida) (Priority: P1)

Como operador em tablet do salão (ou celular do garçom, no formato compacto), consigo usar Mesas, Comandas, Atendimentos, Delivery e o fluxo Balcão → Pagamento sem colunas rígidas quebrarem a tela. Os três formatos oficiais do PDV (< 720, 720–1199, ≥ 1200) passam a valer para **todas as telas novas desta fase** e para **Balcão e Pagamento** (dívida explícita da Fase 0).

**Why this priority**: Sem isso, Mesas/Comandas seriam construídas duas vezes; o gap e a Fase 0 já fixaram este gatilho.

**Independent Test**: Em cada formato, abrir mapa de mesas → comanda/balcão → pagamento e concluir uma venda de fixture sem overflow crítico nem colunas inacessíveis.

**Acceptance Scenarios**:

1. **Given** largura compacta (< 720), **When** o operador usa Mesas, Comandas, Atendimentos ou lista de Delivery, **Then** a tela permanece utilizável (conteúdo empilhado ou adaptado; sem depender de janela mínima de desktop).
2. **Given** largura média (720–1199), **When** percorre Balcão e Pagamento, **Then** o layout deixa de exigir as colunas rígidas do caixa expandido e permanece operável.
3. **Given** largura expandida (≥ 1200), **When** usa as mesmas telas, **Then** o layout de caixa/desktop permanece coerente (sem regressão funcional no formato já existente).
4. **Given** perfil Loja (sem módulos food), **When** está em Balcão/Pagamento nos três formatos, **Then** os blocos food continuam ausentes e o layout não reserva espaço morto para eles.

---

### User Story 2 - Mapa de mesas (Priority: P1)

Como operador de restaurante, abro Mesas (`M`), vejo o mapa com estado (livre / ocupada / fechando), abro uma mesa livre no Balcão vinculado, e posso transferir, juntar e dividir conta conforme o fluxo da tela.

**Why this priority**: Núcleo do salão food; ação `M` hoje sem destino; piloto Ilhéus.

**Independent Test**: Perfil Restaurante → Home `M` → abrir mesa → lançar item no Balcão → voltar ao mapa com mesa ocupada; executar transferir/juntar/dividir em fixture.

**Acceptance Scenarios**:

1. **Given** módulo Mesas disponível e turno aberto, **When** o operador usa Home/`M`, **Then** chega ao mapa de mesas (não “não implementado”).
2. **Given** uma mesa livre, **When** abre a mesa, **Then** entra no Balcão (ou fluxo de lançamento) **vinculado** àquela mesa; ao voltar, a mesa aparece ocupada.
3. **Given** mesas ocupadas na fixture, **When** visualiza o mapa, **Then** distingue livre, ocupada e fechando.
4. **Given** mesa(s) ocupada(s), **When** executa transferir, juntar ou dividir conta, **Then** o mapa e os vínculos de conta refletem a operação (fixture) com confirmação explícita quando a ação for destrutiva/ irreversível na UI.
5. **Given** módulo Mesas indisponível (ex.: perfil Loja), **When** está na Home, **Then** Mesas não aparece e o atalho não responde.
6. **Given** turno fechado, **When** tenta abrir Mesas, **Then** o fluxo exige/abre o hub Caixa (mesma regra operacional da Fase 1).

---

### User Story 3 - Comandas (Priority: P1)

Como operador, abro Comandas (`Q`) pela Home **e** pelo botão da app bar do Balcão, vejo comandas abertas, abro por número/cartão, lanço itens e fecho a comanda indo ao Pagamento.

**Why this priority**: Segundo fluxo crítico do salão; botão morto no Balcão hoje.

**Independent Test**: Abrir comanda pela Home e pelo Balcão; lançar item; fechar → Pagamento; perfil sem Comandas esconde ambas as entradas.

**Acceptance Scenarios**:

1. **Given** módulo Comandas disponível e turno aberto, **When** usa Home/`Q` ou o botão Comandas no Balcão, **Then** chega à lista/abertura de comandas.
2. **Given** a tela de comandas, **When** informa número ou cartão válido da fixture, **Then** abre/retoma a comanda correspondente.
3. **Given** comanda aberta, **When** lança itens e solicita fechar, **Then** segue para Pagamento com a conta da comanda; após venda concluída, a comanda deixa de figurar como aberta.
4. **Given** módulo Comandas desligado, **When** está na Home ou no Balcão, **Then** não há entrada de Comandas (Home, atalho e app bar).
5. **Given** turno fechado, **When** tenta Comandas, **Then** bloqueio com fluxo para o hub Caixa.

---

### User Story 4 - Fila de atendimentos (Priority: P2)

Como operador, abro Atendimentos (`A`), vejo a fila de atendimentos em curso (mesa e/ou comanda), retomo um atendimento no Balcão vinculado e posso cancelar um atendimento com confirmação.

**Why this priority**: Fecha a tríade do salão; depende de haver sessões abertas via Mesas/Comandas.

**Independent Test**: Com ao menos um atendimento aberto na fixture, listar → retomar → cancelar; sem módulo, ação ausente.

**Acceptance Scenarios**:

1. **Given** módulo Atendimentos disponível e turno aberto, **When** usa Home/`A`, **Then** vê a fila de atendimentos em curso (não “não implementado”).
2. **Given** um atendimento na fila, **When** retoma, **Then** abre o Balcão (ou lançamento) vinculado àquela sessão.
3. **Given** um atendimento cancelável, **When** confirma o cancelamento, **Then** some da fila e a mesa/comanda associada volta ao estado coerente (ex.: mesa livre se não houver outra conta).
4. **Given** fila vazia, **When** abre Atendimentos, **Then** vê estado vazio padronizado (Fase 0).
5. **Given** módulo indisponível, **When** na Home, **Then** Atendimentos não aparece.

---

### User Story 5 - Blocos food no Balcão (Priority: P1)

Como operador em perfil food, ao lançar produto no Balcão posso (quando os módulos de comportamento estiverem disponíveis): adicionar **adicionais/opcionais**, informar **observação de cozinha** por item e montar **meia-a-meia** (dois sabores/metades) quando o produto permitir. Em perfil sem esses módulos, o Balcão não oferece os blocos.

**Why this priority**: Diferença food × varejo *dentro* da mesma tela de Balcão; ids de comportamento já previstos na Fase 0.

**Independent Test**: Perfil Restaurante — lançar item com adicional + observação; montar meia-pizza; perfil Loja — mesmos blocos ausentes.

**Acceptance Scenarios**:

1. **Given** módulo de adicional disponível e produto com opcionais na fixture, **When** lança o produto, **Then** pode escolher adicionais antes/ao confirmar o lançamento e o item no carrinho reflete a escolha (e o preço em centavos).
2. **Given** módulo observação de cozinha disponível, **When** lança ou edita um item, **Then** pode gravar observação por linha visível no carrinho.
3. **Given** módulo meia-a-meia disponível e produto elegível, **When** monta meia-pizza, **Then** escolhe duas metades e o carrinho mostra a composição; total em centavos coerente com a regra de preço da fixture.
4. **Given** qualquer um desses comportamentos desligado, **When** está no Balcão, **Then** o bloco correspondente não é oferecido (mesma consulta de catálogo da Home).
5. **Given** carrinho com item food enriquecido, **When** vai a Pagamento e conclui, **Then** o detalhe da venda (Últimas vendas / comprovante fixture) preserva adicionais, observação e meia-a-meia de forma legível.

---

### User Story 6 - Taxa de serviço e couvert no painel de totais (Priority: P1)

Como operador food, no painel de totais do Balcão aplico **taxa de serviço** (ex.: 10%) e/ou **couvert/entrada** quando os módulos de comportamento correspondentes estiverem disponíveis — distintos do ajuste genérico de desconto/acréscimo da Fase 1.

**Why this priority**: Operação diária de salão; hoje o painel só tem desconto derivado/ajuste genérico.

**Independent Test**: Ligar taxa 10% e couvert em valor; ver total; desligar módulos e confirmar ausência; combinar com desconto de linha e ajuste de venda sem total negativo indevido.

**Acceptance Scenarios**:

1. **Given** módulo taxa de serviço disponível e carrinho com itens, **When** ativa a taxa (percentual configurável na fixture, padrão 10%), **Then** o painel mostra a linha de taxa e o total aumenta de forma auditável em centavos.
2. **Given** módulo couvert disponível, **When** lança couvert (valor em centavos, quantidade de pessoas se a UI exigir), **Then** o painel mostra a linha e o total reflete.
3. **Given** taxa e/ou couvert ativos, **When** aplica também o ajuste genérico de venda (Fase 1), **Then** a ordem de cálculo permanece coerente e documentada na UI (linhas → taxa/couvert → ajuste de venda, ou a ordem fixada na implementação desde que testável e estável); total final ≥ 0.
4. **Given** módulos de taxa/couvert desligados, **When** no Balcão, **Then** essas linhas/controles não aparecem.
5. **Given** taxa/couvert na venda, **When** conclui o pagamento, **Then** constam no detalhe/comprovante da venda do turno.

---

### User Story 7 - Delivery: novo pedido e fila de pedidos (Priority: P2)

Como operador, crio um **novo pedido delivery** (`D`: cliente + endereço + taxa de entrega + entregador) e gerencio **pedidos delivery** (`W`: recebidos, status, despacho). Loja food (e perfil com delivery ligado) vê as ações; perfil sem o módulo não vê. *Varejo com entrega pode ligar os mesmos módulos* — a UI não assume “só restaurante”.

**Why this priority**: Fecha o catálogo food da Home; saídas na venda finalizada já consultam o catálogo (Fase 0).

**Independent Test**: Criar pedido → aparece na fila com status; despachar; perfil sem Delivery esconde `D`/`W` e saídas relacionadas.

**Acceptance Scenarios**:

1. **Given** módulo Delivery disponível e turno aberto, **When** usa Home/`D`, **Then** inicia novo pedido com cliente, endereço, taxa de entrega e entregador (fixture/seletores).
2. **Given** pedido criado, **When** confirma, **Then** pode seguir para lançamento/Balcão ou fila conforme o fluxo; o pedido aparece em Pedidos delivery.
3. **Given** módulo Pedidos delivery disponível, **When** usa Home/`W`, **Then** lista pedidos com status e permite despacho (mudança de status) e abertura do detalhe.
4. **Given** venda finalizada com Delivery disponível, **When** usa a saída Delivery (se existir), **Then** chega ao fluxo de novo pedido — não a botão morto.
5. **Given** módulos de delivery desligados, **When** na Home ou na venda finalizada, **Then** ações/saídas de delivery não aparecem.
6. **Given** turno fechado, **When** tenta `D` ou `W`, **Then** bloqueio com fluxo para o hub Caixa.

---

### Edge Cases

- Mesa ocupada ao tentar abrir de novo: retoma o atendimento existente em vez de criar conta duplicada silenciosa.
- Transferir para mesa já ocupada: confirmação explícita ou recusa com mensagem clara (fixture define a regra; UI não falha em silêncio).
- Juntar mesas com contas distintas: total consolidado visível antes de confirmar.
- Dividir conta: pelo menos divisão em N partes iguais na fixture; itens indivisíveis tratados com mensagem.
- Comanda inexistente / número inválido: erro acionável (estado padronizado), sem crash.
- Fechar comanda com carrinho vazio: ação indisponível ou confirmação de conta zerada conforme regra da fixture.
- Meia-a-meia com produto não elegível: opção não oferecida.
- Adicional obrigatório não escolhido: impede lançamento com mensagem.
- Taxa de serviço com total de linhas zero: taxa zero ou controle indisponível.
- Couvert com quantidade zero: validação impede.
- Ajuste genérico de venda + taxa + couvert empurrando total: validação impede total < 0.
- App reiniciado com mesa/comanda aberta: restaura sessões abertas da persistência local (mesmo espírito da Fase 1 para turno).
- Perfil Lanchonete com delivery: Mesas pode estar desligado e Delivery ligado — Home e fluxos sobrevivem ao subconjunto.
- Tablet em retrato (~800 px): Mesas e Comandas usáveis (User Story 1).
- Venda em andamento ao tentar operações destrutivas de mesa (juntar/cancelar atendimento): confirmação ou bloqueio explícito.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST aplicar os **três formatos** oficiais do PDV (compacto / médio / expandido) às telas novas desta fase (Mesas, Comandas, Atendimentos, Delivery, Pedidos delivery) e a **Balcão e Pagamento**, eliminando a quebra em larguras típicas de tablet.
- **FR-002**: A ação Home **Mesas** (`M`) MUST ter destino real quando o módulo estiver disponível; MUST exigir turno aberto (Fase 1).
- **FR-003**: O mapa de mesas MUST exibir estados **livre**, **ocupada** e **fechando** e MUST permitir abrir mesa → lançamento no Balcão vinculado.
- **FR-004**: O operador MUST poder **transferir**, **juntar** e **dividir conta** entre mesas/contas, com confirmação quando a ação alterar contas de forma irreversível na UI.
- **FR-005**: A ação Home **Comandas** (`Q`) e o botão Comandas da app bar do Balcão MUST navegar ao mesmo fluxo quando o módulo estiver disponível; MUST exigir turno aberto.
- **FR-006**: Comandas MUST permitir listar abertas, abrir/retomar por número ou cartão, lançar itens e **fechar → Pagamento**.
- **FR-007**: A ação Home **Atendimentos** (`A`) MUST listar atendimentos em curso, permitir retomar e cancelar (com confirmação); MUST exigir turno aberto.
- **FR-008**: Atendimento MUST representar uma sessão operacional vinculada a mesa e/ou comanda (fonte única de “o que está aberto no salão”).
- **FR-009**: Com módulos de comportamento disponíveis, o Balcão MUST oferecer **adicionais/opcionais**, **observação de cozinha por item** e **meia-a-meia** para produtos elegíveis — sem duplicar o Balcão em outro arquivo por segmento.
- **FR-010**: Adicionais, observação e meia-a-meia MUST persistir no item do carrinho e aparecer no detalhe/comprovante da venda (fixture).
- **FR-011**: Com módulos disponíveis, o painel de totais MUST permitir **taxa de serviço** (percentual) e **couvert/entrada** (valor), distintos do ajuste genérico de venda da Fase 1.
- **FR-012**: Taxa e couvert MUST entrar no total em **centavos** e constar na venda concluída do turno.
- **FR-013**: Ações Home **Delivery** (`D`) e **Pedidos delivery** (`W`) MUST ter destino real quando disponíveis; MUST exigir turno aberto.
- **FR-014**: Novo pedido delivery MUST coletar cliente, endereço, taxa de entrega e entregador (seletores/fixture) antes ou durante o fluxo de lançamento.
- **FR-015**: Pedidos delivery MUST listar pedidos com status e permitir despacho (atualização de status) e consulta de detalhe.
- **FR-016**: Todas as entradas, atalhos e saídas desta fase MUST consultar o **catálogo de módulos** (Fase 0); perfil sem food não vê Mesas/Comandas/Atendimentos/Delivery/blocos/taxa/couvert.
- **FR-017**: Valores monetários MUST permanecer em **centavos inteiros**.
- **FR-018**: Navegação MUST usar **rotas declarativas** (Fase 0), incluindo retorno à mesa/comanda/fila de origem após Pagamento quando o fluxo partiu do salão.
- **FR-019**: Estados vazio / carregamento / erro MUST usar os padrões da Fase 0.
- **FR-020**: Sessões de mesa/comanda/atendimento abertas e pedidos delivery em curso MUST ser **persistidos localmente** e restaurados após reinício (dados locais intactos), alinhado ao turno da Fase 1.
- **FR-021**: Nenhuma integração de backend, TEF, impressão física de cozinha, Keycloak, GPS de entregador ou sync ERP entra nesta fase.
- **FR-022**: Código de barras funcional, grade/variação, balança, consulta de preço, Devolução e Crédito de clientes permanecem **fora** (Fase 3).
- **FR-023**: Login de operador, pareamento, NF, relatório gerencial e estados offline-sync permanecem **fora** (Fase 4).
- **FR-024**: Impressão de produção/cozinha como ticket físico ou fila de KDS real está **fora**; observação de cozinha no item é suficiente nesta fase (envio “para cozinha” MAY ser feedback visual de fixture se útil, sem hardware).

### Key Entities

- **Mesa**: identificador, rótulo, estado (livre | ocupada | fechando), vínculo opcional a atendimento/conta.
- **Comanda**: número/cartão, status (aberta | fechada), itens, vínculo opcional a mesa/atendimento.
- **Atendimento**: sessão em curso no salão; liga mesa e/ou comanda; permite retomar/cancelar.
- **Item de venda food**: produto + adicionais + observação de cozinha + composição meia-a-meia (quando houver); valores em centavos.
- **Taxa de serviço**: percentual aplicado sobre base definida (linhas da conta); módulo de comportamento.
- **Couvert**: valor unitário × quantidade; módulo de comportamento.
- **Pedido delivery**: cliente, endereço, taxa de entrega, entregador, status (recebido | em preparo | despachado | … fixture), vínculo à venda/conta.
- **Conta / venda em curso**: herda turno, carrinho, pagamentos; pode originar-se de mesa, comanda, balcão ou delivery.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das ações Home `M`, `Q`, `A`, `D`, `W` (com módulos disponíveis e turno aberto) levam ao fluxo correspondente — zero “não implementado”.
- **SC-002**: Em perfil Restaurante, operador completa mesa → lançamento → pagamento → mesa liberada (ou fechando) em menos de 5 minutos em fixture guiada.
- **SC-003**: Em perfil com Comandas, 100% das entradas (Home e app bar do Balcão) abrem o mesmo fluxo de comandas.
- **SC-004**: Em largura típica de tablet (~800 px), Mesas e Comandas são utilizáveis em 100% dos percursos de teste sem overflow que impeça a ação principal.
- **SC-005**: Perfil Loja: 100% das ações e blocos food desta fase ausentes na Home, Balcão, totais e venda finalizada.
- **SC-006**: Em 100% dos casos de teste com adicionais / meia-a-meia / taxa / couvert, totais em centavos batem com o cálculo esperado (sem erro de ponto flutuante).
- **SC-007**: Após reinício com mesas/comandas/pedidos abertos e dados locais intactos, 100% dos casos de teste restauram as sessões coerentes com o pré-reinício.
- **SC-008**: Retorno pós-pagamento à origem (mesa ou fila de comandas/delivery) funciona em ≥ 90% dos percursos de teste definidos na fixture (sem perder o contexto da conta).
- **SC-009**: Taxa de serviço e couvert aparecem no detalhe da venda do turno em 100% das vendas de teste que os utilizaram.

---

## Assumptions

- Escopo é o app nativo Flutter em `apps/pdv/app` (não o PWA `apps/pdv/frontend`).
- Fases 0 e 1 entregues (ou em conjunto sem regressão): módulos/comportamentos food já têm ids; turno obrigatório para operacional; centavos; rotas; estados UI.
- Sem backend: mesas, comandas, atendimentos, delivery e enriquecimento de itens usam **fixture + persistência local**.
- **Breakpoints**: esta fase **reabre e entrega** os três formatos para telas novas + Balcão/Pagamento (decisão Fase 0).
- **Atendimento** = visão em fila das sessões abertas criadas por mesa e/ou comanda (não um terceiro modelo de conta paralelo sem vínculo).
- Divisão de conta na v1 da fase: pelo menos **partes iguais**; divisão item a item pode evoluir depois se a fixture permitir extensão.
- Meia-a-meia: preço pela regra da fixture (ex.: maior metade ou média); a UI deixa o total claro.
- Taxa de serviço padrão da fixture: 10%, editável no fluxo se a UI oferecer.
- Couvert: valor unitário da fixture × número de pessoas (ou lançamento único em valor).
- Ordem de totais sugerida: subtotal das linhas (com descontos por linha e adicionais) → couvert → taxa de serviço → ajuste genérico de venda (Fase 1); se a implementação fixar outra ordem, MUST ser única, testada e visível no painel.
- Delivery ligável também em perfil varejo: mesmos módulos; fixtures food priorizam Restaurante / Lanchonete com delivery.
- Impressão de cozinha/KDS real fora; observação no item dentro.
- Mobile **operacional** deixa de estar “adiado” para as telas desta fase e Balcão/Pagamento; celulares muito estreitos usam o formato compacto (pode ser experiência reduzida, mas utilizável).
- Atualização do `AGENTS.md` de `apps/pdv/app` na mesma entrega (docs-as-code), inclusive fim do adiamento de breakpoints para o escopo desta fase.

---

## Out of Scope

- Integração ERP / food-api / Keycloak / sync de mesas reais.
- TEF, impressora de cozinha, gaveta/balança físicas.
- KDS / fila de produção real (além de feedback fixture opcional).
- Código de barras, grade, peso, consulta de preço, Devolução, Crédito (Fase 3).
- Login operador, pareamento, NF, relatório gerencial, offline-sync global (Fase 4).
- Goldens por perfil e `integration_test/` completos (Fase 5) — testes unit/widget das novas telas entram na implementação desta fase.
- Painel dev de escrita de módulos (continua só em desenvolvimento, Fase 0).
- Senha de gerente / módulo bloqueado com challenge (Fase 4).
