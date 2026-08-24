# Feature Specification: Tela Fiscal — Certificado Digital A1

**Feature Branch**: `010-fiscal-certificate-screen`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: tela "Fiscal" do erp-web (Configurações) para cadastro e acompanhamento do certificado digital A1 (.pfx/.p12) da empresa, consumindo a services/fiscal-api já implementada.

## Clarifications

### Session 2026-08-13

- Q: FR-009 exige dizer qual dado falta e onde completar — hoje isso é só texto num toast ("Complete em Configurações › Unidades e filiais"), sem link, o que confundiu um usuário real (foi procurar em Dados da Empresa, cadastro diferente). O que a tela deve fazer? → A: A mensagem de "dados faltando" (FR-009/FR-012e) DEVE incluir um link/ação que navega diretamente para a edição da filial matriz em Unidades e filiais — não só citar o caminho em texto.
- Q: A aba "Dados da Empresa" (`company-settings`) tem "Endereço da empresa"/"Contato financeiro" desabilitados sem nenhuma explicação de que o endereço fiscal real vem da filial matriz — deve ganhar um aviso? → A: Sim — a seção "Endereço da empresa" desabilitada ganha uma nota explicando que o endereço usado na emissão fiscal vem do cadastro da filial matriz, com link para lá.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enviar o primeiro certificado digital (Priority: P1)

O lojista acessa **Configurações → Fiscal** pela primeira vez. A loja ainda não tem um Emitente cadastrado na parte fiscal. Ele vê um cartão de estado vazio explicando que nenhum certificado foi enviado e um botão "Inserir certificado". Ao clicar, um modal permite selecionar o arquivo `.pfx`/`.p12` (arrastar ou clicar), digitar a senha e, opcionalmente, um apelido. Ao confirmar, o sistema cria automaticamente o Emitente (a partir dos dados da filial matriz) e registra o certificado — sem que o lojista precise preencher nenhum cadastro de empresa à parte.

**Why this priority**: É o caminho que habilita toda a emissão fiscal. Sem certificado válido, nenhuma nota pode ser assinada. É o mínimo que entrega valor: uma loja nova consegue ficar apta a emitir.

**Independent Test**: Com uma loja sem Emitente e uma filial matriz completa, enviar um `.pfx` válido com a senha correta. A tela passa a exibir o certificado vigente sem recarregar a página.

**Acceptance Scenarios**:

1. **Given** loja sem Emitente e filial matriz com todos os dados obrigatórios, **When** o lojista envia um `.pfx` válido com a senha correta, **Then** o Emitente é criado automaticamente, o certificado é registrado e a tela mostra o certificado vigente (CNPJ do titular, validade, dias restantes, status VÁLIDO) sem recarregar.
2. **Given** loja sem Emitente, **When** o lojista abre a tela, **Then** vê o estado vazio com o botão "Inserir certificado" (e não um formulário de cadastro de empresa).
3. **Given** modal de upload aberto, **When** o lojista não seleciona arquivo ou deixa a senha em branco, **Then** o envio é bloqueado com mensagem inline indicando o campo faltante, sem chamar o servidor.

---

### User Story 2 - Acompanhar o certificado vigente e o histórico (Priority: P2)

O lojista que já enviou um ou mais certificados acessa a tela para conferir qual está valendo, quando vence e se precisa renovar. Vê um cartão do certificado vigente com destaque visual quando falta pouco para vencer ("vence em breve") ou quando já venceu ("vencido"), e uma lista somente-leitura dos demais certificados enviados.

**Why this priority**: Evita a surpresa de descobrir o vencimento só quando uma nota é rejeitada. É acompanhamento, não habilitação — por isso vem depois do envio.

**Independent Test**: Com um Emitente que tem 2+ certificados, abrir a tela e conferir que o vigente aparece em destaque e os demais aparecem em lista somente-leitura, com o de vencimento próximo sinalizado.

**Acceptance Scenarios**:

1. **Given** Emitente com um certificado VÁLIDO, **When** a tela carrega, **Then** o cartão do vigente mostra CNPJ do titular, validade (de/até), dias restantes e chip de status.
2. **Given** certificado a menos de 30 dias do vencimento, **When** a tela carrega, **Then** ele é sinalizado visualmente como "vence em breve".
3. **Given** certificado com validade já expirada, **When** a tela carrega, **Then** ele é sinalizado como "vencido".
4. **Given** Emitente com múltiplos certificados, **When** a tela carrega, **Then** os não vigentes aparecem em lista somente-leitura (nome, CNPJ, validade, status, data de envio), sem botão "Ativar" nem "Excluir".

---

### User Story 3 - Substituir/renovar certificado (Priority: P3)

Com um certificado prestes a vencer ou já vencido, o lojista envia um novo `.pfx`. O novo passa a ser o vigente (vale sempre o VÁLIDO mais recente); o anterior desce para o histórico. Não há ação de "ativar" um certificado antigo.

**Why this priority**: Continuidade da operação ao longo do tempo. Depende de US1 já existir.

**Independent Test**: Com um Emitente que já tem certificado, enviar outro `.pfx` válido e confirmar que o vigente exibido passa a ser o recém-enviado e o anterior aparece no histórico.

**Acceptance Scenarios**:

1. **Given** Emitente com um certificado vigente, **When** o lojista envia um novo `.pfx` válido, **Then** o novo vira o vigente e o anterior aparece no histórico, sem recarregar a página.

---

### Edge Cases

- **Loja sem `platformStoreId`** (organização não provisionada por evento de plataforma): não é possível criar o Emitente. A tela exibe um aviso claro de que a loja ainda não está habilitada para a parte fiscal e orienta o próximo passo, em vez de deixar o botão de upload falhar de forma opaca.
- **Filial matriz com regime MEI ou ISENTO** (não suportados pela fiscal-api): o provisionamento é bloqueado com mensagem clara indicando o regime incompatível — nunca mapeado silenciosamente para outro regime.
- **Filial matriz com dado obrigatório faltando** (ex.: código do município, endereço, inscrição): o provisionamento falha com mensagem dizendo **qual** dado falta, e a mensagem inclui um **link/ação que navega diretamente** para a edição da filial matriz em Unidades e filiais (não só citar o caminho em texto — achado real: usuário confundiu com a aba "Dados da Empresa", que é um cadastro diferente e sem relação com o Emitente fiscal).
- **CNPJ do certificado ≠ CNPJ do Emitente**: mensagem comparando os dois documentos (é o erro mais provável na operação real).
- **Senha incorreta / arquivo corrompido / certificado já expirado no upload**: mensagem de negócio distinta por caso, sem stack trace nem código HTTP cru.
- **Arquivo com extensão ≠ .pfx/.p12, vazio, acima de 10 MB, ou assinatura binária inválida**: rejeitado com mensagem específica.
- **Filial com CNPJ próprio distinto do da matriz**: cada CNPJ exige um Emitente distinto (`cnpj` e `storeId` são únicos). Nesta entrega só se provisiona o Emitente da matriz; o limite é declarado ao usuário quando aplicável.
- **Perda de conexão durante o upload**: o modal mantém o estado e mostra erro acionável, permitindo nova tentativa sem reabrir tudo.

## Requirements *(mandatory)*

### Functional Requirements

**Tela e navegação**

- **FR-001**: A tela DEVE ocupar o item de menu já existente "Fiscal" (Configurações → Fiscal), substituindo a página placeholder atual. Nenhum item de menu, hub ou sub-rota novo é criado.
- **FR-002**: A página DEVE nascer estruturada para receber outras seções fiscais no futuro, mas nesta entrega expõe apenas a seção de Certificado Digital.
- **FR-003**: O acesso à tela e a todas as ações de certificado DEVE respeitar a permissão de gestão de certificados; usuário sem a permissão não vê nem executa as ações.

**Estado vazio e provisionamento do Emitente**

- **FR-004**: Quando a loja não tem Emitente, a tela DEVE exibir um estado vazio com o botão "Inserir certificado".
- **FR-005**: Ao enviar o primeiro certificado sem Emitente existente, o sistema DEVE criar o Emitente automaticamente a partir dos dados da **filial matriz**, sem exigir um formulário de cadastro de empresa do usuário.
- **FR-006**: O provisionamento do Emitente DEVE usar como fonte os dados da filial matriz (CNPJ, razão social, nome fantasia, inscrição estadual, inscrição municipal, regime tributário, endereço completo) e o identificador de loja da plataforma da organização; o ambiente padrão do Emitente DEVE ser homologação.
- **FR-007**: Se a organização não possui identificador de loja da plataforma, o sistema DEVE informar que a loja ainda não está habilitada para a parte fiscal e NÃO tentar criar o Emitente.
- **FR-008**: Se o regime tributário da filial matriz é incompatível com os regimes aceitos na parte fiscal (ex.: MEI, ISENTO), o sistema DEVE bloquear o provisionamento com mensagem clara sobre a incompatibilidade, sem substituir por um regime arbitrário.
- **FR-009**: Se falta um dado obrigatório na filial matriz para criar o Emitente, o sistema DEVE informar qual dado falta, sem criar um Emitente incompleto, e a mensagem DEVE incluir um link/ação que navega diretamente para a edição da filial matriz em Unidades e filiais (não bastando citar o caminho em texto — ver Clarifications).

**Envio de certificado**

- **FR-010**: O usuário DEVE poder enviar um certificado por um modal que aceita arquivo `.pfx`/`.p12` (arrastar-e-soltar e clique), senha (obrigatória) e apelido/nome (opcional).
- **FR-011**: O sistema DEVE validar no cliente, antes de enviar, a presença do arquivo e da senha, bloqueando o envio com mensagem inline quando faltarem.
- **FR-012**: Cada família de falha do envio DEVE produzir uma mensagem de negócio distinta e acionável: (a) arquivo ausente/senha em branco; (b) extensão inválida / arquivo vazio / acima de 10 MB / assinatura binária inválida; (c) senha incorreta / certificado corrompido / certificado expirado; (d) CNPJ do certificado divergente do CNPJ do Emitente (mensagem comparando os dois); (e) falha ao provisionar o Emitente por dado faltante.
- **FR-013**: Nenhuma mensagem de erro DEVE expor stack trace, código HTTP cru ou detalhe técnico interno.
- **FR-014**: Após um envio bem-sucedido, a tela DEVE refletir o novo estado (certificado vigente e histórico) sem recarregar a página.

**Certificado vigente e histórico**

- **FR-015**: A tela DEVE exibir o certificado vigente com CNPJ do titular, validade (de/até), dias restantes até o vencimento e chip de status.
- **FR-016**: Um certificado a menos de 30 dias do vencimento DEVE ser sinalizado visualmente como "vence em breve"; um certificado já vencido DEVE ser sinalizado como "vencido".
- **FR-017**: Os certificados não vigentes DEVEM aparecer em uma lista **somente-leitura** (nome, CNPJ, validade, status, data de envio), sem ação de "ativar" nem de "excluir".
- **FR-018**: O certificado que vale para assinatura é sempre o VÁLIDO mais recente; substituir/renovar significa enviar um novo certificado (não há seleção manual de qual certificado usar).

**Segurança**

- **FR-019**: A senha do certificado NÃO DEVE trafegar em query string, nem ser gravada em log, cache de dados do cliente, localStorage ou sessionStorage; ela vive apenas no estado do formulário e é descartada após o envio.
- **FR-020**: O sistema NUNCA DEVE exibir de volta a senha nem qualquer identificador de armazenamento do arquivo do certificado.

**Consolidação da UI (remoção de duplicidade)**

- **FR-021**: A seção mock de "Certificado digital (NF-e)" existente na aba de uso da empresa DEVE ser removida e substituída por um atalho para a tela Fiscal, de modo que o certificado tenha um único dono na aplicação.
- **FR-022**: A seção "Endereço da empresa" desabilitada na aba Dados da Empresa (`company-settings`) DEVE trazer uma nota explicando que o endereço usado para provisionar o Emitente fiscal vem do cadastro da **filial matriz** (Configurações › Unidades e filiais), com link direto para lá — evita o usuário procurar/tentar editar o endereço fiscal num cadastro sem relação com a emissão (ver Clarifications).

### Key Entities *(include if feature involves data)*

- **Certificado Digital**: representa um certificado A1 enviado para um Emitente. Atributos relevantes ao usuário: apelido/nome, CNPJ do titular, validade (início/fim), status (aguardando validação, válido, expirado, inválido, revogado), dias até o vencimento, data de envio. Nunca expõe a senha nem o local de armazenamento do arquivo.
- **Emitente (empresa fiscal)**: a empresa perante o fisco, associada a uma loja da plataforma. Criada automaticamente a partir da filial matriz quando ainda não existe. Um Emitente por CNPJ e por loja.
- **Filial matriz**: fonte dos dados cadastrais usados para provisionar o Emitente (CNPJ, razão social, inscrições, regime, endereço). Já existe no cadastro da organização.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma loja sem Emitente, com filial matriz completa, consegue concluir o envio do primeiro certificado inteiramente dentro da tela Fiscal, sem nenhum passo manual fora dela.
- **SC-002**: Após um envio bem-sucedido, o certificado vigente aparece na tela sem que o usuário precise recarregar a página.
- **SC-003**: Cada uma das cinco famílias de falha (arquivo, senha, expirado, CNPJ divergente, Emitente sem dados) produz uma mensagem distinta e acionável — verificável por teste, uma mensagem diferente por família.
- **SC-004**: Um certificado a menos de 30 dias do vencimento é sinalizado visualmente em 100% dos casos.
- **SC-005**: A senha do certificado não aparece em nenhum ponto observável (URL, armazenamento do navegador, cache de dados) — verificável por inspeção e por teste.
- **SC-006**: Após a entrega, existe um único ponto na aplicação para gerenciar o certificado (a seção mock anterior deixa de existir).
- **SC-007**: A mensagem de "dado obrigatório faltando na filial matriz" leva o usuário à edição da filial matriz em no máximo um clique a partir do próprio erro — verificável por teste (clicar no link/ação da mensagem navega para `Unidades e filiais`).
- **SC-008**: A seção "Endereço da empresa" da aba Dados da Empresa deixa claro, sem precisar de suporte, que aquele não é o endereço usado na emissão fiscal.

## Assumptions

- A services/fiscal-api (módulo de certificados e criação de Emitente) já está implementada e **não** será alterada nesta entrega; o contrato de upload aceita `.pfx`/`.p12` até 10 MB e um certificado aceito nasce com status VÁLIDO.
- A filial matriz é identificável no cadastro da organização e carrega os dados cadastrais necessários (exceto o código do município IBGE, cuja origem será decidida no plano).
- O identificador de loja da plataforma da organização precisa ser exposto para o front (única alteração de backend prevista, no presenter de organizações da erp-api).
- O ambiente padrão do Emitente nesta entrega é homologação.
- A referência visual de layout é a tela de certificado do produto de referência (cards com título, descrição e ação à direita).

## Fora de escopo

- Card "Comprar Certificado" / "Ver solicitações" — não há backend de compra no Citybox.
- Excluir/revogar certificado — a fiscal-api não expõe essa operação.
- Certificado A3 (token/cartão) — a fiscal-api trata apenas A1.
- Tela dedicada de cadastro/edição de Emitente — entrega futura.
- Demais assuntos fiscais da tela (parâmetros, séries, notas) — a página nasce só com certificado.

## Riscos conhecidos (a resolver no plano)

1. **Origem do `cityCodeIbge`** (código IBGE de 7 dígitos, obrigatório para criar o Emitente) — não há esse dado no cadastro da filial, que só tem cidade e UF. É o maior risco aberto; a origem (tabela IBGE estática, derivação por CEP ou novo campo na filial) será decidida no `/speckit-plan`.
2. **Regimes MEI/ISENTO** aceitos pela filial mas inexistentes na fiscal-api — comportamento definido: bloquear com mensagem (FR-008).
3. **`platformStoreId` nullable** — comportamento definido: avisar que a loja não está habilitada (FR-007).
4. **`Company.cnpj` e `Company.storeId` únicos** — filiais com CNPJ próprio exigirão Emitentes distintos; limite declarado nesta entrega.
