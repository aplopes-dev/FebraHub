# Feature Specification: Loja como Unidade de Billing (platform-api + admin-web)

**Feature Branch**: `001-store-billing-unit`

**Created**: 2026-07-18

**Status**: Draft

**Input**: User description: "analise o arquivo de @docs/adrs/plat-001-loja-como-unidade-de-billing.md com base nesse arquivo, vamos fazer uma refatoracao grande do projeto, mas nesse primeiro momento a spec não deve mexer dentro das verticais/api, somente na parte de platform/admin e platform/api"

## Escopo desta fase

Esta especificação implementa a fatia **platform-api + admin-web** da decisão registrada em
`docs/adrs/plat-001-loja-como-unidade-de-billing.md` (PLAT-001): eliminar `Client` como entidade
de billing, tornar a `Store` a unidade de cobrança direta, e escopar `Plan` por vertical e tier.

**Explicitamente fora de escopo nesta fase** (tratado em spec(s) futura(s) separada(s)):
- Qualquer mudança dentro de `apps/verticals/*/api` (`Organization`, `Negócio`, `Member`, guard
  local de autorização, enforcement de quota por `planSnapshot`, consumo dos eventos emitidos pelo
  `platform-api`).
- Mudanças em `apps/erp` (descoberta de acesso direta à vertical, seletor de loja via JWT).
- O modelo `Organization`/`Store`/`OrganizationSubscription` paralelo em `apps/marketplace/api` e
  `apps/realtime-gateway` (seção 8 do ADR — dívida técnica independente, ADR próprio).
- Cancelamento explícito de loja (status "cancelada", distinto de suspensão por inadimplência) —
  fica para uma fase futura.

## Clarifications

### Session 2026-07-18

- Q: Quando um Cliente legado tem mais de uma loja, cada loja migrada deve exigir documento
  fiscal (CNPJ/CPF) próprio e distinto, ou o sistema deve permitir que o mesmo documento se repita
  entre lojas (cenário matriz/filial com CNPJ raiz compartilhado)? → A: O documento fiscal pode se
  repetir entre lojas — não há validação de unicidade.
- Q: A vertical de uma loja pode ser trocada depois de criada, ou é fixada permanentemente na
  criação? → A: Imutável — a vertical é definida na criação e não pode ser alterada; trocar de
  vertical exige criar uma nova loja.
- Q: Cancelamento explícito de loja (fim de contrato, distinto de suspensão por inadimplência)
  entra no escopo desta fase? → A: Fora de escopo — esta fase cobre apenas ativa/suspensa/
  reativada (inadimplência) e em_provisionamento/ativa/falhou (deployment); cancelamento manual
  fica para uma fase futura.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar loja como unidade única de cobrança (Priority: P1)

Um operador da plataforma cadastra uma nova loja escolhendo diretamente a vertical e o plano
(vertical + tier), sem precisar criar ou vincular um "Cliente" separado. Os dados fiscais e de
responsável, hoje pedidos na criação de um Cliente, são preenchidos diretamente no cadastro da
loja.

**Why this priority**: É a mudança estrutural que destrava todas as demais — sem ela, `Plan`,
`Subscription` e `Invoice` continuam presos ao modelo antigo (`Client`) e nenhuma outra história
pode ser entregue de forma independente.

**Independent Test**: Pode ser testado cadastrando uma loja nova do zero, escolhendo vertical e
plano, e verificando que a assinatura e a primeira fatura são criadas vinculadas diretamente à
loja — sem que nenhum registro de "Cliente" seja criado, lido ou referenciado em nenhum ponto do
fluxo.

**Acceptance Scenarios**:

1. **Given** o operador está na tela de criação de loja, **When** ele preenche dados fiscais,
   escolhe a vertical e seleciona um plano daquela vertical, **Then** a loja é criada com esses
   dados, uma assinatura é aberta vinculada à loja (não a um Cliente), e o status de
   provisionamento inicial é "em provisionamento".
2. **Given** uma loja já existe, **When** o operador consulta seus dados, **Then** os dados
   fiscais/de responsável aparecem como atributos da própria loja, sem indireção por um registro
   de Cliente.
3. **Given** o cadastro de loja está em andamento, **When** o operador tenta avançar sem selecionar
   um plano de uma vertical, **Then** o sistema impede a conclusão e indica que um plano é
   obrigatório.

---

### User Story 2 - Tela única da loja com dados fiscais, plano e billing (Priority: P1)

Um operador acessa uma única tela por loja que reúne o que hoje está espalhado entre as telas de
"Cliente" e "Loja": dados fiscais/responsável, plano vigente (vertical + tier) e informações de
billing (assinatura atual e histórico de faturas).

**Why this priority**: É o valor visível imediato da mudança de modelo — sem a fusão de tela, o
operador continua tendo que navegar entre duas entidades para uma única unidade de negócio real,
mesmo com o dado já corrigido no backend.

**Independent Test**: Pode ser testado abrindo o detalhe de qualquer loja e confirmando que dados
fiscais, plano e billing aparecem juntos, sem precisar navegar para uma tela separada de
"Cliente" (que deixa de existir na navegação).

**Acceptance Scenarios**:

1. **Given** uma loja com assinatura ativa, **When** o operador abre o detalhe da loja, **Then**
   ele vê, na mesma tela, os dados fiscais, o plano vigente (com vertical e tier) e a lista de
   faturas (histórico e status).
2. **Given** o operador está navegando o admin, **When** ele procura por "Clientes" no menu,
   **Then** essa opção de navegação não existe mais — a loja é o único ponto de entrada.
3. **Given** uma loja tem faturas em atraso, **When** o operador abre a tela da loja, **Then** o
   status de inadimplência é visível na mesma tela, sem consulta adicional.

---

### User Story 3 - Catálogo de planos por vertical e tier (Priority: P2)

Um operador gerencia o catálogo de planos comerciais, cada um pertencente a uma vertical
específica e a um tier (ex.: "Clínica Prata", "Clínica Ouro"), com limite de unidades operacionais
e de usuários por tier, e preços por ciclo de cobrança (mensal/anual).

**Why this priority**: Sem planos escopados por vertical/tier, a User Story 1 não tem o que
oferecer ao operador na hora de escolher o plano de uma loja nova — mas o catálogo em si pode ser
montado e validado antes ou em paralelo ao fluxo de criação de loja.

**Independent Test**: Pode ser testado criando dois planos de verticais diferentes (ou dois tiers
da mesma vertical) com limites e preços distintos, e confirmando que cada um aparece isolado por
vertical na tela de seleção de plano.

**Acceptance Scenarios**:

1. **Given** o operador está gerenciando planos, **When** ele cria um plano informando vertical,
   tier, limite de unidades operacionais, limite de usuários e preço mensal/anual, **Then** o
   plano fica disponível apenas para lojas daquela vertical.
2. **Given** já existem dois tiers cadastrados para a mesma vertical, **When** o operador lista os
   planos daquela vertical, **Then** ambos aparecem com seus respectivos limites e preços,
   claramente diferenciados.

---

### User Story 4 - Troca de plano e ciclo de suspensão/reativação por inadimplência (Priority: P3)

Um operador altera o plano de uma loja existente (upgrade/downgrade) e acompanha, na própria tela
da loja, o efeito de inadimplência: suspensão automática quando uma fatura vence sem pagamento, e
reativação quando o pagamento é regularizado.

**Why this priority**: Depende das três histórias anteriores já estarem entregues (loja como
unidade de billing, tela unificada, catálogo de planos); é a camada de gestão do ciclo de vida
comercial da loja, não o cadastro inicial.

**Independent Test**: Pode ser testado trocando o plano de uma loja existente e verificando que a
assinatura é atualizada; e, separadamente, simulando uma fatura vencida e confirmando que o status
da loja muda para suspensa, voltando a ativo após a regularização.

**Acceptance Scenarios**:

1. **Given** uma loja tem um plano ativo, **When** o operador seleciona um novo plano (mesma
   vertical, tier diferente), **Then** a assinatura é atualizada para o novo plano e o histórico
   do plano anterior permanece visível.
2. **Given** uma fatura de uma loja vence sem pagamento, **When** o job de faturamento processa o
   vencimento, **Then** o status da loja muda para "suspensa" e isso fica visível na tela da loja.
3. **Given** uma loja suspensa por inadimplência regulariza o pagamento, **When** o pagamento é
   confirmado, **Then** o status da loja volta para "ativa".

---

### Edge Cases

- O que acontece com um "Cliente" legado que hoje tem mais de uma loja? Cada loja migra como
  unidade de cobrança independente (sem fatura consolidada de rede); dados fiscais que hoje só
  existem no Cliente são copiados para cada loja associada durante a migração.
- O que acontece com o histórico de faturas e assinaturas já emitidas para um Cliente? É migrado
  para referenciar a loja diretamente, preservando valores, datas e status — sem exclusão ou
  recriação destrutiva dos registros.
- O que acontece se o operador tentar rebaixar (downgrade) o plano de uma loja além do necessário
  para validar uso corrente dentro da vertical? A troca de plano é aceita e registrada no
  `platform-api`; o bloqueio de criação de novas unidades operacionais acima do novo limite é
  responsabilidade da vertical (fora do escopo desta fase) e pode não ter efeito prático até a
  vertical correspondente implementar esse enforcement.
- O que acontece com o status de provisionamento de uma loja nova enquanto nenhuma vertical
  implementa a confirmação de provisionamento? A loja permanece com status "em provisionamento"
  até que essa confirmação exista — não é tratado como erro nesta fase.
- O que acontece se o operador tentar criar uma loja sem selecionar uma vertical? O sistema impede
  a conclusão do cadastro, já que todo plano — e, portanto, toda loja — pertence a uma vertical.
- O que acontece se o operador tentar trocar o plano de uma loja para um plano de vertical
  diferente da vertical atual? O sistema impede a troca — a vertical da loja é imutável após a
  criação; apenas planos da mesma vertical ficam disponíveis para seleção.
- O que acontece se duas lojas (ex.: matriz e filial de um mesmo Cliente legado) tiverem o mesmo
  documento fiscal? É permitido — o sistema não exige documento fiscal único entre lojas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir que um operador cadastre uma loja com seus dados fiscais e
  de responsável (documento, tipo de pessoa, nome do responsável, endereço fiscal) diretamente no
  registro da loja, sem exigir um registro de "Cliente" separado.
- **FR-002**: O sistema DEVE tratar a loja como a única unidade de cobrança: toda assinatura e
  toda fatura são associadas diretamente a uma loja, nunca a um "Cliente".
- **FR-003**: O sistema NÃO DEVE mais oferecer, em nenhuma tela do admin, a criação, edição ou
  consulta de um "Cliente" como conceito de billing.
- **FR-004**: O sistema DEVE permitir que um operador cadastre planos comerciais escopados a uma
  vertical específica e a um tier dentro dela (ex.: "Clínica Prata", "Clínica Ouro"), cada um com
  seu próprio limite de unidades operacionais e limite de usuários.
- **FR-005**: O sistema DEVE permitir múltiplos ciclos de cobrança (mensal e anual) por plano, cada
  um com seu próprio preço.
- **FR-006**: O sistema DEVE permitir que um operador escolha a vertical e o plano (tier) de uma
  loja no momento da criação. Após a criação, a vertical é imutável; o operador só pode alterar o
  plano posteriormente (upgrade ou downgrade) dentro da mesma vertical.
- **FR-007**: Ao criar uma loja, o sistema DEVE notificar de forma assíncrona a vertical
  correspondente com os dados necessários para provisionamento (identificação da loja, plano
  escolhido com seus limites, e dono) — a reação da vertical a essa notificação está fora do
  escopo desta especificação.
- **FR-008**: Ao alterar o plano de uma loja, o sistema DEVE notificar de forma assíncrona a
  vertical correspondente com o novo plano e seus limites.
- **FR-009**: O sistema DEVE acompanhar o status de provisionamento de uma loja (em provisionamento
  / ativa / falhou), atualizando-o quando uma confirmação da vertical for recebida, e mantendo "em
  provisionamento" enquanto nenhuma confirmação chegar.
- **FR-010**: Quando uma fatura de uma loja vence sem pagamento, o sistema DEVE marcar a loja como
  suspensa e notificar de forma assíncrona a vertical correspondente.
- **FR-011**: Quando o pagamento de uma loja suspensa é regularizado, o sistema DEVE marcar a loja
  como ativa novamente e notificar de forma assíncrona a vertical correspondente.
- **FR-012**: O admin DEVE apresentar uma única tela por loja reunindo dados fiscais/responsável,
  plano vigente (com vertical e tier visíveis) e billing (assinatura atual e histórico de faturas).
- **FR-013**: O sistema DEVE migrar todo o histórico existente de assinaturas e faturas — hoje
  associado a um Cliente — para referenciar diretamente a loja correspondente, sem perda de
  valores, datas ou status.
- **FR-014**: Quando um "Cliente" legado tiver mais de uma loja associada, o sistema DEVE migrar
  cada loja como unidade de cobrança independente, copiando os dados fiscais do Cliente para cada
  loja que ainda não os possua.
- **FR-015**: O sistema DEVE impedir a criação de uma loja sem uma vertical e um plano daquela
  vertical selecionados.
- **FR-016**: O sistema NÃO DEVE exigir que o documento fiscal (CNPJ/CPF) seja único entre lojas —
  múltiplas lojas podem compartilhar o mesmo documento (cenário matriz/filial, inclusive entre
  lojas migradas de um mesmo Cliente legado).

### Key Entities *(include if feature involves data)*

- **Store (Loja)**: unidade operacional e, a partir desta mudança, também a unidade única de
  cobrança. Passa a carregar os dados hoje existentes no Cliente (documento fiscal — não
  necessariamente único entre lojas, cenário matriz/filial —, tipo de pessoa, responsável,
  endereço), além de vertical (definida na criação, imutável), plano vigente, status de billing
  (ativa/suspensa — cancelamento explícito fora de escopo desta fase) e status de provisionamento.
- **Plan (Plano)**: catálogo comercial, agora escopado por vertical e tier, com limite de unidades
  operacionais e de usuários por tier.
- **PlanPrice (Preço do Plano)**: preço de um Plan para um ciclo de cobrança específico (mensal ou
  anual).
- **Subscription (Assinatura)**: vínculo vigente entre uma Store e um PlanPrice, com ciclo, status
  e período corrente.
- **Invoice (Fatura)**: cobrança gerada a partir de uma Subscription, associada diretamente à
  Store, com valor, vencimento e status.
- **Client (Cliente)**: entidade eliminada como conceito de billing nesta fase — mencionada aqui
  apenas porque seus dados e relacionamentos (Subscription/Invoice) são migrados para a Store
  durante a implementação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um operador consegue cadastrar uma loja nova — com dados fiscais, vertical e plano —
  em uma única tela, sem criar ou referenciar um "Cliente" em nenhum momento do fluxo.
- **SC-002**: 100% das assinaturas e faturas existentes antes da migração continuam acessíveis e
  associadas à loja correta depois da migração, com os mesmos valores, datas e status.
- **SC-003**: Nenhuma tela do admin apresenta a entidade "Cliente" como conceito de billing após a
  conclusão desta fase.
- **SC-004**: Um operador consegue visualizar e alterar o plano e o status de billing de qualquer
  loja a partir de uma única tela, sem navegar para uma tela separada.
- **SC-005**: O catálogo de planos suporta pelo menos duas verticais e, em pelo menos uma delas,
  dois tiers distintos, cada um com limites e preços próprios, sem exigir alteração de código para
  cadastrar um novo tier.
- **SC-006**: Uma loja com fatura vencida sem pagamento aparece como suspensa na tela da loja em
  até um ciclo de processamento do job de faturamento, sem intervenção manual do operador.

## Assumptions

- Esta especificação cobre apenas `platform-api` e `admin-web` (`apps/platform/admin`). A
  implementação do lado de cada `vertical-api` que recebe e reage às notificações (criação de
  `Organization`/`Negócio`/`Member`, guard local de autorização, enforcement de quota via
  `planSnapshot`) é tratada em spec(s) futura(s) separada(s), por vertical.
- Enquanto nenhuma `vertical-api` implementar o lado de confirmação de provisionamento, é esperado
  e aceitável que lojas novas permaneçam com status "em provisionamento" indefinidamente em
  ambientes onde essa vertical ainda não foi adaptada — não é tratado como defeito desta fase.
- Casos de um Cliente legado com mais de uma loja são assumidos como raros (a validar via consulta
  aos dados existentes antes da migração); esta fase não introduz nenhum agrupador de faturamento
  substituto — o cenário de rede/franquia fica coberto, no futuro, pelo par Organization/Negócio
  dentro de cada vertical (fora de escopo aqui).
- A migração de dados de billing reais (identificadores de assinatura e faturas em processador de
  pagamento externo) segue uma estratégia sem exclusão direta de dados (expand-contract), dado o
  caráter sensível desse histórico.
- `apps/erp` não é alterado nesta fase; a forma como o ERP hoje descobre lojas e acesso permanece
  como está até uma especificação dedicada.
- O modelo de permissões/autenticação de operadores já existente no admin-web é reaproveitado sem
  alteração — esta especificação não introduz um novo esquema de autorização para o admin.
- O modelo `Organization`/`Store`/`OrganizationSubscription` paralelo em `apps/marketplace/api` e
  `apps/realtime-gateway` não é tocado nem reconciliado nesta fase (tratado por ADR próprio,
  conforme seção 8 de PLAT-001).
