# Feature Specification: Emissão de Documentos Fiscais (fiscal-api)

**Feature Branch**: `002-fiscal-api`

**Created**: 2026-08-04

**Status**: Draft

**Input**: User description: "Desenvolvimento da API Fiscal (NestJS) — API independente `fiscal-api`, altamente modular e escalável, responsável pela emissão de NF-e (Nota Fiscal Eletrônica) e NFS-e (Nota Fiscal de Serviço Eletrônica) para o projeto CityBox, funcionando como microserviço que poderá futuramente ser usado por qualquer sistema além do CityBox. NF-e com integração direta à SEFAZ (geração de XML, validação XSD, assinatura digital, comunicação SOAP, transmissão, consulta, cancelamento, carta de correção, inutilização, armazenamento do XML autorizado, DANFE em etapa posterior), sempre em ambiente de homologação durante o desenvolvimento. NFS-e usando exclusivamente o Padrão Nacional, com foco inicial no município de Ilhéus-BA e arquitetura extensível para outros municípios sem alterar as regras de domínio já existentes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Emitir NF-e de uma venda de produtos (Priority: P1)

Uma empresa emissora (lojista da plataforma CityBox) precisa formalizar a venda de produtos perante o fisco. O sistema recebe os dados da venda, gera o documento fiscal eletrônico, valida, assina digitalmente e transmite à Secretaria da Fazenda (SEFAZ), retornando o protocolo de autorização e disponibilizando o XML autorizado para consulta futura.

**Why this priority**: É o principal documento fiscal exigido para vendas de produtos e o motivo central de existir da API — sem ele, nenhuma venda de mercadoria pode ser formalizada perante o fisco.

**Independent Test**: Pode ser testado de forma isolada enviando uma requisição de emissão com dados válidos de emitente, destinatário e itens em ambiente de homologação, e verificando que o documento retorna com protocolo de autorização (ou rejeição justificada) e XML disponível para download.

**Acceptance Scenarios**:

1. **Given** um emitente com certificado digital válido e dados completos de itens/destinatário, **When** uma emissão de NF-e é solicitada, **Then** o sistema gera o XML, valida contra o schema oficial, assina digitalmente, transmite à SEFAZ (homologação) e retorna o protocolo de autorização junto ao XML autorizado.
2. **Given** dados de emissão incompletos ou inválidos (ex.: item sem valor, destinatário sem documento), **When** a emissão é solicitada, **Then** o sistema rejeita a solicitação antes de transmitir à SEFAZ e retorna as inconsistências encontradas.
3. **Given** um documento já emitido e autorizado, **When** o emitente consulta o status desse documento, **Then** o sistema retorna o status atual, o protocolo e o XML autorizado.

---

### User Story 2 - Emitir NFS-e para prestação de serviço em Ilhéus/BA (Priority: P2)

Uma empresa emissora prestadora de serviço em Ilhéus/BA precisa formalizar a prestação de um serviço perante o fisco municipal. O sistema gera o documento conforme o Padrão Nacional da NFS-e, valida, assina e transmite, retornando o protocolo e disponibilizando o documento autorizado.

**Why this priority**: É o segundo documento fiscal essencial da API (prestação de serviços) e o piloto definido para validar a arquitetura antes de expandir para outros municípios.

**Independent Test**: Pode ser testado de forma isolada enviando uma requisição de emissão de NFS-e com dados válidos de um prestador cadastrado em Ilhéus/BA em ambiente de homologação, e verificando que o documento retorna com protocolo de autorização (ou rejeição justificada).

**Acceptance Scenarios**:

1. **Given** um emitente prestador de serviço cadastrado no município de Ilhéus/BA com certificado digital válido, **When** uma emissão de NFS-e é solicitada com os dados do serviço prestado, **Then** o sistema gera o documento conforme o Padrão Nacional, valida, assina, transmite e retorna o protocolo de autorização.
2. **Given** uma solicitação de NFS-e para um município ainda não suportado, **When** a emissão é solicitada, **Then** o sistema rejeita a solicitação informando que o município não está habilitado.

---

### User Story 3 - Gerenciar certificado digital do emitente (Priority: P3)

Um operador administrativo/fiscal da empresa emissora precisa cadastrar o certificado digital (A1) que será usado para assinar os documentos fiscais dessa empresa, garantindo que ele seja validado e armazenado com segurança antes de qualquer emissão.

**Why this priority**: É pré-requisito técnico-legal para qualquer emissão (NF-e ou NFS-e) — sem certificado válido cadastrado, nenhum documento pode ser assinado — mas entrega valor demonstrável de forma independente (upload + validação do certificado).

**Independent Test**: Pode ser testado de forma isolada fazendo upload de um certificado A1 (.pfx) válido com sua senha, e verificando que o sistema confirma a validade, extrai os dados do titular (CNPJ, validade) e armazena o certificado de forma segura, sem nunca expor a senha em claro.

**Acceptance Scenarios**:

1. **Given** um arquivo de certificado A1 (.pfx) válido e sua senha, **When** o operador faz o upload, **Then** o sistema valida o certificado, associa-o ao emitente correspondente e confirma que ele está pronto para uso em assinaturas.
2. **Given** um certificado inválido, corrompido, com senha incorreta ou expirado, **When** o operador tenta fazer o upload, **Then** o sistema rejeita o certificado e informa o motivo, sem associá-lo a nenhum emitente.
3. **Given** um certificado prestes a expirar (dentro da janela de alerta), **When** uma tentativa de emissão é feita, **Then** o sistema sinaliza o vencimento próximo ao emitente.

---

### User Story 4 - Consultar, cancelar, corrigir e inutilizar documentos fiscais (Priority: P4)

Um operador administrativo/fiscal precisa gerenciar o ciclo de vida de documentos já emitidos: consultar o status, cancelar um documento dentro do prazo legal, emitir carta de correção para ajustes permitidos por lei, ou inutilizar uma faixa de numeração não utilizada.

**Why this priority**: É a operação de manutenção do ciclo de vida fiscal — necessária para correção de erros operacionais, mas depende das User Stories 1 e 2 já existirem (não há o que cancelar/corrigir sem uma emissão prévia).

**Independent Test**: Pode ser testado de forma isolada emitindo um documento em homologação e, em seguida, executando cada operação (consulta, cancelamento, carta de correção, inutilização) e verificando o retorno do protocolo correspondente de cada operação.

**Acceptance Scenarios**:

1. **Given** um documento fiscal autorizado dentro do prazo legal de cancelamento, **When** o cancelamento é solicitado com uma justificativa, **Then** o sistema transmite o cancelamento ao órgão competente e atualiza o status do documento para cancelado.
2. **Given** um documento fiscal autorizado fora do prazo legal de cancelamento, **When** o cancelamento é solicitado, **Then** o sistema rejeita a solicitação informando que o prazo expirou.
3. **Given** um documento de NF-e autorizado com um erro em campo passível de correção, **When** uma carta de correção é solicitada com o texto da correção, **Then** o sistema transmite a carta de correção e a associa ao documento original.
4. **Given** uma faixa de numeração não utilizada de um emitente, **When** a inutilização é solicitada com justificativa, **Then** o sistema transmite a inutilização ao órgão competente e impede o uso futuro dessa faixa.

---

### Edge Cases

- O que acontece quando a SEFAZ ou o ambiente nacional da NFS-e está indisponível ou expira o tempo de resposta durante a transmissão?
- Como o sistema trata uma rejeição do órgão fiscal (erros de validação de negócio) — a solicitação pode ser corrigida e reenviada, e o solicitante recebe o motivo detalhado da rejeição?
- O que acontece quando o certificado digital do emitente expira entre o cadastro e o momento da emissão?
- Como o sistema evita a emissão duplicada de um documento fiscal para a mesma venda/pedido (idempotência)?
- O que acontece quando um cancelamento, carta de correção ou inutilização é solicitado fora da janela de tempo permitida por lei?
- Como o sistema trata uma solicitação de carta de correção para um campo que a legislação não permite corrigir (ex.: valores, partes envolvidas)?
- O que acontece quando uma inutilização é solicitada para uma faixa de numeração que já contém documentos autorizados?
- Como o sistema trata solicitações concorrentes de emissão para o mesmo emitente na mesma numeração/série?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE gerar, validar (contra o schema oficial), assinar digitalmente e transmitir documentos de NF-e à SEFAZ em nome do emitente, retornando o protocolo de autorização ou o motivo da rejeição.
- **FR-002**: O sistema DEVE gerar, validar, assinar digitalmente e transmitir documentos de NFS-e conforme o Padrão Nacional para emitentes do município de Ilhéus/BA, retornando o protocolo de autorização ou o motivo da rejeição.
- **FR-003**: O sistema DEVE permitir a consulta do status atual (pendente, autorizado, rejeitado, cancelado, inutilizado) de qualquer documento fiscal previamente solicitado, tanto NF-e quanto NFS-e.
- **FR-004**: O sistema DEVE permitir o cancelamento de um documento fiscal autorizado, exigindo justificativa, apenas dentro do prazo legal aplicável ao tipo de documento.
- **FR-005**: O sistema DEVE permitir a emissão de carta de correção para NF-e autorizadas, para os campos permitidos por lei, mantendo o histórico de correções associado ao documento original.
- **FR-006**: O sistema DEVE permitir a inutilização de faixas de numeração de NF-e não utilizadas, mediante justificativa, impedindo seu uso futuro.
- **FR-007**: O sistema DEVE permitir o cadastro (upload), validação e armazenamento seguro de certificados digitais A1 por emitente, sem jamais expor a senha do certificado em texto claro em nenhuma interface, log ou resposta de API.
- **FR-008**: O sistema DEVE rejeitar qualquer solicitação de emissão cujo emitente não possua um certificado digital válido e vigente associado.
- **FR-009**: O sistema DEVE validar todo XML gerado contra o schema oficial correspondente antes de qualquer tentativa de transmissão, rejeitando documentos que falhem na validação.
- **FR-010**: O sistema DEVE armazenar de forma durável e recuperável todo XML de documento fiscal autorizado, para fins de auditoria e consulta futura.
- **FR-011**: O sistema DEVE registrar (log de auditoria) toda tentativa de transmissão, incluindo protocolo retornado e respostas de erro recebidas do órgão fiscal, para fins de rastreabilidade.
- **FR-012**: O sistema DEVE ser capaz de adicionar suporte à emissão de NFS-e para novos municípios no futuro sem alterar as regras de domínio já definidas para os municípios já suportados.
- **FR-013**: O sistema DEVE impedir a emissão duplicada de um documento fiscal para a mesma solicitação de origem (idempotência), retornando o documento já existente quando a mesma solicitação é repetida.
- **FR-014**: O sistema DEVE restringir o acesso aos dados e documentos fiscais de cada emitente apenas a solicitantes autorizados para aquele emitente.
- **FR-015**: O sistema DEVE, no v1, restringir o onboarding de novos emitentes às lojas/sistemas internos do CityBox (ERP, PDV, marketplace); o cadastro self-service de empresas/sistemas externos ao CityBox fica fora do escopo desta entrega, mas a arquitetura DEVE permitir habilitá-lo futuramente sem retrabalho nas regras de domínio já definidas.
- **FR-016**: Sistemas solicitantes (ex.: ERP, PDV, marketplace) DEVEM solicitar a emissão de um documento fiscal por meio de uma chamada síncrona de API, enviando no payload da requisição todos os dados necessários do documento (emitente, destinatário, itens/serviço, valores), e recebendo o resultado da emissão (protocolo de autorização ou motivo de rejeição) na resposta dessa mesma chamada.

### Key Entities *(include if feature involves data)*

- **Emitente (Empresa Emissora)**: Empresa em nome de quem os documentos fiscais são emitidos — CNPJ, razão social, inscrição estadual/municipal, regime tributário, município (relevante para NFS-e). Cada Loja da plataforma CityBox corresponde a um único Emitente próprio (relação 1:1 Loja ↔ Emitente/CNPJ); não há suporte, neste escopo, a múltiplas lojas compartilhando um mesmo Emitente (matriz/filial).
- **Certificado Digital**: Certificado A1 vinculado a um Emitente — data de validade, referência segura à credencial armazenada, status (válido/expirado/revogado).
- **Documento Fiscal**: Entidade base de NF-e ou NFS-e — tipo, status (pendente/validado/assinado/transmitido/autorizado/rejeitado/cancelado/inutilizado), número, série, protocolo, data de emissão, referência ao XML autorizado, emitente, destinatário.
- **Destinatário**: Parte que recebe o produto ou serviço — documento (CPF/CNPJ), nome, endereço.
- **Item/Serviço**: Linha de produto (NF-e) ou descrição de serviço prestado (NFS-e), com valores e tributos associados.
- **Carta de Correção**: Registro de correção vinculado a um Documento Fiscal original — texto da correção, sequência, protocolo de transmissão.
- **Cancelamento**: Registro vinculado a um Documento Fiscal — justificativa, data, protocolo de cancelamento.
- **Inutilização**: Registro de faixa de numeração inutilizada — emitente, série, faixa de números, justificativa, protocolo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em ambiente de homologação, uma solicitação de NF-e com dados válidos recebe protocolo de autorização (ou rejeição com motivo claro) em até 30 segundos.
- **SC-002**: Em ambiente de homologação, uma solicitação de NFS-e válida para Ilhéus/BA recebe protocolo de autorização (ou rejeição com motivo claro) em até 30 segundos.
- **SC-003**: 100% dos XMLs de documentos autorizados ficam disponíveis para consulta/download em até 5 segundos após o recebimento do protocolo de autorização.
- **SC-004**: 100% das solicitações de emissão com dados incompletos ou inválidos são rejeitadas antes de qualquer tentativa de transmissão ao órgão fiscal (nenhum XML inválido chega a ser transmitido).
- **SC-005**: 100% das solicitações de cancelamento dentro do prazo legal são processadas com sucesso em ambiente de homologação; 100% das solicitações fora do prazo são rejeitadas com mensagem explicando o motivo.
- **SC-006**: 100% dos certificados digitais inválidos, expirados ou com senha incorreta são rejeitados no momento do cadastro, antes de poderem ser usados em qualquer assinatura.
- **SC-007**: Solicitações repetidas para a mesma venda/pedido de origem não geram documentos fiscais duplicados em 100% dos casos testados.

## Assumptions

- O desenvolvimento e todos os testes de integração com SEFAZ e com o ambiente da NFS-e Padrão Nacional usarão exclusivamente ambiente de homologação/sandbox — nenhuma transmissão em produção faz parte deste escopo inicial.
- A geração do DANFE (representação visual da NF-e) fica fora do escopo desta especificação e será tratada em uma etapa posterior, conforme já indicado pelo solicitante.
- O suporte a municípios de NFS-e além de Ilhéus/BA fica fora do escopo de entrega inicial, mas a arquitetura de domínio deve permitir adicioná-los sem retrabalho nas regras já existentes (ver FR-012).
- Cada solicitação de emissão chega com todos os dados necessários do documento (emitente, destinatário, itens/serviço, valores) fornecidos pelo sistema solicitante — a API fiscal não depende de acessar diretamente as bases de dados de pedidos/vendas de outros sistemas da plataforma.
- Os prazos legais para cancelamento, carta de correção e inutilização seguem os prazos definidos pela legislação fiscal vigente para cada tipo de documento (ex.: janela de cancelamento de NF-e), sem necessidade de configuração adicional pelo usuário.
- O controle de acesso aos dados fiscais de cada emitente reaproveita o mesmo modelo de autenticação/autorização já usado pela plataforma para os clientes internos do CityBox (login corporativo via Keycloak propagado por token); um modelo de autenticação para clientes externos ao CityBox (ex.: API keys por cliente) fica fora do escopo do v1 e será definido quando essa capacidade for habilitada (ver FR-015).
