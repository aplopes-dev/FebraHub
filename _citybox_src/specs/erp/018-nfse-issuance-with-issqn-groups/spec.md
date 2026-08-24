# Feature Specification: Emissão de NFS-e com Grupos de ISSQN

**Feature Branch**: `018-nfse-issuance-with-issqn-groups`

**Created**: 2026-08-13

**Status**: Draft

**Input**: Menu Fiscal 018 — "Grupo ISSQN" (`specs/005-nfce-cupom-fiscal/contracts/MenuFiscal/Grupo ISSQN.txt`)

## Contexto

A `fiscal-api` já emite NFS-e pelo Padrão Nacional (Sefin Nacional), validado contra o
órgão real — mas **nenhum app do monorepo aciona** essa emissão. Esta feature liga o ERP à
emissão de NFS-e e entrega, no caminho, o cadastro de **Grupos de ISSQN** (perfil fiscal
reutilizável do serviço: códigos, alíquota e exigibilidade). É maior que as irmãs de grupos
fiscais (ICMS/IPI/PIS-COFINS): além do cadastro, cria a integração `erp-api → fiscal-api` e
uma tela de emissão própria.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar Grupos de ISSQN (Priority: P1)

O lojista cadastra um "Grupo do ISSQN" reunindo os dados fiscais de um tipo de serviço que
ele presta com frequência: nome, código municipal do serviço (`NN.NN`, LC 116), código de
tributação nacional (`cTribNac`, 6 dígitos), alíquota do ISS (%) e o indicador de
exigibilidade do ISS. Depois pode listar e editar os grupos. O grupo pertence à organização
e vale para todas as unidades.

**Why this priority**: É o alicerce reutilizável — sem o grupo, cada emissão exigiria
redigitar código de 6 dígitos e alíquota. É entregável e testável sozinho (CRUD), como as
features 015/016 provaram.

**Independent Test**: Criar um grupo, recarregar a lista e reabrir para edição — os dados
persistem e voltam corretos. Não depende da emissão.

**Acceptance Scenarios**:

1. **Given** a aba de Grupos de ISSQN vazia, **When** o lojista clica "Novo Grupo do ISSQN",
   preenche nome/código municipal/cTribNac/alíquota/exigibilidade e salva, **Then** o grupo
   aparece na lista e persiste após recarregar.
2. **Given** um grupo existente, **When** o lojista edita a alíquota e salva, **Then** o novo
   valor persiste e a lista reflete a mudança.
3. **Given** um formulário com alterações não salvas, **When** o lojista tenta sair, **Then**
   o sistema avisa sobre as alterações pendentes.
4. **Given** um `cTribNac` fora do formato de 6 dígitos, **When** o lojista tenta salvar,
   **Then** o sistema recusa com mensagem clara (o Sefin rejeita código inválido com E0310).

---

### User Story 2 - Emitir uma NFS-e de ponta a ponta (Priority: P2)

Numa tela de emissão própria, o lojista escolhe o tomador (cliente do cadastro), escolhe um
Grupo de ISSQN (que preenche códigos, alíquota e exigibilidade), descreve o serviço, informa
o valor e indica se há retenção de ISS. Ao confirmar (com confirmação explícita e indicação
do ambiente), a NFS-e é transmitida e o documento fica consultável. `tribISSQN` passa a vir
do grupo — não mais fixo em '1'.

**Why this priority**: É o valor central da feature — a primeira emissão fiscal de serviço
pelo ERP. Depende do cadastro (P1) para pré-preencher, mas a emissão em si é o entregável.

**Independent Test**: Com Emitente provisionado + certificado A1 + `nationalNfseEnabled`, em
HOMOLOGAÇÃO, escolher tomador e grupo, informar valor e emitir → a NFS-e é autorizada e
aparece consultável; o XML reflete o `tribISSQN` do grupo.

**Acceptance Scenarios**:

1. **Given** Emitente apto (provisionado, certificado válido, `nationalNfseEnabled=true`),
   **When** o lojista emite uma NFS-e escolhendo um grupo e informando valor **sem retenção**,
   **Then** a NFS-e é autorizada e o XML transmitido **não** contém `pAliq` (não-regressão
   E0625).
2. **Given** a mesma situação **com retenção** marcada, **When** emite, **Then** o XML contém
   `pAliq` com a alíquota do grupo e `tpRetISSQN` indicando retenção.
3. **Given** um Emitente sem `nationalNfseEnabled`, **When** o lojista abre a tela de emissão,
   **Then** o sistema explica que a emissão de NFS-e não está habilitada para o Emitente (não
   um erro genérico) e não permite transmitir.
4. **Given** uma emissão recusada pelo órgão com E0116 (IM não registrada no CNC), E0310
   (código nacional ausente/inválido) ou E0625 (alíquota sem retenção), **When** o erro
   retorna, **Then** a tela mostra a mensagem de negócio correspondente, não o código cru.
5. **Given** a tela de emissão preenchida, **When** o lojista clica emitir, **Then** o sistema
   exige confirmação explícita e deixa claro o ambiente (homologação × produção) antes de
   transmitir.
6. **Given** a mesma requisição reenviada (mesma operação), **When** transmitida de novo,
   **Then** a idempotência evita emitir uma segunda nota para a mesma operação.

---

### User Story 3 - Perfil fiscal do serviço no catálogo (Priority: P3)

Um item de serviço do catálogo pode apontar para um Grupo de ISSQN (`ProductFiscal.issqnGroupId`),
para que a emissão resolva item → grupo → valores sem redigitação. Na tela de emissão, escolher
o grupo (direto ou via item) preenche códigos, alíquota e exigibilidade.

**Why this priority**: Fecha a reutilização (item de serviço já traz o perfil fiscal), mas a
emissão funciona sem ele (escolha direta do grupo). Depende do campo `issqn` em `ProductFiscal`
(criado em 014/fiscal-default-taxes).

**Independent Test**: Vincular um grupo a um item de serviço, abrir a emissão a partir do item
e confirmar que códigos/alíquota/exigibilidade vêm preenchidos do grupo.

**Acceptance Scenarios**:

1. **Given** um item de serviço com `issqnGroupId` definido, **When** a emissão o resolve,
   **Then** os campos fiscais vêm do grupo.
2. **Given** um grupo excluído que estava vinculado a itens, **When** o vínculo é resolvido,
   **Then** o item fica sem grupo (não quebra) e a emissão exige escolha explícita.

### Edge Cases

- **Emitente sem certificado A1 válido**: a tela detecta e explica (não deixa transmitir).
- **Alíquota digitada sem retenção**: a tela deixa **explícito** que o valor serve só para
  exibição/conferência (valor líquido/DANFSe) e **não** é transmitido (`pAliq` omitido).
- **Exigibilidade não suportada nesta fatia** (exportação, suspensões judicial/administrativa):
  aparece **indisponível no select, com o motivo**.
- **`cTribNac` ausente**: emissão derivaria do municipal e o Sefin rejeita (E0310) — o cadastro
  exige o código nacional.
- **IM não registrada no CNC do município** (E0116): pré-requisito **operacional** (não de
  código, não resolvido trocando certificado) — a tela traduz o erro e a spec o declara.
- **Falha transitória do órgão** vs. **recusa definitiva**: a tela distingue "tente de novo" de
  "corrija o dado".

## Requirements *(mandatory)*

### Functional Requirements

**Cadastro de Grupos de ISSQN (US1)**

- **FR-001**: O sistema MUST permitir criar, listar e editar Grupos de ISSQN por organização
  (válidos para todas as unidades; sem checkbox de compartilhamento).
- **FR-002**: Um Grupo de ISSQN MUST ter: nome, código municipal do serviço (`NN.NN`, LC 116),
  código de tributação nacional (`cTribNac`, 6 dígitos), alíquota do ISS (%) e indicador de
  exigibilidade do ISS (`tribISSQN`).
- **FR-003**: O sistema MUST validar o formato do código municipal (`NN.NN`) e do `cTribNac`
  (6 dígitos) no cadastro, recusando valores fora do formato com mensagem clara.
- **FR-004**: O indicador de exigibilidade MUST oferecer, nesta fatia, "Exigível" mais os
  indicadores que não exigem campos adicionais no schema nacional (a confirmar no plan contra
  o XSD — provavelmente não incidência, imunidade e isenção); os demais (exportação, suspensões)
  aparecem **indisponíveis com o motivo**.
- **FR-005**: O sistema MUST tratar o indicador de incentivo fiscal (`indIncentivo`) conforme
  decisão do plan (entra, ou fica indisponível com o motivo — hoje o builder não o emite).
- **FR-006**: O cadastro MUST ter salvamento explícito e avisar ao sair com alterações
  pendentes.

**Emissão de NFS-e (US2)**

- **FR-007**: O sistema MUST oferecer uma tela de emissão de NFS-e onde o lojista escolhe o
  tomador (cliente de `/v1/customers`), escolhe um Grupo de ISSQN (que preenche códigos,
  alíquota e exigibilidade), descreve o serviço, informa o valor e indica se há retenção.
- **FR-008**: A emissão MUST transmitir o `tribISSQN` vindo do grupo (não mais fixo em '1').
- **FR-009 (NÃO-REGRESSÃO)**: A emissão MUST **omitir `pAliq`** quando não há retenção (a
  alíquota só é transmitida quando `issWithheld=true`); sem retenção quem define a alíquota é o
  município (rejeição E0625 não pode voltar).
- **FR-010**: A tela MUST deixar **explícito** quando a alíquota digitada é transmitida (com
  retenção) e quando não é (sem retenção — valor só para exibição/conferência).
- **FR-011**: O `erp-api` MUST gerar `idempotencyKey`, `externalReference` e `sourceSystem` e
  **registrar o vínculo** entre o documento fiscal emitido e a operação do ERP.
- **FR-012**: A emissão MUST ser idempotente: reenviar a mesma operação não emite uma segunda
  nota.
- **FR-013**: O sistema MUST detectar e explicar de forma acionável (não erro genérico) quando
  o Emitente não tem `nationalNfseEnabled`, não tem certificado A1 válido, ou a IM não está no
  CNC (E0116).
- **FR-014**: A tela MUST traduzir os erros do órgão em mensagem de negócio (E0116, E0310,
  E0625 e demais), nunca código cru.
- **FR-015**: A emissão MUST exigir confirmação explícita antes de transmitir e deixar claro o
  ambiente em uso (homologação × produção).
- **FR-016**: O documento fiscal emitido MUST ficar consultável após a autorização.

**Catálogo / resolução (US3)**

- **FR-017**: Um item de serviço do catálogo MAY apontar para um Grupo de ISSQN
  (`ProductFiscal.issqnGroupId`), dependente do campo `issqn` de `ProductFiscal` (criado em
  014). A resolução item → grupo → valores alimenta a emissão.

**Segurança**

- **FR-018**: **Emitir** NFS-e MUST exigir permissão própria no `erp-api`, **distinta** da
  permissão de **cadastro** dos grupos. As duas MUST ser nomeadas explicitamente (cadastro:
  gestão de catálogo/fiscal; emissão: permissão de emissão fiscal de alto impacto).

### Key Entities

- **Grupo de ISSQN**: perfil fiscal reutilizável de um serviço, por organização. Atributos:
  nome, código municipal (`NN.NN`), código nacional (`cTribNac`, 6 díg.), alíquota ISS (%),
  exigibilidade (`tribISSQN`), (talvez) incentivo fiscal. Relaciona-se com itens de serviço do
  catálogo via `ProductFiscal.issqnGroupId`.
- **Emissão de NFS-e (documento fiscal + vínculo)**: o documento fiscal emitido pela `fiscal-api`
  (chave, protocolo, status, ambiente) e o **vínculo** com a operação do ERP
  (`sourceSystem`/`externalReference`/`idempotencyKey`), registrado no `erp-api`.
- **Tomador**: cliente de `/v1/customers` (documentType CPF|CNPJ, documento, nome, e-mail,
  endereço) — reutilizado, não recriado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Criar, listar e editar um Grupo de ISSQN persiste e recarrega correto.
- **SC-002**: Escolher o grupo na tela de emissão preenche códigos, alíquota e exigibilidade.
- **SC-003**: Uma NFS-e é emitida de ponta a ponta em HOMOLOGAÇÃO, com `tribISSQN` vindo do
  grupo (não mais fixo em '1'), e o documento aparece consultável.
- **SC-004 (NÃO-REGRESSÃO)**: Emissão **sem retenção** continua **sem `pAliq`** no XML (a
  rejeição E0625 não volta).
- **SC-005**: Emitente sem `nationalNfseEnabled`, sem certificado ou sem IM no CNC produz
  mensagem específica e acionável, não erro genérico.
- **SC-006**: A tela deixa explícito quando a alíquota digitada é transmitida e quando não é.
- **SC-007**: Reenviar a mesma operação não gera uma segunda NFS-e (idempotência verificável).

## Assumptions

- **Pré-requisito operacional (produção)**: a emissão real em Ilhéus exige a **IM da empresa
  registrada no CNC do município** (senão E0116). É pré-requisito **operacional**, não de
  código, e não se resolve trocando certificado — declarado por afetar o sucesso em produção.
  A entrega valida em **HOMOLOGAÇÃO**.
- **Dependências resolvidas**: Emitente (`Company`) provisionado (fiscal-certificate-screen);
  `nationalNfseEnabled=true` no Emitente; certificado A1 válido; campo `issqn` em `ProductFiscal`
  (014/fiscal-default-taxes).
- **Arquitetura herdada**: quem monta o pedido (erp-api) resolve item → grupo → valores e envia
  prontos; a `fiscal-api` **não conhece grupos fiscais** (recebe `IssueNfseDto` já resolvido).
- **Ancoragem em Vendas/OS fora de escopo**: ambos ainda usam mock no erp-web; a tela de emissão
  é a base sobre a qual plugam depois.
- **Localização (a fechar no plan)**: cadastro de grupos em `/configuracoes/fiscal` (abas, aba
  na URL — mesma resposta de ICMS/IPI/PIS-COFINS); tela de emissão **não** é configuração
  (provavelmente sob Vendas ou Finanças, com item novo em `navigation.ts`).

## Out of Scope

- Ancoragem em Vendas e Ordem de Serviço.
- ISSQN em NF-e modelo 55 (serviço sai por NFS-e).
- Cálculo de transparência tributária (`totTrib`), hoje zerado por falta de tabela IBPT
  (pendência conhecida e independente).
- Cancelamento e substituição de NFS-e (existem na fiscal-api; entrega própria).
