# Feature Specification: PDV Núcleo Comum (Fase 1)

**Feature Branch**: `002-common-core-phase1`

**Created**: 2026-08-05

**Status**: Draft

**Input**: User description: "Fase 1 do PDV — núcleo comum às duas verticais: abertura/fechamento de caixa (turno), sangria/reforço, últimas vendas com detalhe, configurações do terminal com módulos em leitura, desconto/acréscimo na venda inteira, e vendedor a partir da Home (F9). Baseado no gap doc pdv-app-frontend-gap-2026-08-05.md seção Fase 1. Sem integração backend — UI sobre fixture local."

**Fonte de análise**: `.claude/docs/pdv-app-frontend-gap-2026-08-05.md` (Fase 1 itens 7–12; §4.1–4.2; §5.4; §6.1 desconto/acréscimo; §9 decisão 6)

**Escopo de produto**: app nativo de ponto de venda (`apps/pdv/app`), um único PDV modular para food e varejo. Entrega o mínimo para **operar um turno inteiro** em qualquer segmento ⬛.

**Pré-requisito**: Fase 0 (`001-foundation-phase0`) — catálogo de módulos (núcleo/opcional, estados, cache), dinheiro em centavos, rotas declarativas, estados loading/erro/vazio, telas existentes consultando o catálogo.

**Clarificações (2026-08-05)**:
- **Q1**: Abertura de caixa é **obrigatória para tudo operacional** (Balcão, Sangria, Últimas vendas). Home pode listar ações; ao entrar nelas (ou ao tentar vender) o fluxo exige abrir o caixa primeiro. Configurações e Vendedor permanecem acessíveis sem turno.
- **Q2 (clarify)**: Acesso a abrir/fechar via **hub Caixa** (entrada dedicada); interceptações sem turno levam a esse hub.
- **Q3 (clarify)**: Esperado em gaveta = fundo + reforços − sangrias + **dinheiro líquido das vendas** (recebido − troco); demais meios não movem a gaveta.
- **Q4 (clarify)**: Desconto e acréscimo de venda são **mutuamente exclusivos** (um substitui o outro).
- **Q5 (clarify)**: Fechamento de turno **bloqueado** se houver venda/carrinho em andamento.
- **Q6 (clarify)**: Turno aberto + movimentos/vendas do turno **persistem** localmente; reinício restaura.

## Clarifications

### Session 2026-08-05

- Q: Abertura de caixa é obrigatória antes de vender / usar a Home operacional? → A: **Obrigatória para tudo operacional** (Balcão, Sangria, Últimas vendas). Home pode listar; ao entrar nessas ações o fluxo exige abrir o caixa. Configurações e Vendedor liberados sem turno.
- Q: Como o operador acessa abertura e fechamento de caixa? → A: **Hub Caixa** (entrada dedicada na Home/moldura): status do turno, abrir e fechar; bloqueios sem turno levam ao mesmo hub; atalho para sangria no hub.
- Q: O que entra no “esperado em gaveta” do turno? → A: Só pagamentos em **dinheiro** (líquido: recebido − troco); cartão/PIX/outros meios não alteram o esperado.
- Q: Desconto e acréscimo na venda inteira podem coexistir? → A: **Mutuamente exclusivos** — no máximo um ajuste de total (desconto ou acréscimo); aplicar o outro substitui o anterior.
- Q: Pode fechar o caixa com venda em andamento? → A: **Bloquear** o fechamento enquanto houver venda/carrinho em curso; operador deve concluir ou cancelar/limpar antes.
- Q: O turno aberto sobrevive ao reinício do app nesta fase? → A: **Persistir** turno aberto + movimentos/vendas do turno no armazenamento local; reinício restaura o turno.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Abertura e fechamento de caixa (turno) (Priority: P1)

Como operador, uso o **hub Caixa** (entrada dedicada na Home/moldura) para ver o status do turno, abrir com fundo de troco e, ao fim, fechar com conferência (esperado × contado × diferença). **Sem turno aberto, operações de venda e de gaveta ficam bloqueadas** (Balcão, Sangria, Últimas vendas): ao tentar usá-las, o fluxo leva ao hub Caixa para abrir. Configurações e Vendedor permanecem acessíveis sem turno. O hub também oferece atalho para sangria/reforço quando o turno está aberto.

**Why this priority**: Pré-requisito de Sangria, Últimas vendas, Balcão e de qualquer operação de gaveta. Sem isso o PDV não opera um turno completo em nenhum segmento.

**Independent Test**: Sem turno, tentar Balcão/Sangria/Últimas vendas e cair no hub Caixa; abrir com fundo → lançar vendas/sangrias → fechar no hub com contagem; Configurações e Vendedor abrem sem turno; com turno aberto, atalho de sangria no hub funciona.

**Acceptance Scenarios**:

1. **Given** nenhum turno aberto, **When** o operador abre o hub Caixa e inicia abertura, **Then** informa fundo de troco (valor ≥ 0) e confirma; o turno passa a “aberto” e o terminal passa a registrar movimentos nesse turno.
2. **Given** um turno aberto, **When** o operador solicita fechamento no hub Caixa, **Then** vê resumo do turno (vendas, sangrias, reforços, esperado em gaveta) e informa a contagem física; o sistema registra diferença (sobra/falta) e encerra o turno.
3. **Given** nenhum turno aberto, **When** o operador tenta abrir Balcão, Sangria ou Últimas vendas (Home, atalho ou rota), **Then** a ação operacional é bloqueada e o fluxo leva ao hub Caixa (abertura).
4. **Given** nenhum turno aberto, **When** o operador abre Configurações ou Vendedor, **Then** essas ações funcionam normalmente (não exigem turno).
5. **Given** um turno já fechado (ou inexistente), **When** o operador tenta sangria ou listar vendas do turno atual, **Then** a ação é recusada e o fluxo orienta/abre o hub Caixa.
6. **Given** um turno aberto, **When** o operador tenta abrir outro turno, **Then** a abertura é recusada até fechar o atual.
7. **Given** a Home (ou moldura) com módulos de núcleo, **When** o operador procura abrir/fechar caixa, **Then** há entrada dedicada ao hub Caixa (não depende só da interceptação).
8. **Given** turno aberto com carrinho/venda em andamento no Balcão ou Pagamento, **When** o operador tenta fechar no hub Caixa, **Then** o fechamento é bloqueado com mensagem para concluir ou cancelar/limpar a venda antes.

---

### User Story 2 - Sangria e reforço de gaveta (Priority: P1)

Como operador, retiro dinheiro da gaveta (sangria) ou aporte (reforço) com motivo obrigatório e vejo um comprovante na tela (e opção de “imprimir” em fixture). A ação `S` da Home e o módulo correspondente passam a ter destino real.

**Why this priority**: Movimento de caixa do dia a dia; depende do turno aberto; hoje cai em “não implementado”.

**Independent Test**: Com turno aberto, executar sangria e reforço com motivo; conferir que o resumo do turno e o esperado em gaveta refletem os movimentos; sem turno, a entrada bloqueia.

**Acceptance Scenarios**:

1. **Given** turno aberto, **When** o operador registra sangria com valor > 0 e motivo, **Then** o movimento é gravado no turno, o comprovante é exibido e o esperado em gaveta diminui.
2. **Given** turno aberto, **When** o operador registra reforço com valor > 0 e motivo, **Then** o movimento é gravado, o comprovante é exibido e o esperado em gaveta aumenta.
3. **Given** valor zero ou motivo vazio, **When** tenta confirmar, **Then** a validação impede o envio com mensagem clara.
4. **Given** módulo Sangria disponível, **When** o operador usa o atalho `S` ou o bloco da Home, **Then** chega à tela de sangria/reforço (não ao feedback de “não implementado”).

---

### User Story 3 - Últimas vendas do turno (Priority: P1)

Como operador, consulto o histórico de vendas do turno atual, abro o detalhe de uma venda e posso solicitar reimpressão do comprovante (fixture). Cancelamento de venda aparece no fluxo com confirmação explícita.

**Why this priority**: Necessário para auditoria do turno, reimpressão e suporte no caixa; ação `U` hoje sem destino.

**Independent Test**: Com vendas de fixture no turno, listar → abrir detalhe → reimprimir; cancelar uma venda com confirmação e ver status refletido na lista.

**Acceptance Scenarios**:

1. **Given** turno aberto com vendas, **When** o operador abre Últimas vendas (`U`), **Then** vê a lista do turno (mais recentes primeiro) com totais e status.
2. **Given** uma venda na lista, **When** abre o detalhe, **Then** vê itens, pagamentos, vendedor (se houver), observação e totais em centavos formatados.
3. **Given** o detalhe de uma venda não cancelada, **When** solicita reimpressão, **Then** o fluxo de comprovante/fixture é acionado (sem impressora real nesta fase).
4. **Given** uma venda cancelável com parcela em dinheiro, **When** confirma o cancelamento, **Then** a venda passa a cancelada, deixa de contar como venda válida no resumo do turno e o esperado em gaveta diminui pelo dinheiro líquido daquela venda (meios não-dinheiro não afetam a gaveta).
5. **Given** módulo Últimas vendas disponível, **When** usa Home/`U`, **Then** não cai em “não implementado”.

---

### User Story 4 - Configurações do terminal com módulos em leitura (Priority: P1)

Como operador ou suporte, abro Configurações (`Ç`) a partir da Home, do Balcão ou do Pagamento e vejo (1) preferências do terminal (impressora, gaveta, balança — valores de fixture editáveis localmente onde fizer sentido) e (2) a lista de módulos da loja/terminal **somente em leitura**, com indicação de que a composição é configurada no ERP — respondendo “por que o Comandas não aparece neste caixa?” sem oferecer um switch que contradiga o ERP.

**Why this priority**: Três entradas mortas hoje; e é o oposto do painel dev (escrita some no release). Suporte precisa de resposta na tela.

**Independent Test**: Entrar por cada um dos três pontos; ver módulos em leitura com estados distinguíveis (disponível / desligado / bloqueado / não contratado quando a fixture distinguir); confirmar ausência de controle que reescreva o conjunto de módulos.

**Acceptance Scenarios**:

1. **Given** qualquer um dos três pontos de entrada (Home `Ç`, Balcão, Pagamento), **When** o operador abre Configurações, **Then** chega à mesma tela de configurações do terminal.
2. **Given** a seção de módulos, **When** o operador visualiza a lista, **Then** cada módulo mostra estado em modo leitura e texto orientando que a alteração é no ERP — sem toggle de escrita de produto.
3. **Given** um módulo desligado ou não contratado (ex.: Comandas em perfil Loja), **When** o suporte consulta Configurações, **Then** consegue explicar a ausência na Home pelo estado exibido.
4. **Given** build de produção, **When** o operador está em Configurações, **Then** o painel de desenvolvimento que reescreve módulos continua ausente (Fase 0); Configurações não o substitui.

---

### User Story 5 - Desconto e acréscimo na venda inteira (Priority: P1)

Como operador no Balcão, aplico **desconto ou acréscimo** sobre o total da venda (percentual ou valor), além do desconto por linha já existente — **não os dois ao mesmo tempo** no ajuste de venda (um substitui o outro). O painel de totais deixa de tratar “Desconto” só como percentual derivado não editável.

**Why this priority**: Operação diária em food e varejo (promoção no total, taxa/acréscimo genérico); sem isso o Balcão não cobre cenários reais mesmo no núcleo.

**Independent Test**: Lançar itens → aplicar 10% de desconto no total e ver total recalculado; trocar por acréscimo em valor (desconto some); limpar ajuste; combinar ajuste de venda com desconto por linha sem inconsistência de totais.

**Acceptance Scenarios**:

1. **Given** um carrinho com itens, **When** o operador aplica desconto percentual ou em valor na venda, **Then** o total a pagar reflete o ajuste e a UI deixa claro o desconto da venda (separado do desconto por linha, se ambos existirem).
2. **Given** um carrinho com itens, **When** aplica acréscimo percentual ou em valor, **Then** o total aumenta de forma coerente e auditável no painel de totais.
3. **Given** um desconto de venda já aplicado, **When** o operador aplica um acréscimo de venda (ou o inverso), **Then** o ajuste anterior é substituído — não há desconto e acréscimo de venda simultâneos.
4. **Given** um ajuste de venda aplicado, **When** remove o ajuste ou zera o carrinho, **Then** os totais voltam ao estado sem ajuste de venda.
5. **Given** desconto por linha e um ajuste de venda (desconto ou acréscimo), **When** calcula o total, **Then** a ordem é: totais das linhas (já com desconto por linha) → depois o único ajuste de venda; o valor final em centavos é o exibido.

---

### User Story 6 - Vendedor a partir da Home (Priority: P2)

Como operador, a ação Vendedor (`F9`) na Home abre o seletor de vendedor **já existente** (hoje só alcançável pela app bar do Pagamento), sem construir uma tela nova.

**Why this priority**: Item mais barato da lista do gap; fecha um buraco do catálogo com religação.

**Independent Test**: Na Home com módulo Vendedor disponível, `F9` ou o bloco abre o seletor; escolher vendedor persiste no contexto da sessão de venda como já ocorre pelo Pagamento.

**Acceptance Scenarios**:

1. **Given** módulo Vendedor disponível, **When** o operador aciona Vendedor na Home (`F9` ou bloco), **Then** o seletor existente abre (não “não implementado”).
2. **Given** um vendedor selecionado pela Home, **When** segue para Balcão/Pagamento, **Then** o vendedor permanece associado à venda em curso (mesmo comportamento do fluxo pelo Pagamento).
3. **Given** módulo Vendedor indisponível, **When** está na Home, **Then** a ação não aparece e o atalho não responde.

---

### Edge Cases

- Abertura com fundo zero: permitida (loja que não usa troco).
- Sangria maior que o esperado em gaveta: permitida após confirmação explícita com aviso (operador pode precisar corrigir inconsistência); o esperado pode ficar negativo até o fechamento.
- Fechamento com diferença: sempre permitido após confirmação explícita da diferença (sobra/falta registradas).
- Últimas vendas com turno sem vendas: estado vazio padronizado (Fase 0).
- Cancelar venda já cancelada: ação indisponível.
- Configurações com catálogo só de núcleo (perfil mínimo): lista ainda mostra todos os módulos relevantes da fixture com estados corretos — inclusive opcionais ausentes.
- Desconto de venda que zera ou torna o total negativo: validação impede total < 0.
- Tentativa de ter desconto e acréscimo de venda ao mesmo tempo: impossível — o segundo substitui o primeiro.
- Acréscimo/desconto com carrinho vazio: ação indisponível ou sem efeito com mensagem.
- Dois pontos de entrada de Configurações em sequência: mesma tela, sem pilha duplicada confusa.
- Turno aberto e app reiniciado: **restaura** o turno aberto com movimentos e vendas do turno (persistência local, Q6).
- Sem turno: Home visível; Balcão/Sangria/Últimas vendas levam ao hub Caixa; Configurações e Vendedor liberados.
- Hub Caixa com turno aberto: mostra status e ações de fechar + atalho sangria; ação “abrir” indisponível.
- Fechar com venda em curso: bloqueado (Q5); não descarta carrinho automaticamente.
- Primeiro start sem dados locais: nenhum turno aberto; operador usa o hub Caixa para abrir.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST oferecer um **hub Caixa** (entrada dedicada na Home e/ou moldura, módulo de núcleo) onde o operador vê o status do turno, **abre** com fundo de troco (valor em centavos, ≥ 0) e **fecha** com conferência. Bloqueios sem turno (Balcão, Sangria, Últimas vendas) MUST levar a esse mesmo hub.
- **FR-002**: O sistema MUST permitir **fechar o turno** a partir do hub Caixa com resumo (vendas válidas, sangrias, reforços, esperado em gaveta), contagem informada pelo operador e registro da diferença.
- **FR-003**: MUST existir no máximo **um turno aberto** por terminal (fixture) por vez.
- **FR-004**: Sangria e reforço MUST exigir turno aberto, valor > 0, motivo não vazio, e MUST gerar comprovante visual (impressão real fora de escopo). O hub Caixa MUST oferecer atalho para sangria/reforço quando o turno estiver aberto (além da ação Home `S`).
- **FR-005**: Sangria/reforço MUST atualizar o esperado em gaveta do turno e aparecer no fechamento.
- **FR-023**: O **esperado em gaveta** MUST ser: fundo de troco + reforços − sangrias + somatório do **dinheiro líquido** das vendas válidas do turno (dinheiro recebido − troco). Cartão, PIX e demais meios MUST **não** alterar o esperado. Cancelamento de venda MUST estornar só a parcela em dinheiro líquido que aquela venda havia adicionado.
- **FR-006**: A ação Home **Sangria** (`S`) e quaisquer atalhos/app bars ligados ao mesmo id de módulo MUST navegar para o fluxo de sangria/reforço quando o módulo estiver disponível.
- **FR-007**: **Últimas vendas** MUST listar as vendas do turno atual (paginação/busca no modelo de dados da fixture — não carregar “o mundo” sem critério); MUST oferecer detalhe por venda.
- **FR-008**: No detalhe da venda, o operador MUST poder solicitar **reimpressão** do comprovante (fixture) e, quando a venda for cancelável, **cancelar** com confirmação explícita.
- **FR-009**: A ação Home **Últimas vendas** (`U`) MUST ter destino real quando o módulo estiver disponível.
- **FR-010**: **Configurações do terminal** MUST ser alcançáveis pela Home (`Ç`), pela app bar/toolbar do Balcão e pela do Pagamento (eliminar os três “não implementado”).
- **FR-011**: Configurações MUST incluir seção de **módulos em modo somente leitura** (estados do catálogo Fase 0), com indicação de que a composição é definida no ERP — sem escrita de produto do conjunto de módulos.
- **FR-012**: Configurações MUST permitir visualizar (e, onde fizer sentido em fixture, ajustar localmente) preferências de terminal: identificação do terminal, impressora, gaveta, balança — sem exigir hardware real.
- **FR-013**: O Balcão MUST permitir **desconto ou acréscimo na venda inteira** (percentual ou valor), em centavos, com totais coerentes com descontos por linha. Desconto e acréscimo de venda MUST ser **mutuamente exclusivos**: no máximo um ajuste de total ativo; aplicar o outro tipo MUST substituir o anterior. Descontos por linha continuam independentes desse ajuste.
- **FR-014**: A ação Home **Vendedor** (`F9`) MUST abrir o seletor de vendedor já existente quando o módulo estiver disponível.
- **FR-015**: Todas as novas telas/ações MUST consultar o catálogo de módulos (mesma regra da Fase 0); nenhuma saída fixa para módulos opcionais.
- **FR-016**: Valores monetários MUST permanecer em **centavos inteiros** (herança Fase 0) em turno, sangria, vendas e ajustes de total.
- **FR-017**: Navegação das novas telas MUST usar as **rotas declarativas** introduzidas na Fase 0.
- **FR-018**: Estados de lista vazia, carregamento e erro nas novas telas MUST usar os componentes padronizados da Fase 0.
- **FR-019**: Abertura de caixa MUST ser **obrigatória para tudo operacional**: sem turno aberto, Balcão, Sangria/reforço e Últimas vendas MUST ser bloqueados em todos os pontos de entrada (Home, atalho, rota), com fluxo para o **hub Caixa**. Configurações do terminal e Vendedor MUST permanecer acessíveis sem turno. A Home MAY listar as ações; o bloqueio ocorre ao tentar usá-las.
- **FR-020**: Nenhuma integração de backend, TEF, impressão física, Keycloak, pareamento de terminal ou login de operador entra nesta fase (login/pareamento = Fase 4).
- **FR-021**: Telas de segmento (Mesas, Comandas, Delivery, código de barras funcional, etc.) permanecem fora de escopo (Fases 2–3).
- **FR-022**: O hub Caixa MUST ser módulo de **núcleo** (sempre disponível na configuração válida); não se confunde com Configurações do terminal.
- **FR-024**: O fechamento de turno MUST ser **recusado** enquanto existir venda em andamento (carrinho com itens e/ou fluxo de pagamento iniciado e não finalizado). A UI MUST informar que é preciso concluir, cancelar a venda ou limpar o carrinho antes de fechar.
- **FR-025**: O turno aberto e seus movimentos de gaveta e vendas do turno MUST ser **persistidos localmente** no terminal. Após reinício do app (com dados locais intactos), o operador MUST retomar o mesmo turno aberto com o esperado em gaveta e o histórico coerentes. Sem backend nesta fase — a fonte é armazenamento local + fixture inicial.

### Key Entities

- **Turno (CashShift)**: abertura, fundo de troco, status (aberto/fechado), esperado em gaveta (regra Q3: só dinheiro líquido + movimentos de gaveta), contagem no fechamento, diferença, movimentos associados.
- **Hub Caixa**: ponto de entrada de UI para status/abrir/fechar turno e atalho de sangria; distinto de Configurações.
- **Movimento de gaveta**: tipo (sangria | reforço), valor em centavos, motivo, horário, vínculo ao turno, comprovante.
- **Venda (do turno)**: referência à venda concluída no PDV; itens; pagamentos; vendedor; status (concluída | cancelada); totais.
- **Ajuste de venda**: no máximo um por venda em curso — desconto **ou** acréscimo (tipo percentual ou valor; valor em centavos equivalente); mutuamente exclusivo.
- **Configuração do terminal**: preferências locais (impressora, gaveta, balança, identificação) + visão somente leitura do conjunto de módulos.
- **Vendedor**: já existente; seleção associável à venda a partir da Home ou do Pagamento.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Operador completa o ciclo abrir turno → (venda e/ou sangria) → fechar turno em menos de 5 minutos em fixture guiada, sem encontrar “não implementado” nesses passos.
- **SC-002**: 100% das entradas Home `S`, `U`, `Ç`, `F9` (com módulos disponíveis) levam ao fluxo correspondente — zero feedback de não implementado nessas quatro ações.
- **SC-003**: 100% dos três pontos de entrada de Configurações (Home, Balcão, Pagamento) abrem a mesma capacidade de configurações.
- **SC-004**: Em 100% dos fechamentos de teste com movimentos conhecidos, o esperado em gaveta = fundo + reforços − sangrias + dinheiro líquido das vendas válidas (recebido − troco); vendas só em cartão/PIX não alteram o esperado.
- **SC-005**: Desconto/acréscimo de venda: em 100% dos casos de teste com valores “quebrados”, o total final em centavos coincide com o cálculo esperado (sem erro de ponto flutuante).
- **SC-006**: Suporte consegue, só olhando Configurações → módulos, explicar a ausência de um módulo opcional desligado em ≥ 1 perfil de fixture (ex.: Comandas em “Loja”).
- **SC-007**: Nenhuma tela nova desta fase exibe ação de módulo indisponível; perfis Loja vs Restaurante continuam coerentes na Home e nas saídas existentes.
- **SC-008**: Sem turno aberto, 100% das tentativas de Balcão, Sangria e Últimas vendas levam ao hub Caixa; Configurações e Vendedor abrem em 100% dos testes sem turno.
- **SC-009**: Em 100% dos percursos de teste, abrir e fechar turno são alcançáveis pelo hub Caixa sem depender apenas de interceptação.
- **SC-010**: Em 100% dos testes com venda/carrinho em andamento, a tentativa de fechar o turno é recusada até a venda ser concluída ou cancelada/limpa.
- **SC-011**: Após reinício com turno previamente aberto e dados locais intactos, 100% dos casos de teste restauram o mesmo turno (status aberto, esperado e histórico coerentes com o pré-reinício).

---

## Assumptions

- Escopo é o app nativo Flutter em `apps/pdv/app` (não o PWA `apps/pdv/frontend`).
- Fase 0 entregue (ou desenvolvida em conjunto sem regressão): módulos, centavos, rotas, estados UI, §5.8.
- Sem backend: turno, movimentos e vendas usam **persistência local** do terminal (Q6); “imprimir” é simulado; fixture serve dados iniciais / demos, não substitui o contrato de restauração após reinício.
- Login de operador e pareamento de terminal **não** existem ainda (Fase 4); o “operador” desta fase é o usuário da sessão de fixture / `TerminalSession` quando houver. Quando o login existir, a abertura de caixa passa a ser a primeira tela operacional depois do login (mesma regra Q1).
- **Q1 (A)**: turno aberto é pré-requisito de Balcão, Sangria e Últimas vendas; Configurações e Vendedor não exigem turno.
- **Q2**: hub Caixa é a entrada canônica para status/abrir/fechar; interceptações sem turno levam ao hub.
- **Q3**: esperado em gaveta movido apenas por dinheiro (líquido); outros meios não entram.
- **Q4**: desconto e acréscimo de venda mutuamente exclusivos.
- **Q5**: fechamento bloqueado com venda/carrinho em andamento.
- **Q6**: turno + movimentos + vendas do turno persistem localmente e sobrevivem ao reinício.
- Cancelamento de venda nesta fase **não** exige senha de gerente (Fase 4); usa confirmação explícita. Efeito em gaveta: estorna só o **dinheiro líquido** que a venda havia somado ao esperado (Q3).
- Reimpressão não usa impressora física.
- Preferências de impressora/gaveta/balança são metadados de UI + fixture; não acionam drivers.
- Desconto/acréscimo de venda: ambos os modos (percentual e valor) na mesma entrega, **mutuamente exclusivos** entre si (Q4); taxa de serviço/couvert como **módulo de comportamento** food permanece Fase 2 — aqui é só ajuste genérico de total.
- Sangria acima do esperado em gaveta: permitida com confirmação (não bloqueio rígido).
- Vendedor: reutiliza `SellerPickerDialog` / fluxo já existente; não redesenha o seletor.
- Mobile/tablet operacional continua adiado (decisão Fase 0); novas telas desta fase priorizam o formato expandido/caixa.
- Atualização do `AGENTS.md` de `apps/pdv/app` na mesma entrega da implementação (docs-as-code).

---

## Out of Scope

- Login/identificação de operador, bloqueio de tela, pareamento de terminal (Fase 4).
- Senha de gerente / challenge para módulo bloqueado ou cancelamento privilegiado (Fase 4).
- Mesas, Comandas, Atendimentos, Delivery, blocos food do Balcão (Fase 2).
- Código de barras funcional, grade, balança, consulta de preço, Devolução, Crédito de clientes (Fase 3) — Devolução/Crédito são ⬛ mas ficam na Fase 3 conforme sequência do gap.
- Gerar nota / NF por e-mail / relatório gerencial / estados offline-sync (Fase 4).
- Integração ERP, Keycloak, TEF, impressão real, sync.
- Painel de módulos com escrita de produto (continua só em desenvolvimento, Fase 0).
- Goldens por perfil e `integration_test/` completos (Fase 5).
- Layouts compacto/médio (adiado; reabre na Fase 2).
