# Feature Specification: PDV Varejo (Fase 3)

**Feature Branch**: `004-varejo-phase3`

**Created**: 2026-08-05

**Status**: Draft

**Input**: User description: "Fase 3 do PDV Flutter: módulos e telas da vertical varejo (código de barras funcional no Balcão, grade/variação tamanho-cor, produto por peso/balança, consulta de preço, Devolução e Crédito dos clientes) conforme gap frontend 2026-08-05. Sem integração backend — UI e fixtures."

**Fonte de análise**: `.claude/docs/pdv-app-frontend-gap-2026-08-05.md` (Fase 3 itens 19–23; §4.1 Devolução/Crédito; §4.2 Consulta de preço; §5.5 comportamentos varejo; §6.1 Balcão varejo; §8 sequência; premissa §1)

**Escopo de produto**: app nativo de ponto de venda (`apps/pdv/app`), **um único PDV** cujo conjunto de módulos muda por loja. Esta fase entrega a fatia **🏬 Varejo**: blocos de lançamento no Balcão (código de barras, grade/variação, peso/balança), **Consulta de preço**, e as ações de núcleo **Devolução** (`V`) e **Crédito dos clientes** (`C`) — núcleo ⬛, priorizadas aqui porque o varejo as pressiona mais.

**Pré-requisitos**:
- Fase 0 (`001-foundation-phase0`) — catálogo com ids de comportamento varejo, estados, rotas, centavos, estados UI, telas consultando o catálogo.
- Fase 1 (`002-common-core-phase1`) — turno/caixa, sangria, últimas vendas, configurações, ajuste genérico de total, vendedor na Home; operações de venda/gaveta/devolução/crédito exigem turno aberto.

**Independência da Fase 2**: Fases 2 (food) e 3 (varejo) são **intercambiáveis** (gap §9 decisão 4). Esta fase **não** depende de Mesas/Comandas/Delivery. Perfis Loja/Mercado exercitam o subconjunto varejo; perfil food sem módulos varejo não vê os blocos desta fase.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Código de barras funcional no Balcão (Priority: P1)

Como operador de loja/mercado, no Balcão uso o campo de código de barras (hoje decorativo) para **digitar ou “bippar”** um código: o produto correspondente da fixture é lançado no carrinho. Posso informar **quantidade × produto** antes do código (ex.: quantidade + confirmação + código) para lançar N unidades de uma vez. O campo recebe foco operacional e responde a envio/confirmação.

**Why this priority**: Campo mais usado do PDV de varejo; sem ele o Balcão varejo não opera no ritmo de caixa.

**Independent Test**: Perfil Loja/Mercado → Balcão → digitar/enviar código conhecido → item no carrinho; quantidade prévia × código; código inexistente com erro acionável; perfil sem módulo de código de barras esconde/desativa o comportamento.

**Acceptance Scenarios**:

1. **Given** módulo de código de barras disponível, turno aberto e Balcão aberto, **When** o operador informa um código válido da fixture e confirma, **Then** o produto correspondente é adicionado ao carrinho (quantidade 1, preço em centavos) e o campo fica pronto para o próximo código.
2. **Given** o mesmo contexto, **When** informa quantidade N (> 0) no fluxo de quantidade × produto e em seguida um código válido, **Then** o item entra com quantidade N (ou N linhas/unidade conforme regra única da fixture — testável e estável).
3. **Given** código inexistente ou inválido, **When** confirma, **Then** vê mensagem de erro clara, o carrinho não muda e o campo permanece utilizável (sem crash).
4. **Given** produto já no carrinho (mesmo SKU/código sem variação), **When** bipa de novo, **Then** a quantidade aumenta de forma coerente com a regra da fixture (incremento na linha existente **ou** nova linha — uma regra só, documentada na UI/fixture).
5. **Given** módulo de código de barras desligado (ex.: perfil só food sem o comportamento), **When** está no Balcão, **Then** o campo não opera como lançamento por código (ausente ou não funcional — alinhado ao catálogo).
6. **Given** turno fechado, **When** tenta operar o Balcão com código, **Then** aplica a regra da Fase 1 (fluxo para hub Caixa).

---

### User Story 2 - Grade e variação (tamanho, cor) (Priority: P1)

Como operador, ao selecionar um produto com variações na fixture, escolho **tamanho e/ou cor** (ou atributos equivalentes) numa **grade** antes de confirmar o lançamento. O item no carrinho mostra a variação escolhida e o preço daquela SKU. Produtos sem variação seguem o lançamento direto.

**Why this priority**: Diferença varejo *dentro* do Balcão; evita lançar SKU errada; id de comportamento previsto na Fase 0 (§5.5).

**Independent Test**: Produto com grade → escolher variação → carrinho; produto sem grade → lançamento direto; módulo desligado → sem grade (ou produto tratado como sem variação na fixture).

**Acceptance Scenarios**:

1. **Given** módulo grade/variação disponível e produto com variações, **When** o operador seleciona o produto (grade, busca ou código que exige escolha), **Then** vê a grade de atributos e só confirma o lançamento após escolher uma combinação válida.
2. **Given** combinação selecionada, **When** confirma, **Then** o carrinho mostra produto + variação legível e preço em centavos da SKU escolhida.
3. **Given** combinação esgotada/indisponível na fixture, **When** tenta selecioná-la, **Then** a UI impede ou sinaliza indisponibilidade sem lançar.
4. **Given** produto sem variações, **When** lança, **Then** não exige grade.
5. **Given** módulo grade desligado, **When** no Balcão, **Then** o fluxo de grade não é oferecido (catálogo).

---

### User Story 3 - Produto por peso / balança (Priority: P1)

Como operador de mercado/conveniência, ao lançar produto vendido **por peso**, informo o peso (entrada manual na fixture e/ou leitura simulada de balança) e o sistema calcula o valor em **centavos** (preço/kg × peso). O item no carrinho exibe peso e valor. Produtos unitários não pedem peso.

**Why this priority**: Fluxo típico de mercado; comportamento §5.5; Configurações já antecipam balança como preferência de terminal (Fase 1).

**Independent Test**: Lançar item por peso com valor calculado; peso zero/ inválido bloqueado; módulo desligado esconde o fluxo; perfil Loja sem peso não vê o bloco.

**Acceptance Scenarios**:

1. **Given** módulo balança/peso disponível e produto por peso na fixture, **When** o operador inicia o lançamento, **Then** informa peso (> 0) e vê o valor calculado em centavos antes de confirmar.
2. **Given** peso válido, **When** confirma, **Then** o carrinho mostra descrição, peso e valor; total da venda reflete em centavos.
3. **Given** peso zero, negativo ou formato inválido, **When** tenta confirmar, **Then** a validação impede com mensagem clara.
4. **Given** preferência de terminal “balança” na fixture (Fase 1), **When** o fluxo oferece leitura simulada, **Then** o peso pode ser preenchido pela simulação e o operador confirma ou ajusta antes de lançar.
5. **Given** módulo desligado, **When** no Balcão, **Then** produtos por peso não usam o fluxo de balança (ou não aparecem como pesáveis — conforme fixture + catálogo, sem caminho morto).

---

### User Story 4 - Consulta de preço (Priority: P1)

Como operador ou cliente no caixa, abro **Consulta de preço** (tela que falta no catálogo), leio/digo um código de barras e vejo **nome e preço** do produto **sem lançar no carrinho**. Posso consultar vários códigos em sequência e encerrar voltando à origem (Home/Balcão).

**Why this priority**: Padrão de loja; tela §4.2 ausente; evita vender “no escuro” ou sujar o carrinho só para ver preço.

**Independent Test**: Abrir consulta → código válido mostra preço; código inválido erro; confirmar que o carrinho do Balcão (se houver venda em curso noutro contexto) não recebe o item; módulo/perfil sem consulta esconde a entrada.

**Acceptance Scenarios**:

1. **Given** consulta de preço disponível e turno conforme regra operacional (acessível com turno aberto; se a entrada estiver na Home operacional, mesma regra Fase 1), **When** o operador abre a consulta, **Then** chega à tela dedicada (não “não implementado”).
2. **Given** a tela de consulta, **When** informa código válido, **Then** vê identificação do produto e preço formatado em centavos — **sem** adicionar ao carrinho de venda.
3. **Given** código inválido, **When** consulta, **Then** mensagem clara e campo pronto para nova tentativa.
4. **Given** várias consultas seguidas, **When** informa novos códigos, **Then** cada resultado substitui/atualiza a exibição sem acumular venda.
5. **Given** módulo/entrada indisponível no perfil, **When** na Home (ou onde a entrada existir), **Then** Consulta de preço não aparece.
6. **Given** o operador encerra a consulta, **When** volta, **Then** retorna à origem sem efeitos colaterais no carrinho.

---

### User Story 5 - Devolução de venda (Priority: P1)

Como operador, abro **Devolução** (`V`), busco a **venda original** (do turno ou histórico de fixture acessível), seleciono **itens/quantidades a devolver**, escolho a **forma de estorno** e confirmo. O fluxo gera registro de devolução ligado à venda original, atualiza totais/gaveta quando o estorno for em dinheiro, e exige turno aberto.

**Why this priority**: Ação Home sem destino; núcleo ⬛; varejo pressiona (troca/devolução no caixa).

**Independent Test**: Home/`V` → buscar venda → devolver item → estorno; venda inexistente; quantidade > vendida bloqueada; sem turno → hub Caixa; módulo desligado esconde `V`.

**Acceptance Scenarios**:

1. **Given** módulo Devolução disponível e turno aberto, **When** usa Home/`V`, **Then** chega ao fluxo de devolução (não “não implementado”).
2. **Given** o fluxo, **When** busca uma venda original existente na fixture, **Then** vê itens, quantidades e totais da venda.
3. **Given** venda encontrada, **When** seleciona itens/quantidades ≤ quantidade vendida (descontando devoluções anteriores da fixture) e confirma forma de estorno, **Then** registra a devolução, exibe comprovante/resumo e a venda original reflete o estorno parcial/total.
4. **Given** estorno em dinheiro, **When** confirma, **Then** o esperado em gaveta do turno diminui pelo valor estornado em dinheiro (mesma regra Fase 1: só dinheiro move gaveta).
5. **Given** quantidade a devolver inválida (zero, acima do disponível), **When** tenta confirmar, **Then** validação impede com mensagem.
6. **Given** turno fechado, **When** tenta Devolução, **Then** bloqueio com fluxo para hub Caixa.
7. **Given** módulo indisponível, **When** na Home, **Then** Devolução não aparece e o atalho não responde.

---

### User Story 6 - Crédito dos clientes (fiado) (Priority: P1)

Como operador, abro **Crédito dos clientes** (`C`), consulto **saldo/fiado** por cliente, **lanço pagamento** (abatimento) e vejo **extrato** de movimentos. Tudo sobre fixture + persistência local; turno aberto para lançar pagamento; consulta de saldo pode seguir a mesma regra operacional da Home (turno aberto).

**Why this priority**: Ação Home sem destino; núcleo ⬛; comum em varejo de bairro/mercado.

**Independent Test**: Listar/buscar cliente com saldo → ver extrato → lançar pagamento → saldo atualiza; pagamento > saldo ou valor ≤ 0 bloqueado; sem módulo esconde `C`.

**Acceptance Scenarios**:

1. **Given** módulo Crédito disponível e turno aberto, **When** usa Home/`C`, **Then** chega à tela de crédito/fiado (não “não implementado”).
2. **Given** a tela, **When** busca/seleciona um cliente da fixture, **Then** vê saldo atual (centavos) e acesso ao extrato.
3. **Given** cliente com saldo em aberto, **When** lança pagamento com valor > 0 e ≤ saldo (ou regra explícita de pagamento parcial), **Then** o saldo diminui, o movimento entra no extrato e o comprovante/resumo é exibido; se pagamento em dinheiro, gaveta do turno reflete conforme regra Fase 1.
4. **Given** valor inválido (≤ 0 ou acima do permitido pela regra), **When** tenta confirmar, **Then** validação impede.
5. **Given** cliente sem movimentos, **When** abre extrato, **Then** estado vazio padronizado (Fase 0).
6. **Given** turno fechado, **When** tenta abrir Crédito (ação operacional), **Then** fluxo para hub Caixa.
7. **Given** módulo indisponível, **When** na Home, **Then** Crédito não aparece.

---

### Edge Cases

- Código de barras com espaços/zeros à esquerda: normalização da fixture; se não achar, erro claro (não lançar produto errado).
- Bipar durante edição de quantidade/desconto de linha: não corromper o carrinho; foco/modo explícito.
- Quantidade × produto com N muito grande: limite razoável da fixture ou confirmação; impedir overflow de UI.
- Grade: atributo parcialmente escolhido — não confirma até combinação completa.
- Dois atributos (tamanho + cor) com célula vazia na matriz — célula não selecionável.
- Peso com muitas casas decimais: arredondamento monetário para **centavos inteiros** (regra única e testável).
- Produto por peso bipado via código: abre fluxo de peso, não lança unitário silencioso.
- Consulta de preço com venda em andamento no Balcão (outra rota): consulta **não** altera o carrinho.
- Devolução de venda já totalmente devolvida: não permite nova devolução; mensagem clara.
- Devolução de venda cancelada: bloqueada ou inexistente na busca.
- Estorno em meio diferente do pagamento original: permitido apenas se a fixture/regra da fase definir combinações; UI deixa a forma escolhida explícita.
- Crédito: pagamento que zera o saldo; extrato mostra saldo zero sem remover o cliente.
- Perfil Restaurante sem módulos varejo: Home sem Consulta de preço (se modular), Balcão sem grade/peso/código varejo; Devolução/Crédito como núcleo podem permanecer se o catálogo os marcar como núcleo disponível.
- Tablet ~800 px: telas novas (consulta, devolução, crédito) e Balcão com campo de código utilizáveis nos três formatos oficiais.
- Reinício do app: saldos de crédito, devoluções e preferências locais restaurados se persistidos (mesmo espírito Fase 1).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Com o módulo de comportamento disponível, o campo de **código de barras** do Balcão MUST aceitar entrada e confirmação, resolver produto na fixture e **lançar no carrinho** (deixando de ser apenas decorativo).
- **FR-002**: O Balcão MUST permitir fluxo **quantidade × produto** antes do código/confirmação, com N > 0 validado.
- **FR-003**: Código inexistente/inválido MUST produzir feedback acionável sem alterar o carrinho.
- **FR-004**: Com módulo grade/variação disponível, produtos com variações MUST exigir escolha de combinação válida antes do lançamento; o carrinho MUST exibir a variação.
- **FR-005**: Com módulo peso/balança disponível, produtos por peso MUST exigir peso > 0 e calcular valor em **centavos**; o carrinho MUST exibir peso e valor.
- **FR-006**: Preferência de terminal de balança (Fase 1) MUST poder alimentar peso via **simulação** de leitura, com confirmação do operador antes do lançamento.
- **FR-007**: MUST existir tela/fluxo de **Consulta de preço** que exibe produto e preço a partir do código **sem** lançar no carrinho.
- **FR-008**: A ação Home **Devolução** (`V`) MUST ter destino real quando o módulo estiver disponível; MUST exigir turno aberto (Fase 1).
- **FR-009**: Devolução MUST permitir buscar venda original, selecionar itens/quantidades elegíveis, escolher forma de estorno, registrar devolução e exibir comprovante/resumo.
- **FR-010**: Estorno em dinheiro MUST atualizar o esperado em gaveta do turno (regra Fase 1).
- **FR-011**: A ação Home **Crédito dos clientes** (`C`) MUST ter destino real quando disponível; lançamentos MUST exigir turno aberto.
- **FR-012**: Crédito MUST exibir saldo por cliente, extrato de movimentos e permitir lançar pagamento (abatimento) com validação de valor.
- **FR-013**: Todas as entradas, atalhos e blocos desta fase MUST consultar o **catálogo de módulos** (Fase 0); perfil sem o módulo não vê a capacidade.
- **FR-014**: Valores monetários MUST permanecer em **centavos inteiros**; conversões peso→valor MUST arredondar para centavos de forma determinística.
- **FR-015**: Navegação MUST usar **rotas declarativas** (Fase 0).
- **FR-016**: Estados vazio / carregamento / erro MUST usar os padrões da Fase 0.
- **FR-017**: Devoluções, saldos/extrato de crédito e dados de fixture operacional desta fase MUST ser **persistidos localmente** e restauráveis após reinício (dados locais intactos), alinhado à Fase 1.
- **FR-018**: Telas novas desta fase (Consulta de preço, Devolução, Crédito) e o Balcão no fluxo varejo MUST respeitar os **três formatos** oficiais do PDV (compacto / médio / expandido), sem colunas rígidas que quebrem ~800 px.
- **FR-019**: Nenhuma integração de backend, leitor serial real, balança física, TEF, NF-e/NFC-e, Keycloak ou sync ERP entra nesta fase — hardware é **simulado/fixture**.
- **FR-020**: Mesas, Comandas, Atendimentos, Delivery, blocos food, taxa/couvert permanecem **fora** desta fase (Fase 2), salvo coexistência se já entregues sem regressão.
- **FR-021**: Login de operador, pareamento, gerar nota, relatório gerencial, enviar NF e estados offline-sync permanecem **fora** (Fase 4).
- **FR-022**: O Balcão continua **uma única tela** com blocos ligados por módulo — MUST NOT duplicar o Balcão em arquivo “só varejo”.

### Key Entities

- **Código de produto / barras**: identificador de entrada no Balcão ou na consulta; resolve para produto ou SKU na fixture.
- **Variação / SKU**: combinação de atributos (ex.: tamanho, cor) com preço e disponibilidade próprios.
- **Item por peso**: produto com preço por unidade de peso; peso informado; valor em centavos.
- **Consulta de preço**: sessão de leitura de códigos sem efeito no carrinho de venda.
- **Devolução**: documento ligado à venda original; itens/quantidades devolvidas; forma de estorno; impacto em gaveta se dinheiro.
- **Conta de crédito (fiado)**: cliente + saldo em centavos + extrato de lançamentos (cargas/pagamentos conforme fixture).
- **Venda / item de carrinho**: herda turno e regras Fase 1; pode incluir variação, peso e origem por código de barras.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das ações Home `V` e `C` (módulos disponíveis e turno aberto) levam ao fluxo correspondente — zero “não implementado”.
- **SC-002**: Em perfil Loja/Mercado, operador lança ≥ 5 itens via código de barras (incluindo ao menos um com quantidade × produto) e conclui pagamento em menos de 5 minutos em fixture guiada.
- **SC-003**: Em 100% dos testes com produto por peso, o valor em centavos coincide com a regra preço×peso arredondada (sem erro de ponto flutuante).
- **SC-004**: 100% das consultas de preço com código válido mostram nome e preço **sem** alterar o carrinho de uma venda em paralelo nos testes definidos.
- **SC-005**: Devolução parcial: após devolver parte dos itens, a venda original reflete quantidades restantes e o comprovante de devolução é exibido em 100% dos casos de teste.
- **SC-006**: Pagamento de crédito: saldo e extrato atualizam de forma auditável em 100% dos lançamentos válidos de teste.
- **SC-007**: Perfil sem módulos/comportamentos varejo desta fase: 100% dos blocos grade/peso/código (quando desligados) e entradas condicionadas ausentes; núcleo Devolução/Crédito seguem o catálogo (visíveis só se disponíveis).
- **SC-008**: Em largura típica de tablet (~800 px), Consulta de preço, Devolução, Crédito e Balcão com código permanecem utilizáveis no percurso principal sem overflow que impeça a ação.
- **SC-009**: Após reinício com dados locais intactos, saldos de crédito e devoluções registradas restauram em 100% dos casos de teste de persistência.

---

## Assumptions

- Escopo é o app nativo Flutter em `apps/pdv/app` (não o PWA `apps/pdv/frontend`).
- Fases 0 e 1 entregues (ou em conjunto sem regressão). Fase 2 opcional/paralela.
- Sem backend: catálogo de produtos/códigos, grades, pesos, vendas para devolução e fiado usam **fixture + persistência local**.
- **Leitor de código** e **balança** são simulados (teclado/campo + preferência de terminal); sem SDK de hardware.
- Entrada de Consulta de preço: ação/módulo próprio no catálogo (ou atalho documentado na Home/Balcão); se ainda não houver id no catálogo da Fase 0, esta fase **inclui** o id de comportamento/tela no vocabulário de módulos.
- Devolução e Crédito são módulos de **núcleo** no catálogo; podem aparecer também em perfil food se ligados — a UI não assume “só loja”.
- Incremento ao bipar o mesmo código sem variação: **soma na linha existente** (padrão de caixa varejo).
- Arredondamento peso→centavos: half-up para o centavo mais próximo, regra única na fixture.
- Forma de estorno na v1: pelo menos **dinheiro** e **mesmo meio / crédito na conta do cliente** quando a fixture permitir; UI lista só meios habilitados.
- Crédito: saldo não fica negativo por pagamento; carga de fiado na venda (vender fiado) pode ficar para evolução se não estiver na fixture — **nesta fase o mínimo é consultar saldo, extrato e receber pagamento**.
- Breakpoints: reutiliza a entrega da Fase 2 se existir; senão esta fase aplica os três formatos às telas que tocar.
- Atualização do `AGENTS.md` de `apps/pdv/app` na mesma entrega (docs-as-code).

---

## Out of Scope

- Integração ERP / catálogo real / Keycloak / sync.
- Leitor de código de barras USB/Bluetooth real, balança serial/TOLEDO real, TEF.
- NFC-e/SAT, gerar nota, enviar NF, relatório gerencial (Fase 4).
- Login operador, pareamento, offline-sync global (Fase 4).
- Mesas, Comandas, Delivery, adicionais, meia-pizza, taxa/couvert (Fase 2).
- Vender no fiado como forma de pagamento no Pagamento (pode ser fase futura); aqui o foco é **conta de crédito + receber**.
- Troca com produto substituto (devolução + nova venda) como assistente único — pode ser dois fluxos manuais.
- Goldens por perfil e `integration_test/` completos (Fase 5) — testes unit/widget das novas capacidades entram na implementação desta fase.
- Painel dev de escrita de módulos; senha de gerente / challenge de módulo bloqueado (Fase 4).
