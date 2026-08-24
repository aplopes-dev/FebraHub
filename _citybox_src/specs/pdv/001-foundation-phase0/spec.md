# Feature Specification: PDV Fundação (Fase 0)

**Feature Branch**: `001-foundation-phase0`

**Created**: 2026-08-05

**Status**: Draft

**Input**: User description: "Fase 0 — Fundação (antes de qualquer tela nova): estender módulos ao nível de comportamento; marcar núcleo × opcional; estados disponível / desligado / bloqueado; fonte do build injetável com cache local e perfis nomeados; painel dev fora do release; migrar dinheiro para centavos; introduzir navegação por rotas e portar as 5 telas; definir estratégia responsiva (breakpoints em Balcão e Pagamento ou adiamento escrito do mobile); padronizar estados loading / erro / vazio; consertar telas que ignoram módulos. Sem backend. Refatoração de base."

**Fonte de análise**: `.claude/docs/pdv-app-frontend-gap-2026-08-05.md` (Fase 0, §5, §7.1–7.4, §5.8)

**Escopo de produto**: app nativo de ponto de venda (`apps/pdv/app`), um único PDV modular para food e varejo.

**Clarificações (2026-08-05)**:
- **Q1**: Módulo **bloqueado** some da UI nesta fase (igual a desligado); pedido de senha de gerente fica para Fase 4.
- **Q2**: Mobile/tablet operacional **adiado**; decisão registrada por escrito (esta spec + `AGENTS.md` na implementação). Breakpoints em Balcão/Pagamento não entram na Fase 0.

## Clarifications

### Session 2026-08-05

- Q: Quais módulos são **núcleo** (não podem ficar indisponíveis por configuração)? → A: Todos os módulos ⬛ comuns às duas verticais (Balcão, Cliente, Sangria/reforço, Últimas vendas, Devolução, Crédito dos clientes, Configurações, Vendedor, e demais ids ⬛ do catálogo quando existirem); opcionais = food/varejo (Mesas, Comandas, Atendimentos, Delivery, Pedidos delivery) e comportamentos de segmento.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Catálogo de módulos com vocabulário completo (Priority: P1)

Como operador (e como desenvolvedor em fixture), o PDV passa a tratar módulos com três estados distintos — **disponível**, **desligado** e **bloqueado** — e com ids tanto de **telas** quanto de **comportamentos dentro do Balcão** (código de barras, balança, grade de variação, adicional, observação de cozinha, meia-pizza, impressão de produção, taxa de serviço, couvert). Módulos de **núcleo** são **todos os ⬛ comuns às duas verticais** (Balcão, Cliente, Sangria/reforço, Últimas vendas, Devolução, Crédito dos clientes, Configurações, Vendedor — e outros ids ⬛ quando entrarem no catálogo); não podem ficar indisponíveis por configuração inválida. Módulos **opcionais** são os de segmento (🍽/🏬: Mesas, Comandas, Atendimentos, Delivery, Pedidos delivery e comportamentos de Balcão por vertical).

Nesta fase, **bloqueado** e **desligado** produzem o mesmo resultado na interface operacional: o módulo **não aparece**. A distinção permanece no modelo de dados para a Fase 4 (autorização de gerente) e para Configurações em modo leitura (Fase 1).

**Why this priority**: Sem esse vocabulário, cada tela nova inventa o próprio `if`, e as Fases 2/3 (blocos food/varejo) não têm fonte única.

**Independent Test**: Aplicar um perfil de segmento (ex.: Loja) e verificar que só módulos disponíveis aparecem; marcar um módulo como bloqueado e confirmar que some como o desligado; tentar desligar um módulo de núcleo e ver a configuração rejeitada ou corrigida.

**Acceptance Scenarios**:

1. **Given** um perfil "Loja" (sem Mesas/Comandas), **When** o operador abre a tela inicial, **Then** Mesas, Comandas e Atendimentos não aparecem e seus atalhos não respondem.
2. **Given** um módulo marcado como núcleo (⬛), **When** a fonte de configuração tenta deixá-lo indisponível, **Then** a configuração é rejeitada ou corrigida — nenhum módulo ⬛ fica ausente por config inválida.
3. **Given** um comportamento de segmento (ex.: código de barras) desligado, **When** o operador está no Balcão, **Then** o bloco correspondente não é oferecido — a mesma consulta de catálogo usada pela Home.
4. **Given** um módulo no estado **bloqueado**, **When** o operador usa a Home, Balcão ou Pagamento, **Then** o módulo não aparece (mesmo tratamento visual de desligado); nenhum fluxo de senha de gerente é exigido nesta fase.

---

### User Story 2 - Origem injetável, cache offline e painel só em desenvolvimento (Priority: P1)

Como operador offline, o PDV abre com o **último conjunto de módulos conhecido** no terminal. Como desenvolvedor, consigo trocar a fonte do conjunto (fixture/perfis nomeados) sem alterar quem consome a visibilidade. O painel que **escreve** módulos **não existe** no build de produção.

**Why this priority**: Na operação real o ERP manda o conjunto; o painel atual é ferramenta de dev. Sem fonte injetável + cache, a integração futura e o offline quebram o modelo.

**Independent Test**: Subir o app sem rede com um cache prévio e ver os módulos corretos; em release, confirmar que o painel de escrita não está acessível; em debug, aplicar um perfil nomeado e ver Home/Balcão/Pagamento refletirem o mesmo conjunto.

**Acceptance Scenarios**:

1. **Given** um conjunto de módulos já cacheado no terminal, **When** o app inicia sem rede, **Then** a UI usa esse conjunto (não sobe “tudo ligado” nem “tudo vazio” por falta de fonte).
2. **Given** build de produção/release, **When** o operador usa a barra de título / moldura, **Then** não há controle que reconfigure o PDV inteiro (painel de escrita ausente).
3. **Given** build de desenvolvimento, **When** o desenvolvedor escolhe um perfil nomeado (Restaurante, Lanchonete com delivery, Loja, Mercado), **Then** todos os pontos que consultam o catálogo refletem o perfil de uma vez.
4. **Given** a origem do conjunto muda (fixture → futura fonte remota), **When** quem consome pergunta “está disponível?”, **Then** a API de consulta permanece a mesma (só a origem muda).

---

### User Story 3 - Dinheiro só em centavos (Priority: P1)

Como operador, ao lançar produtos e receber pagamentos, valores e totais **nunca** sofrem erro de ponto flutuante: uma venda que fecha em valor exato sempre finaliza.

**Why this priority**: A regra de produto já exige centavos; o código atual usa ponto flutuante e o fechamento pode falhar por arredondamento. Migrar agora evita divergência de caixa quando o número de telas crescer.

**Independent Test**: Fechar uma venda cujo recebido iguala o total; somar linhas com preços “quebrados” (ex.: 2,50 + 5,50) e conferir totais estáveis e iguais ao esperado em reais.

**Acceptance Scenarios**:

1. **Given** uma venda cujo total e o recebido são iguais em reais, **When** o operador finaliza, **Then** a venda fecha (sem rejeição por diferença fantasma).
2. **Given** preços e descontos da fixture convertidos, **When** o operador vê subtotal, desconto, total, recebido, a receber e troco, **Then** todos os valores monetários exibidos batem com a aritmética em centavos (formato apenas na apresentação).
3. **Given** o domínio de carrinho e de pagamento, **When** se inspeciona o modelo de dados, **Then** não resta valor monetário em fração decimal no domínio dessas telas.

---

### User Story 4 - Navegação por rotas nas cinco telas existentes (Priority: P2)

Como operador, percorre Início → Balcão → Pagamento → Venda finalizada → (volta) e Cliente sem regressão de fluxo; a pilha e o título da janela permanecem coerentes. Como base para Mesas/Comandas futuras, a navegação deixa de ser apenas “empurrar tela”.

**Why this priority**: Já existem cinco telas; a dívida de navegação está vencida e bloqueia fluxos com retorno a origem (mesa → balcão → pagamento).

**Independent Test**: Executar o fluxo completo de venda e o de cadastro de cliente só com as rotas novas; voltar da venda finalizada para o Início sem reabrir a venda anterior.

**Acceptance Scenarios**:

1. **Given** as cinco telas atuais (Início, Balcão, Pagamento, Venda finalizada, Cadastro de cliente), **When** o operador navega pelos caminhos já existentes, **Then** cada destino é alcançado por rota nomeada e o título da janela continua correto.
2. **Given** a venda finalizada, **When** o operador escolhe voltar ao Início ou ao Balcão, **Then** o comportamento atual (venda não volta na pilha; carrinho/pagamento limpos) é preservado.
3. **Given** um deep-link ou restauração futura, **When** as rotas estão declaradas, **Then** as cinco telas têm identificadores estáveis (pronto para fases seguintes — sem exigir deep-link nesta fase).

---

### User Story 5 - Estratégia responsiva: mobile adiado e documentado (Priority: P2)

Como produto, a Fase 0 **fecha** a decisão: layouts operacionais de Balcão e Pagamento **não** recebem os três formatos nesta entrega. O adiamento do mobile/tablet operacional fica **registrado por escrito** (esta spec e o `AGENTS.md` do app na implementação), com impacto explícito: Mesas/Comandas (Fase 2) **reabrem** a dívida de breakpoints antes ou junto da construção dessas telas.

**Why this priority**: Evita ambiguidade e retrabalho silencioso; Mesas/Comandas são telas de tablet por natureza.

**Independent Test**: Existe registro escrito na feature e, na entrega de código, no `AGENTS.md` do app, citando a decisão B (adiar) e a obrigação de reabrir na Fase 2.

**Acceptance Scenarios**:

1. **Given** a Fase 0 considerada pronta, **When** se consulta a documentação da feature e do módulo, **Then** está explícito que compacto/médio operacional em Balcão e Pagamento foi adiado.
2. **Given** alguém inicia a Fase 2 (Mesas/Comandas), **When** lê o registro, **Then** sabe que a estratégia responsiva (três formatos) é pré-requisito ou trabalho paralelo obrigatório — não herança “já resolvida” pela Fase 0.
3. **Given** o desktop/caixa expandido atual, **When** o operador usa Balcão e Pagamento, **Then** o comportamento de layout existente permanece aceitável no formato expandido (sem regressão exigida para tablet/celular nesta fase).

---

### User Story 6 - Estados de carregamento, erro e vazio padronizados (Priority: P2)

Como operador, ao encontrar lista vazia, falha ou espera, vê o **mesmo vocabulário visual** em todo o app (não um empty state ad hoc por tela).

**Why this priority**: Hoje quase tudo é fixture síncrona; telas novas vão precisar desses estados. Padronizar antes evita três designs diferentes.

**Independent Test**: Em uma tela de demonstração ou fixture forçada, exibir loading, erro e vazio usando os componentes compartilhados e verificar consistência visual/comportamental.

**Acceptance Scenarios**:

1. **Given** uma lista sem itens (já existente: carrinho vazio), **When** o estado vazio é mostrado, **Then** usa o componente compartilhado de vazio (ou o legado foi alinhado a ele).
2. **Given** um estado de carregamento forçado em fixture, **When** a tela espera, **Then** o indicador/padrão visual é o compartilhado.
3. **Given** um erro forçado em fixture, **When** a tela falha, **Then** o operador vê mensagem acionável (tentar de novo ou orientação) via padrão compartilhado — sem stack técnica.

---

### User Story 7 - Telas existentes consultam o catálogo de módulos (Priority: P1)

Como loja de roupa, na venda finalizada **não** vejo saídas de Delivery nem Atendimentos. No Pagamento, Vendedor (e demais ações ligadas a módulo) só aparecem se o módulo correspondente estiver disponível.

**Why this priority**: Duas telas já violam a regra “toda tela pergunta ao catálogo”; o defeito se multiplica em cada tela nova.

**Independent Test**: Perfil Loja → abrir Pagamento e Venda finalizada e confirmar ausência das saídas/ações de módulos desligados; perfil Restaurante → as mesmas saídas aparecem quando disponíveis.

**Acceptance Scenarios**:

1. **Given** Delivery e Atendimentos desligados, **When** a venda é finalizada, **Then** esses botões de saída não aparecem.
2. **Given** o módulo Vendedor desligado, **When** o operador está no Pagamento, **Then** a ação de vendedor não aparece (observação da venda segue a regra do catálogo se houver id; senão permanece como hoje até ganhar id).
3. **Given** qualquer ação ligada a id de módulo nessas duas telas, **When** o módulo muda de estado, **Then** a UI reflete na mesma consulta usada pela Home.

---

### Edge Cases

- Cache local ausente no primeiro start: o app usa fixture/perfil padrão de desenvolvimento, nunca um conjunto vazio que esconde o Balcão.
- Configuração remota futura inconsistente (núcleo ausente): validação de entrada rejeita ou completa com núcleo obrigatório.
- Módulo **bloqueado** vs **desligado**: ambos ausentes na UI operacional nesta fase; o estado distinto no modelo prepara Fase 4 (challenge) e Fase 1 (Configurações em leitura).
- Módulo **não contratado**: ausente na UI (como desligado); reversibilidade só no ERP.
- Release com flag de painel: painel de escrita inacessível mesmo que alguém conheça o atalho antigo.
- Conversão de valores: preços exibidos em reais continuam formatados para o operador; a aritmética interna é só em centavos.
- Janela/dispositivo estreito: fora de escopo operacional nesta fase; mínimo de janela desktop atual permanece até a Fase 2 reabrir breakpoints.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O catálogo de módulos MUST incluir ids de **comportamento** além das ações de tela (no mínimo: código de barras, balança/peso, grade/variação, adicional/opcional, observação de cozinha, meia-pizza, impressão de produção, taxa de serviço, couvert).
- **FR-002**: Cada entrada do catálogo MUST ser marcada como **núcleo** ou **opcional**. **Núcleo** = todos os módulos ⬛ comuns às duas verticais (no mínimo: Balcão, Cliente, Sangria/reforço, Últimas vendas, Devolução, Crédito dos clientes, Configurações, Vendedor). **Opcional** = módulos e comportamentos de segmento (🍽/🏬). Módulos de núcleo MUST permanecer utilizáveis (validação de entrada rejeita configuração que os torne indisponíveis; o terminal não pode operar sem o conjunto núcleo).
- **FR-003**: O estado de um módulo MUST ser um de: **disponível**, **desligado**, **bloqueado** (substitui o modelo binário visível/escondido).
- **FR-004**: Na UI operacional desta fase, **desligado** e **bloqueado** MUST ambos resultar em ausência do módulo (sem challenge de gerente). O modelo MUST preservar o estado `bloqueado` distinto para uso nas Fases 1 e 4.
- **FR-005**: A origem do conjunto de módulos MUST ser **injetável** (fixture hoje; fonte remota depois) sem alterar os consumidores da consulta de disponibilidade.
- **FR-006**: O último conjunto conhecido MUST ser **cacheado localmente** no terminal para abertura offline.
- **FR-007**: MUST existir **perfis nomeados** de fixture (padrão proposto: Restaurante, Lanchonete com delivery, Loja, Mercado) que preenchem o conjunto de uma vez para desenvolvimento e testes.
- **FR-008**: O painel que **altera** módulos MUST estar **ausente** do build de produção/release; em desenvolvimento permanece como ferramenta.
- **FR-009**: Todos os valores monetários de domínio nas telas atuais (carrinho, totais, pagamento, fixtures) MUST usar **centavos inteiros**; formatação em reais só na apresentação.
- **FR-010**: As cinco telas existentes MUST ser alcançáveis por **navegação declarativa por rotas**, preservando o fluxo de venda e o cadastro de cliente.
- **FR-011**: A Fase 0 MUST **registrar por escrito** o adiamento do mobile/tablet operacional ( Balcão/Pagamento nos formatos compacto/médio ). A aplicação dos três breakpoints oficiais do PDV fica obrigatória ao abrir Mesas/Comandas (Fase 2) ou em fase dedicada anterior — não nesta entrega.
- **FR-012**: MUST existir componentes compartilhados de UI para estados de **carregamento**, **erro** e **vazio**, reutilizáveis pelas features.
- **FR-013**: A tela de venda finalizada e a app bar de Pagamento MUST consultar o catálogo de módulos para cada saída/ação ligada a módulo (corrigir §5.8 do gap).
- **FR-014**: Nenhuma tela nova de produto (Mesas, Sangria, Caixa, etc.) entra no escopo desta fase.
- **FR-015**: Nenhuma integração de backend, autenticação, TEF, impressão real ou sync entra no escopo desta fase.
- **FR-016**: A regra “um ponto de consulta para visibilidade de módulo” MUST permanecer: desligar (ou bloquear) um módulo o esconde em Home, atalhos e app bars que consultam o mesmo id.
- **FR-017**: A consulta de “visível na operação” MUST tratar `desligado` e `bloqueado` como não visíveis nesta fase (helper único, para não espalhar a regra).

### Key Entities

- **Módulo (PdvModule)**: identificador estável; tipo (tela | comportamento); classificação (núcleo = ⬛ transversal | opcional = segmento); estado (disponível | desligado | bloqueado).
- **Conjunto de módulos do terminal**: resultado pronto (como o ERP enviaria); cacheado localmente; produzido hoje por fixture/perfil.
- **Perfil de segmento**: nome + conjunto padrão de módulos (espelho do que o ERP aplicará depois).
- **Valor monetário**: quantidade inteira em centavos; exibição em moeda local.
- **Rota de tela**: identificador estável das cinco telas atuais e parâmetros mínimos do fluxo (ex.: retorno após venda).
- **Estado de lista/tela**: carregando | erro | vazio | conteúdo.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das vendas de fixture em que o recebido iguala o total, a finalização sucede (zero falhas por arredondamento).
- **SC-002**: Com perfil “Loja”, 0% das saídas Delivery/Atendimentos aparecem na venda finalizada; com perfil “Restaurante” (módulos ligados), essas saídas aparecem quando disponíveis.
- **SC-003**: Build de produção: 0 pontos de entrada para o painel que reescreve módulos.
- **SC-004**: Após reinício offline com cache válido, o conjunto de módulos exibido coincide com o último conjunto conhecido em 100% dos casos de teste.
- **SC-005**: As cinco telas atuais permanecem utilizáveis no fluxo já existente (abrir Balcão → lançar → pagar → finalizar; cadastrar cliente) sem regressão funcional observável.
- **SC-006**: Decisão de adiamento mobile está documentada na feature e no `AGENTS.md` do app na entrega; Fase 2 tem gatilho explícito para breakpoints.
- **SC-007**: Toda feature nova posterior consegue reutilizar os três estados visuais (loading/erro/vazio) sem inventar layout paralelo — verificado por uso (ou migração) em pelo menos um empty state existente e fixtures de loading/erro.
- **SC-008**: Catálogo cobre ≥ os comportamentos listados em FR-001 e as ações de tela já existentes; testes de perfil cobrem ao menos os quatro perfis nomeados.
- **SC-009**: Em testes com módulo no estado `bloqueado`, a UI operacional mostra o mesmo resultado que `desligado` (ausência), em 100% dos pontos que consultam o helper de visibilidade.

---

## Assumptions

- Escopo é o app nativo Flutter em `apps/pdv/app` (não o PWA `apps/pdv/frontend`).
- Sem backend: fixtures e cache local bastam; a fonte remota é só contrato/injeção.
- Perfis nomeados adotam a proposta do gap: **Restaurante**, **Lanchonete com delivery**, **Loja**, **Mercado** (ajustes finos de conteúdo do perfil podem ocorrer no plano sem reabrir a lista de nomes). Perfis sempre incluem o conjunto **núcleo** ⬛; diferem nos opcionais de segmento.
- “Não contratado” e “desligado neste terminal” compartilham ausência na UI operacional; a distinção importa para Configurações em modo leitura (Fase 1).
- Observação da venda no Pagamento permanece disponível nesta fase se não houver id de módulo próprio; Vendedor é **núcleo** e permanece no catálogo (visível quando disponível; ausente se desligado/bloqueado — mas validação de entrada não deve permitir desligar Vendedor em configuração válida).
- A escolha de biblioteca de rotas do projeto (`go_router`) é decisão técnica já alinhada ao `AGENTS.md` do app — a spec exige o resultado (rotas declarativas).
- Documentação do módulo (`AGENTS.md` de `apps/pdv/app`) será atualizada na mesma entrega da implementação (docs-as-code), incluindo o adiamento explícito do mobile.
- Goldens por perfil e `integration_test/` completos ficam para Fase 5; esta fase exige testes unitários/widget cobrindo catálogo, centavos, rotas e §5.8.

---

## Out of Scope

- Telas novas: Sangria, Últimas vendas, Caixa/turno, Login, Pareamento, Configurações de produto, Mesas, Comandas, Delivery, etc.
- Integração ERP/Keycloak/TEF/impressão/sync.
- Painel de módulos virar seção de Configurações do lojista (Configurações em modo leitura = Fase 1).
- Challenge de senha de gerente para módulo bloqueado (Fase 4).
- Aplicação de `PdvBreakpoints` / layouts compacto e médio em Balcão e Pagamento (adiado; reabre na Fase 2).
- Teclado numérico on-screen Android, acessibilidade completa, goldens por perfil (Fase 5).
- Correções de produto do Balcão além do necessário para módulos/centavos/rotas/estados (código de barras funcional = Fase 3).
