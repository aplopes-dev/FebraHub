# Feature Specification: Catálogo — backend de Adicionais e Sugestões do produto

**Feature Branch**: `008-catalogo-adicionais-sugestoes`

**Created**: 2026-08-09

**Status**: Draft

**Input**: User description: "Desenvolver o backend das abas 'Adicionais' e 'Sugestões' de /catalogo/produtos no ERP (apps/erp/api + apps/erp/web), com base no frontend já existente. A aba Adicionais permite configurar itens opcionais vinculados a um produto, com quantidade mínima/máxima de seleção, opção de cobrar valor a partir de uma quantidade selecionada pelo cliente, e uma lista de adicionais (cada um com opção vinculada, quantidade máxima e preço). A aba Sugestões deve seguir padrão semelhante de configuração de itens relacionados/sugeridos ao produto. Precisamos das entidades de domínio, endpoints REST, migrations Prisma e regras de negócio para essas duas abas, vertical Comércio (apps/erp/api)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar o catálogo de adicionais da loja (Priority: P1)

Um lojista quer oferecer itens extras (ex.: "Bacon", "Queijo cheddar", "Borda recheada") que
qualquer produto do cardápio pode disponibilizar como opcional. Antes de vincular um adicional a
um produto, esse item precisa existir num catálogo próprio da loja, com nome e preço padrão.

**Why this priority**: Sem um catálogo de adicionais persistido, a aba "Adicionais" do produto não
tem o que listar no seletor "Selecione uma opção" — é a base de tudo o mais nesta feature.

**Independent Test**: Criar um adicional pelo catálogo (nome + preço padrão), consultar a lista de
adicionais ativos da organização e confirmar que ele aparece; editar seu nome/preço e confirmar que
a mudança é refletida; excluir (soft-delete) e confirmar que some da lista de ativos mas produtos
que já o referenciam continuam funcionando.

**Acceptance Scenarios**:

1. **Given** nenhum adicional cadastrado na organização, **When** o lojista cria um adicional com
   nome "Bacon" e preço padrão R$ 3,50, **Then** o adicional passa a existir e aparece na lista de
   adicionais ativos da organização.
2. **Given** um adicional já vinculado a um ou mais produtos, **When** o lojista exclui esse
   adicional, **Then** o adicional some da lista de ativos e do seletor de novos vínculos, mas os
   vínculos já existentes nesses produtos permanecem intactos (nome e preço congelados no momento
   do vínculo).
3. **Given** dois adicionais com nomes diferentes, **When** o lojista tenta criar um terceiro
   adicional com o mesmo nome de um já ativo, **Then** o sistema recusa com uma mensagem clara de
   nome duplicado (mesma regra de outros catálogos do módulo, ex.: categorias, unidade de medida).

---

### User Story 2 - Configurar os adicionais de um produto (Priority: P1)

Um lojista está editando um produto e quer definir quais adicionais o cliente pode escolher na
hora da compra: quantidade mínima e máxima de itens selecionáveis no total, se o valor só é
cobrado a partir de uma certa quantidade, e para cada adicional escolhido, sua quantidade máxima
individual e o preço cobrado (podendo divergir do preço padrão do catálogo).

**Why this priority**: É o comportamento central da tela mostrada ao usuário (aba "Adicionais" já
existe no frontend, hoje mock) — sem persistência, toda configuração se perde ao recarregar a
página.

**Independent Test**: Abrir um produto, configurar quantidade mínima/máxima, ativar "cobrar a
partir de quantidade selecionada" com um valor, adicionar 2 linhas de adicionais com quantidade
máxima e preço próprios, salvar, recarregar a página e confirmar que tudo volta exatamente como
foi salvo.

**Acceptance Scenarios**:

1. **Given** um produto sem adicionais configurados, **When** o lojista define quantidade mínima 1,
   máxima 3, adiciona os adicionais "Bacon" (qtd. máxima 2, preço R$ 3,50) e "Queijo cheddar"
   (qtd. máxima 1, preço R$ 2,00) e salva, **Then** a configuração é persistida e, ao reabrir o
   produto, os mesmos valores aparecem preenchidos na mesma ordem.
2. **Given** um produto com a opção "cobrar valor a partir de quantidade selecionada" desativada,
   **When** o lojista a ativa e informa "cobrar a partir de 2", **Then** o sistema persiste esse
   valor e volta a escondê-lo/zerá-lo funcionalmente se o lojista desativar o checkbox de novo.
3. **Given** uma lista de adicionais do produto com 3 linhas, **When** o lojista reordena as linhas
   por arrastar-e-soltar e salva, **Then** a nova ordem é persistida e refletida na próxima consulta
   do produto.
4. **Given** um adicional já selecionado numa linha do produto, **When** o lojista tenta selecionar
   o mesmo adicional numa segunda linha, **Then** o sistema impede a duplicidade (mesma regra já
   aplicada no frontend, agora validada no backend).
5. **Given** quantidade mínima maior que a quantidade máxima informada pelo lojista, **When** ele
   tenta salvar, **Then** o sistema recusa com uma mensagem de validação clara.
6. **Given** um produto com adicionais configurados, **When** o lojista remove todas as linhas e
   salva, **Then** o produto passa a não ter nenhum adicional vinculado (lista vazia é um estado
   válido).

---

### User Story 3 - Configurar sugestões (cross-sell) de um produto (Priority: P2)

Um lojista quer, ao configurar um produto, indicar outros produtos do próprio catálogo que serão
oferecidos como sugestão de compra complementar (cross-sell) antes do cliente finalizar a compra,
numa ordem de prioridade escolhida por ele.

**Why this priority**: Mesmo padrão de UI/UX de "Adicionais" (lista reordenável), mas depende de
produtos já cadastrados em vez de um catálogo à parte — prioridade um degrau abaixo por não ser
pré-requisito de nada além de si mesma.

**Independent Test**: Abrir um produto, adicionar 2 sugestões apontando para outros produtos
existentes, reordenar, salvar, recarregar a página e confirmar que a lista e a ordem persistem.

**Acceptance Scenarios**:

1. **Given** um produto sem sugestões configuradas, **When** o lojista adiciona 2 outros produtos
   como sugestão e salva, **Then** a configuração é persistida e, ao reabrir o produto, as mesmas
   sugestões aparecem na mesma ordem.
2. **Given** um produto já selecionado como sugestão numa linha, **When** o lojista tenta
   selecionar o mesmo produto numa segunda linha, **Then** o sistema impede a duplicidade.
3. **Given** um produto A que sugere o produto B, **When** o lojista tenta configurar o produto A
   como sugestão de si mesmo, **Then** o sistema recusa (um produto não pode se autossugerir).
4. **Given** um produto B usado como sugestão pelo produto A, **When** o produto B é excluído
   (soft-delete), **Then** a sugestão some da listagem de sugestões ativas do produto A sem quebrar
   o carregamento do produto A.

---

### Edge Cases

- Um adicional com preço alterado no catálogo depois de já vinculado a um produto: o vínculo
  existente mantém o preço configurado na linha do produto (histórico do vínculo), não o preço
  atual do catálogo — o preço do catálogo é só o valor sugerido ao adicionar uma linha nova.
- Quantidade mínima/máxima da seção de Adicionais aceita `0` (sem obrigatoriedade de seleção) mas
  não aceita negativos.
- "Cobrar a partir de quantidade selecionada" sem uma quantidade informada (ou com valor `0`) não é
  um estado salvável quando o checkbox está ativo — precisa de um valor ≥ 1.
- Um produto excluído (soft-delete) referenciado numa **sugestão** de outro produto deve sumir da
  lista ativa de sugestões sem apagar o histórico do vínculo (mesma regra do FR de exclusão de
  adicionais).
- Excluir um produto que é o dono das configurações (o próprio produto sendo editado) remove em
  cascata suas próprias linhas de adicionais e sugestões (não há necessidade de preservá-las
  isoladas sem o produto dono).
- Reordenar uma lista vazia ou com 1 item é uma operação sem efeito, não um erro.

## Requirements *(mandatory)*

### Functional Requirements

**Catálogo de Adicionais (organização)**

- **FR-001**: O sistema MUST permitir criar um adicional de catálogo com nome (obrigatório, texto
  livre) e preço padrão (obrigatório, valor monetário ≥ 0), escopado à organização ativa.
- **FR-002**: O sistema MUST impedir dois adicionais ativos com o mesmo nome (case-insensitive) na
  mesma organização, recusando a criação/edição com mensagem de erro clara.
- **FR-003**: O sistema MUST permitir editar nome e preço padrão de um adicional de catálogo
  existente.
- **FR-004**: O sistema MUST permitir excluir (soft-delete) um adicional de catálogo; adicionais
  excluídos MUST NOT aparecer na listagem de ativos nem no seletor de novos vínculos, mas
  permanecem legíveis para renderizar vínculos já existentes em produtos.
- **FR-005**: O sistema MUST expor uma listagem de adicionais de catálogo (ativos) para alimentar o
  seletor da aba Adicionais do produto.

**Configuração de Adicionais do produto**

- **FR-006**: O sistema MUST persistir, por produto, a configuração de adicionais: quantidade
  mínima de seleção (inteiro ≥ 0), quantidade máxima de seleção (inteiro ≥ 0), flag de "cobrar
  valor a partir de quantidade selecionada" (booleano) e a quantidade a partir da qual passa a
  cobrar (inteiro ≥ 1, obrigatório apenas quando a flag está ativa).
- **FR-007**: O sistema MUST rejeitar a gravação da configuração de adicionais quando a quantidade
  mínima for maior que a quantidade máxima.
- **FR-008**: O sistema MUST permitir associar ao produto uma lista ordenada de linhas de
  adicional, cada uma referenciando um adicional do catálogo da organização, com quantidade máxima
  individual (inteiro ≥ 1) e preço (valor monetário ≥ 0, pré-preenchido com o preço padrão do
  catálogo ao criar a linha, mas editável e persistido de forma independente).
- **FR-009**: O sistema MUST rejeitar duas linhas de adicional do mesmo produto apontando para o
  mesmo adicional de catálogo.
- **FR-010**: O sistema MUST preservar e devolver a ordem de exibição das linhas de adicional
  (reordenação por arrastar-e-soltar no frontend) a cada consulta do produto.
- **FR-011**: O sistema MUST permitir salvar a configuração de adicionais do produto com a lista de
  linhas vazia (produto sem nenhum adicional).
- **FR-012**: A gravação da configuração de adicionais de um produto (seção + lista de linhas) MUST
  ser atômica — uma falha de validação em qualquer parte não persiste nenhuma parte.

**Sugestões do produto**

- **FR-013**: O sistema MUST permitir associar ao produto uma lista ordenada de sugestões, cada uma
  referenciando outro produto ativo da mesma organização.
- **FR-014**: O sistema MUST rejeitar duas linhas de sugestão do mesmo produto apontando para o
  mesmo produto sugerido.
- **FR-015**: O sistema MUST rejeitar um produto sendo sugestão de si mesmo.
- **FR-016**: O sistema MUST preservar e devolver a ordem de exibição das linhas de sugestão a cada
  consulta do produto.
- **FR-017**: O sistema MUST permitir salvar a lista de sugestões do produto vazia.
- **FR-018**: Quando um produto sugerido é excluído (soft-delete), o sistema MUST deixar de
  devolvê-lo nas consultas de sugestões ativas do produto que o referenciava, sem impedir a leitura
  do produto que o referenciava.
- **FR-019**: A gravação da lista de sugestões do produto MUST ser atômica — substitui o conjunto
  anterior por completo em uma única operação (mesmo padrão de `price-lists` items / `technical-sheets`
  composição já usado no módulo).

**Transversal**

- **FR-020**: Toda leitura e escrita destas duas seções MUST respeitar o escopo de organização
  ativa (multi-tenant), retornando/gravando apenas dados da organização autenticada.
- **FR-021**: O sistema MUST expor os dados de adicionais e sugestões no mesmo payload de leitura
  do produto (`GET` do produto) e aceitar sua gravação no mesmo fluxo de salvar do produto (`PUT`),
  espelhando como as demais seções do formulário (unidades, fornecedores, variações) já funcionam.

### Key Entities *(include if feature involves data)*

- **ProductAddon** (catálogo de adicionais da organização): nome, preço padrão, status
  ativo/excluído (soft-delete), pertence a uma organização.
- **ProductAddonLine** (linha de adicional vinculada a um produto): referencia um `Product` (dono)
  e um `ProductAddon` (catálogo), guarda quantidade máxima própria, preço próprio e posição de
  ordenação.
- **ProductAddonSettings** (configuração de adicionais do produto, 1:1 com `Product`): quantidade
  mínima, quantidade máxima, flag "cobrar a partir de quantidade selecionada", quantidade a partir
  da qual cobra.
- **ProductSuggestion** (linha de sugestão vinculada a um produto): referencia o `Product` dono e
  um `Product` sugerido, guarda posição de ordenação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um lojista consegue configurar adicionais e sugestões de um produto e, ao recarregar
  a página do zero, encontra 100% dos dados exatamente como salvou (nenhuma perda de linha, preço,
  quantidade ou ordem).
- **SC-002**: Tentativas de salvar configurações inválidas (min > max, duplicidade de adicional,
  duplicidade de sugestão, autossugestão) são recusadas com mensagem de erro compreensível em
  100% dos casos, sem gravar dado parcial.
- **SC-003**: Excluir um adicional de catálogo ou um produto sugerido não quebra o carregamento de
  nenhum produto que já o referenciava — a tela abre normalmente, apenas sem aquele item na lista
  ativa correspondente.

## Assumptions

- O "adicional" (aba Adicionais) é um catálogo próprio da organização (nome + preço padrão),
  independente da entidade `Product` — reflete o mock atual do frontend (`MOCK_PRODUCT_ADDONS`),
  que já trata adicionais como itens simples e não como produtos completos do estoque.
- A "sugestão" (aba Sugestões) referencia produtos reais já existentes no catálogo (`Product`) —
  reflete o mock atual do frontend (`MOCK_PRODUCT_SUGGESTIONS`, derivado de `MOCK_PRODUCTS`).
- Não há tela de cadastro dedicada (lista própria no menu) para o catálogo de Adicionais nesta
  fase — ele é criado/gerenciado inline a partir do seletor da aba Adicionais do produto (mesmo
  padrão simplificado de "criar categoria" embutido em outros formulários do ERP), a menos que uma
  clarificação decida por uma tela própria.
- Preço da linha de adicional é o preço final cobrado do cliente (não há regra de precificação
  adicional, ex.: desconto por variação, nesta fase).
- Fora de escopo desta feature: a aba "Disponibilidade" do produto (ainda mock, não mencionada no
  pedido) e qualquer integração com PDV/KDS para exibir adicionais/sugestões na venda — isso fica
  para uma fatia futura, assim como aconteceu com Variações (Fase B.1) antes de Adicionais.
- Segue o padrão arquitetural já estabelecido em `apps/erp/api` (Clean Architecture, schema Prisma
  próprio do módulo comércio) e o padrão de payload usado por `variations`/`price-lists` (seções
  aninhadas no mesmo `GET`/`PUT` do produto, sem endpoints CRUD separados por linha).
