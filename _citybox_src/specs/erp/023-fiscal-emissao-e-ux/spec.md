# Feature Specification: 023 — Fiscal: emissão de séries, deploy, scroll e novas seções de emissão

**Feature Branch**: `023-fiscal-emissao-e-ux`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: re-teste manual do Menu Fiscal em produção (lojista comum, sem `platform_admin`) achou 5 defeitos residuais da feature 022 (N1-N5) + pedido do usuário para tirar do "em breve" 2-3 seções de Configurações gerais fiscais e redesenhar o rodapé de "Outros cadastros fiscais" em Padrões fiscais (N6, N7). Fonte completa: `specs/erp/021-correcoes-fiscal/prompt-fiscal-023.md` e `specs/erp/021-correcoes-fiscal/reteste-2026-08-14-v2.md`.

## Clarifications

### Session 2026-08-14

- Q: N1 — a rota de escrita de Séries exige `fiscal.sequences.manage`, que não existe em nenhum papel. Como corrigir? → A: Criar `fiscal.sequences.manage` como permissão nova, concedida a `fiscal_operator` e `platform_admin` (não reusar `fiscal.documents.manage`).
- Q: N6 — quais das 3 seções "em breve" de Configurações gerais entram nesta feature? → A: Só "Justificativas padrão" (2 campos: justificativa de inutilização e de cancelamento). "Vendas e base de cálculo" e "Outras configurações" ficam declaradamente fora — permanecem "Em breve".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lojista consegue gerenciar Séries de nota fiscal (Priority: P1)

Um lojista comum (sem papel de administrador da plataforma) abre Configurações → Fiscal → Séries e cria, ajusta o número, desativa/reativa e exclui uma série de numeração.

**Why this priority**: É o defeito mais grave herdado do re-teste — a leitura já funciona, mas **toda escrita** falha com 403 para qualquer usuário que não seja `platform_admin`, tornando a tela inutilizável na prática (nenhum lojista real tem esse papel).

**Independent Test**: Logado como lojista comum, criar uma série nova, ajustá-la, desativá-la e excluí-la — todas as 4 operações devem responder com sucesso (ou um erro de validação de negócio esperado, nunca 403).

**Acceptance Scenarios**:

1. **Given** um lojista comum autenticado com vínculo ativo na organização, **When** ele cria uma nova série de NF-e, **Then** a série é criada e aparece na lista (sem 403).
2. **Given** uma série existente com número 5, **When** o lojista ajusta o número para 10 (só aumento), **Then** o novo número é salvo.
3. **Given** uma série ativa, **When** o lojista desativa e depois reativa, **Then** o estado reflete corretamente em cada passo.
4. **Given** uma série com número 0, **When** o lojista a exclui, **Then** ela é removida da lista.
5. **Given** qualquer permissão usada em qualquer rota da fiscal-api, **When** o mapa de permissões é auditado, **Then** toda permissão referenciada é concedida por pelo menos um papel (nenhuma "permissão fantasma" como a que causou este defeito).

---

### User Story 2 - Tela de Grupos fiscais funciona de ponta a ponta em produção (Priority: P1)

Um lojista abre Configurações → Fiscal → Grupos fiscais e vê a listagem completa (situação tributária, alíquota, número de produtos) e consegue excluir um grupo sem uso.

**Why this priority**: A funcionalidade já existe no código (entregue na feature 022) mas está **quebrada em produção** porque só uma parte dos serviços foi implantada — efeito visível: `undefined%`, coluna Produtos vazia, exclusão que "funciona" na UI mas não exclui nada (404 silencioso).

**Independent Test**: Abrir a listagem de grupos de qualquer tributo em produção e conferir que Situação/Alíquota/Produtos aparecem preenchidos (não `undefined`/vazio), e que excluir um grupo sem uso realmente o remove.

**Acceptance Scenarios**:

1. **Given** um grupo de ICMS cadastrado, **When** a listagem carrega, **Then** as colunas Situação tributária, Alíquota e Produtos mostram valores reais (nunca a string `undefined`).
2. **Given** um grupo sem produtos vinculados e que não é o padrão fiscal, **When** o lojista confirma a exclusão, **Then** o grupo desaparece da lista de verdade (sem erro 404 silencioso).
3. **Given** o ambiente de produção antes desta feature, **When** se compara o comportamento do backend com o código já presente no repositório, **Then** fica registrado que a causa era desatualização de implantação, não um bug de código — e o processo de entrega ganha uma salvaguarda para não repetir.

---

### User Story 3 - Nenhuma tela fiscal perde o botão Salvar por falta de rolagem (Priority: P2)

Um lojista usando uma tela de laptop (1366×768 ou 1280×720) abre qualquer formulário do Menu Fiscal — incluindo os formulários de cadastro de grupo (a matriz de 27 UFs do ICMS é o caso mais extremo) — e consegue rolar até o fim e alcançar o botão Salvar, tanto com o mouse quanto navegando só com o teclado (Tab).

**Why this priority**: Regressão parcial da feature 022 — o mecanismo de rolagem foi aplicado nas telas de lista/hub, mas não nos formulários de criar/editar grupo, que são justamente os mais longos. Sem isso, salvar um grupo de ICMS é impossível numa tela de laptop.

**Independent Test**: Em viewport 1366×768, abrir `/configuracoes/fiscal/grupos-icms/novo`, preencher o formulário, rolar (mouse) até o botão Salvar e confirmar que ele é clicável; repetir usando apenas Tab.

**Acceptance Scenarios**:

1. **Given** uma tela de 1366×768, **When** o lojista abre o formulário de novo grupo de ICMS, **Then** ele consegue rolar (mouse) até o botão Salvar e ele fica totalmente visível/clicável.
2. **Given** a mesma tela, **When** o lojista navega só com Tab a partir do topo do formulário, **Then** o foco eventualmente alcança o botão Salvar sem ficar preso ou sair da viewport sem indicação visual.
3. **Given** qualquer tela do Menu Fiscal (não só as listadas explicitamente no achado), **When** ela é revisada, **Then** nenhuma tela sem o mecanismo de rolagem é encontrada — a varredura cobre o menu inteiro, não só a lista já conhecida.

---

### User Story 4 - Mensagens de erro e valores exibidos nunca mostram "undefined" ou jargão técnico cru (Priority: P3)

Um lojista vê sempre um valor legível (nunca a palavra `undefined`) nas colunas de alíquota/situação da listagem de grupos, e vê uma mensagem em português explicando o motivo quando uma ação é bloqueada por falta de permissão (nunca a palavra crua `Forbidden`).

**Why this priority**: Robustez de exibição — baixo risco técnico, mas visível e barato de corrigir, e evita que o próximo re-teste registre os mesmos dois achados.

**Independent Test**: Forçar um valor de alíquota ausente (`null`/ausente) na listagem e confirmar que aparece "—", não `undefined%`; forçar uma resposta 403 do backend e confirmar que a mensagem exibida é acionável em português, não a palavra crua do backend.

**Acceptance Scenarios**:

1. **Given** um grupo cuja alíquota não se aplica (ex.: ICMS, que usa matriz por UF), **When** a listagem renderiza a linha, **Then** a coluna mostra "—", nunca `undefined%`.
2. **Given** uma tentativa de escrita sem permissão suficiente, **When** o erro 403 chega ao formulário, **Then** a mensagem exibida é em português e orienta o usuário (não o texto cru devolvido pela API).

---

### User Story 5 - Lojista configura as justificativas padrão de inutilização e cancelamento (Priority: P3)

Um lojista abre Configurações → Fiscal → Configurações gerais → "Justificativas padrão" e preenche e salva os dois textos que hoje aparecem desabilitados com a legenda "Em breve": justificativa de inutilização e justificativa de cancelamento.

**Why this priority**: É a única das 3 seções "em breve" que entra nesta feature (decisão do usuário — ver Clarifications). As outras duas ("Vendas e base de cálculo", "Outras configurações") ficam declaradamente fora, porque dependiam de decisões de fronteira (persistência erp-api vs. fiscal-api, campos condicionados a B2/CSOSN 101 ainda não decidido) que não valia a pena resolver para uma fatia que o usuário não priorizou agora.

**Independent Test**: Preencher os dois campos de justificativa, salvar, recarregar a página e confirmar que os valores persistiram; usar um dos textos numa inutilização/cancelamento real e confirmar que ele aparece no XML gerado.

**Acceptance Scenarios**:

1. **Given** a seção "Justificativas padrão", **When** o lojista preenche os dois campos (mínimo de 15 caracteres cada, exigência da SEFAZ) e salva, **Then** os valores persistem e voltam preenchidos ao recarregar a tela.
2. **Given** um texto com menos de 15 caracteres, **When** o lojista tenta salvar, **Then** o sistema recusa com uma mensagem explicando o mínimo exigido.
3. **Given** uma justificativa padrão preenchida com 15–255 caracteres, **When** o lojista tenta salvar, **Then** o sistema aceita (a validação de tamanho, exigência da SEFAZ para o campo `xJust`/`xCorrecao`, é a mesma já aplicada nas rotas que consomem esse texto). ⚠️ **Limitação declarada**: não existe hoje nenhuma tela em `erp-web` que chame inutilizar/cancelar documento fiscal — essas rotas só existem no backend, chamadas por outros clientes internos. Esta feature entrega o campo persistido e validado; pré-preencher automaticamente um formulário de inutilização/cancelamento no ERP fica para quando esse formulário existir.
4. **Given** as seções "Vendas e base de cálculo" e "Outras configurações", **When** o lojista abre a tela, **Then** elas continuam mostrando "Em breve" — não ficam parcialmente implementadas.

---

### User Story 6 - "Outros cadastros fiscais" em Padrões fiscais vira cards informativos como os de tributo (Priority: P3)

Um lojista que já viu os cards por tributo (ICMS/IPI/PIS-COFINS/ISSQN) na aba Padrões fiscais encontra o mesmo padrão visual e o mesmo tipo de informação (quantos registros existem, o que fazer se não houver nenhum) para Informações adicionais da nota e Naturezas de operação — em vez dos dois links de texto crus que sobraram do desenho anterior.

**Why this priority**: Pedido explícito do usuário, quem apontou a inconsistência visual depois de ver os cards de tributo prontos. Não bloqueia nenhum fluxo — é polimento de UX consistente com o resto da tela já entregue.

**Independent Test**: Abrir a aba Padrões fiscais e comparar visualmente o bloco "Outros cadastros fiscais" com os cards de tributo acima — mesma estrutura (título, contagem/estado vazio, ação de gerenciar), sem número falso nem placeholder.

**Acceptance Scenarios**:

1. **Given** a organização tem 3 informações adicionais cadastradas para NF-e, **When** o lojista abre Padrões fiscais, **Then** o card de "Informações adicionais" mostra essa contagem real (não um link sem contexto).
2. **Given** a organização não tem nenhuma natureza de operação cadastrada, **When** o lojista abre Padrões fiscais, **Then** o card explica para que serve o cadastro (estado vazio, não um placeholder ou número inventado).

### Edge Cases

- O que acontece se o mapa de permissões da fiscal-api ganhar, no futuro, uma nova rota com uma string de permissão nova sem atualizar a lista de papéis? → Coberto por FR-005 (teste que audita o mapa inteiro).
- O que acontece se um pipeline de deploy permitir implantar só um app do monorepo (ex.: erp-web) sem os outros dos quais ele depende (erp-api)? → Coberto por FR-006 (gate proposto, não necessariamente implementado nesta feature — ver Assumptions).
- O que acontece com um grupo de ICMS de teste ("TESTE QA - pode excluir") deixado no ambiente pelo re-teste anterior? → Removido manualmente após o `DELETE` voltar a funcionar (não é código, é housekeeping — ver Assumptions).
- O que acontece se o usuário tentar salvar um campo de Configurações gerais que alimenta o XML mas com um valor que a SEFAZ rejeitaria (ex.: justificativa com menos de 15 caracteres)? → Depende da decisão de escopo (ver Clarifications); se o campo entrar nesta feature, a validação de tamanho mínimo entra junto.

## Requirements *(mandatory)*

### Functional Requirements — N1 (permissão de escrita de Séries)

- **FR-001**: O sistema DEVE permitir que um usuário com vínculo ativo na organização (não apenas `platform_admin`) crie, ajuste o número, desative/reative e exclua séries de numeração fiscal, usando exatamente uma string de permissão (ver Clarifications para qual).
- **FR-002**: Nenhuma rota da fiscal-api DEVE exigir uma permissão que não seja concedida a nenhum papel — essa é a causa-raiz deste achado e não pode se repetir por outra rota.

### Functional Requirements — N2 (deploy)

- **FR-003**: O ambiente de produção DEVE expor o mesmo comportamento de backend (`erp-api`) que o frontend em produção já consome — especificamente `GET /v1/fiscal-groups` com os campos ricos (`taxSituation`, `rate`, `productCount`, `updatedAt`) e `DELETE /v1/fiscal-{tributo}-groups/:id` funcional.

### Functional Requirements — N3 (scroll dos formulários de grupo)

- **FR-004**: Todo formulário do Menu Fiscal, incluindo os 4 formulários de criar/editar grupo fiscal (ICMS, IPI, ISSQN, PIS/COFINS) e a tela de Informações adicionais, DEVE permanecer navegável até o último elemento (incluindo o botão de salvar) tanto por rolagem de mouse quanto por navegação de teclado (Tab), nas resoluções 1366×768 e 1280×720.
- **FR-004a**: A varredura de telas sem esse mecanismo DEVE cobrir todo o Menu Fiscal, não apenas as rotas já identificadas no achado.

### Functional Requirements — N4/N5 (robustez de exibição)

- **FR-004b**: Qualquer valor numérico ausente ou não aplicável (alíquota, situação tributária) exibido na listagem de grupos DEVE renderizar um marcador neutro ("—"), nunca a string literal `undefined`.
- **FR-004c**: Qualquer erro de autorização (401/403) DEVE ser traduzido para uma mensagem acionável em português antes de chegar à interface — nunca o texto cru devolvido pelo backend.

### Functional Requirements — N6 (Justificativas padrão — única seção no escopo)

- **FR-005**: O sistema DEVE substituir por campos funcionais (persistidos, validados, recarregáveis) os dois campos da seção "Justificativas padrão" (justificativa de inutilização, justificativa de cancelamento) — as seções "Vendas e base de cálculo" e "Outras configurações" ficam **fora de escopo** e continuam "Em breve" (decisão do usuário).
- **FR-005a**: As duas justificativas DEVEM ter no mínimo 15 caracteres (exigência da SEFAZ para o campo `xJust`/`xCorrecao`), validado tanto no formulário quanto no backend.
- **FR-005b**: As duas justificativas pertencem ao Emitente (persistidas na `fiscal-api`, mesma entidade `Company`) e DEVEM ser usadas como valor pré-preenchido/padrão nos fluxos de inutilização e cancelamento de documento fiscal já existentes.
- **FR-005c**: O sistema NÃO DEVE implementar o envio automático de XML/DANFE por e-mail nesta feature — não há serviço de e-mail disponível (mesma limitação já registrada para "Histórico de Envios" do Facilita NF-e) — e este campo nem está no escopo reduzido (fica em "Vendas e base de cálculo"/"Outras configurações", ambas fora).

### Functional Requirements — N7 (UX de Outros cadastros fiscais)

- **FR-006**: O bloco "Outros cadastros fiscais" da aba Padrões fiscais DEVE seguir o mesmo padrão visual dos cards de tributo já entregues (hierarquia visual, estados hover/focus/active, sem grid genérico) e mostrar contagem real de registros — nunca um número falso ou placeholder.
- **FR-006a**: Se a contagem exigir um endpoint ou campo novo na API, esse trabalho DEVE ser tratado como parte do escopo desta feature, não adiado silenciosamente.

### Key Entities

- **Permissão fiscal (`fiscal.*`)**: string usada por `@RequirePermission` nas rotas da fiscal-api; concedida a um ou mais papéis (`platform_admin`, `fiscal_operator`). Esta feature corrige uma permissão referenciada sem estar mapeada a nenhum papel.
- **Grupo fiscal**: já modelado (feature 022) — esta feature não muda o modelo, só corrige a exposição em produção e a exibição no frontend.
- **Justificativas padrão do Emitente**: dois campos novos na entidade `Company` (fiscal-api) — texto padrão usado ao inutilizar ou cancelar um documento fiscal, mínimo 15 caracteres.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das 4 operações de escrita de Séries funcionam para um usuário lojista comum (0 respostas 403 nos testes manuais de aceite).
- **SC-002**: A listagem de Grupos fiscais em produção não exibe `undefined` em nenhuma célula, e a exclusão de um grupo sem uso remove o registro de fato (confirmado por reload da lista).
- **SC-003**: Em 1366×768 e 1280×720, 100% das telas do Menu Fiscal (varredura completa) alcançam o último elemento por rolagem de mouse e por Tab.
- **SC-004**: Nenhum erro de permissão exibido ao usuário mostra o texto cru do backend (`Forbidden` ou similar).
- **SC-005**: Os dois campos de "Justificativas padrão" persistem os valores preenchidos e refletem corretamente após recarregar a página; "Vendas e base de cálculo" e "Outras configurações" continuam declaradamente "Em breve" (sem meio-termo).
- **SC-006**: O bloco "Outros cadastros fiscais" mostra contagem real e correta, verificável comparando com o número de registros cadastrados nas telas de origem (Informações adicionais, Naturezas de operação).

## Assumptions

- O grupo de ICMS de teste ("TESTE QA - pode excluir") deixado no ambiente pelo re-teste anterior é removido manualmente após o `DELETE` voltar a funcionar em produção — não é trabalho de código desta feature, é housekeeping pós-deploy.
- O gate de deploy proposto no achado N2 ("a UI nova não deveria subir antes da API que ela consome") é reportado como recomendação de processo; se o pipeline de CI/CD não suportar deploy condicionado automaticamente dentro do escopo desta feature, a mitigação aceita é documentar o procedimento manual correto (ordem de deploy) no `AGENTS.md` correspondente.
- "Vendas e base de cálculo" e "Outras configurações" (13 dos 15 campos do achado N6) ficam fora de escopo por decisão explícita do usuário — incluindo "Envio automático de XML/DANFE ao cliente", que também dependeria de um serviço de e-mail inexistente (mesma limitação já assumida em "Histórico de Envios" do Facilita NF-e).
- A extensão do teste de auditoria de permissões (FR-002) cobre apenas `services/fiscal-api` (onde o defeito ocorreu); não se estende a `erp-api`/`admin-api` nesta feature.
