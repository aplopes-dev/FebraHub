# Feature Specification: Emissão de NFS-e pelo Padrão Nacional (Sefin Nacional / ADN)

**Feature Branch**: `003-nfse-padrao-nacional`

**Created**: 2026-08-05

**Status**: Draft

**Input**: User description: "NFSe a partir do padrão nacional, já confirmei que Ilhéus aderiu ao padrão nacional"

## Contexto e motivação

A `fiscal-api` já emite NF-e de produto (SEFAZ-BA). A emissão de NFS-e foi desenhada na entrega
anterior ([specs/002-fiscal-api](../002-fiscal-api/spec.md)) assumindo integração com o sistema
municipal próprio de Ilhéus (MetropolisWeb/POLIS), e ficou parada como stub à espera de confirmação
formal do município sobre protocolo, autenticação e leiaute.

Essa premissa caiu. **Ilhéus aderiu ao Sistema Nacional da NFS-e** e a emissão passa a ocorrer
exclusivamente pelo padrão nacional (confirmado pelo usuário em 2026-08-05). O modelo é
estruturalmente diferente do que estava desenhado:

- o contribuinte **não emite a NFS-e** — ele emite uma **DPS** (Declaração de Prestação de Serviços)
  assinada, e o ambiente nacional **valida e gera** a NFS-e a partir dela;
- a autenticação é por **certificado digital na conexão**, o mesmo modelo mTLS já usado na NF-e;
- o ciclo de vida pós-emissão é feito por **eventos** registrados contra a chave de acesso da NFS-e,
  não por operações proprietárias do município.

Esta feature substitui o caminho municipal por essa integração. O provider municipal existente
(`IlheusMetropolisNfseProvider`) deixa de ter função para Ilhéus.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Emitir NFS-e de um serviço prestado (Priority: P1) 🎯 MVP

Uma clínica em Ilhéus conclui um atendimento e precisa da nota fiscal de serviço correspondente.
O sistema de origem (ERP/clínica) envia os dados do serviço; a plataforma monta a declaração,
assina com o certificado do prestador, transmite ao ambiente nacional e devolve a nota gerada com
sua chave de acesso — em uma única chamada, sem o operador precisar acessar o portal do governo.

**Why this priority**: é a razão de existir da feature. Sem ela o lojista precisa emitir cada nota
manualmente no Emissor Público Nacional, duplicando digitação e desconectando a nota do atendimento
que a originou. Todas as demais histórias pressupõem uma nota emitida.

**Independent Test**: enviar uma solicitação de emissão para um prestador com certificado válido e
verificar que a resposta traz a nota autorizada com chave de acesso, sem nenhuma interação manual
com o portal nacional.

**Acceptance Scenarios**:

1. **Given** um prestador com certificado digital válido e dados fiscais completos, **When** o
   sistema de origem solicita a emissão de uma nota de serviço, **Then** a resposta traz a nota
   gerada com sua chave de acesso e o documento fica consultável na plataforma.
2. **Given** uma solicitação de emissão com dados incompletos ou inconsistentes, **When** a
   plataforma valida a declaração antes de transmitir, **Then** a solicitação é rejeitada com a
   lista de problemas encontrados e **nenhuma** numeração é consumida.
3. **Given** uma declaração que o ambiente nacional rejeita por regra de negócio, **When** a
   resposta chega, **Then** o motivo da rejeição fica registrado e visível para o operador, sem
   que a plataforma trate o caso como sucesso.
4. **Given** uma emissão já concluída, **When** o mesmo pedido é reenviado com o mesmo
   identificador de idempotência, **Then** a mesma nota é devolvida, sem gerar uma segunda.

---

### User Story 2 - Cancelar uma NFS-e emitida (Priority: P2)

O operador percebe que uma nota foi emitida indevidamente (serviço não realizado, valor errado,
tomador trocado) e precisa cancelá-la dentro do prazo permitido.

**Why this priority**: cancelamento é a correção mais frequente e a de maior impacto fiscal — uma
nota indevida não cancelada vira tributo devido. Depende de US1 (não há o que cancelar sem emissão),
mas é independente das demais.

**Independent Test**: emitir uma nota, solicitar o cancelamento informando o motivo, e verificar que
o documento passa a constar como cancelado tanto na plataforma quanto na consulta ao ambiente
nacional.

**Acceptance Scenarios**:

1. **Given** uma nota emitida dentro do prazo de cancelamento, **When** o operador solicita o
   cancelamento com justificativa, **Then** o cancelamento é aceito e o documento passa a constar
   como cancelado.
2. **Given** uma nota fora do prazo de cancelamento direto, **When** o operador solicita o
   cancelamento, **Then** a plataforma informa que o caso exige análise fiscal do município e
   registra a solicitação nessa modalidade.
3. **Given** uma nota já cancelada, **When** um novo cancelamento é solicitado, **Then** a
   solicitação é recusada com mensagem clara, sem alterar o estado do documento.

---

### User Story 3 - Substituir uma NFS-e com erro (Priority: P3)

Em vez de simplesmente cancelar, o operador precisa reemitir a nota corrigida mantendo o vínculo
com a original — o serviço aconteceu, o que estava errado eram os dados.

**Why this priority**: preserva o histórico fiscal correto (cancelamento puro perde o vínculo entre
o documento errado e o correto) e evita que o operador tenha que cancelar e emitir do zero. Menos
frequente que o cancelamento simples.

**Independent Test**: emitir uma nota, solicitar a substituição com os dados corrigidos, e verificar
que a nota original consta como cancelada por substituição e a nova referencia a anterior.

**Acceptance Scenarios**:

1. **Given** uma nota emitida com dados incorretos, **When** o operador solicita a substituição
   informando os dados corretos, **Then** uma nova nota é gerada e a original passa a constar como
   cancelada por substituição, com vínculo entre as duas.

---

### User Story 4 - Consultar notas e seus eventos (Priority: P4)

O operador precisa recuperar uma nota emitida, seu documento fiscal e o histórico do que aconteceu
com ela (cancelamentos, confirmações, bloqueios) para conferência, envio ao tomador ou resposta a
fiscalização.

**Why this priority**: valor de suporte e auditoria, não de operação. A emissão funciona sem isso,
mas a conferência fiscal e o atendimento ao cliente ficam manuais.

**Independent Test**: após uma emissão e um cancelamento, consultar a nota e verificar que o
documento e a linha do tempo de eventos são retornados corretamente.

**Acceptance Scenarios**:

1. **Given** uma nota emitida, **When** o operador consulta o documento pela chave de acesso,
   **Then** recebe o documento fiscal e os dados da nota.
2. **Given** uma nota que sofreu eventos, **When** o operador consulta seu histórico, **Then**
   recebe a lista de eventos em ordem cronológica, com tipo, autor e data de cada um.

---

### Edge Cases

- **Prestador sem certificado válido ou com certificado vencido**: a emissão é bloqueada antes de
  qualquer transmissão, com mensagem que distingue "não cadastrado" de "vencido".
- **Certificado cujo CNPJ não corresponde ao do prestador**: recusado no cadastro, não na emissão —
  o ambiente nacional valida a correspondência e recusaria a conexão.
- **Ambiente nacional indisponível ou lento**: a nota fica em estado intermediário rastreável e a
  transmissão pode ser retomada sem consumir nova numeração nem gerar documento duplicado.
- **Declaração transmitida sem resposta conclusiva** (timeout após envio): a plataforma consulta o
  ambiente nacional pelo identificador da declaração antes de qualquer nova tentativa, para não
  emitir a mesma nota duas vezes.
- **Município do prestador não aderente ao padrão nacional**: a emissão é recusada antes de
  transmitir, com mensagem que identifica o município.
- **Prestador com mais de um estabelecimento**: cada estabelecimento tem sua própria numeração de
  declarações; a numeração de um não pode interferir na do outro.
- **Serviço prestado em município diferente do estabelecimento do prestador**: os dados de local da
  prestação precisam ser preenchidos de forma distinta do endereço do prestador.
- **Reforma tributária (IBS/CBS)**: o leiaute nacional já contempla os novos tributos; notas
  emitidas durante a transição precisam refletir o regime vigente na data do fato gerador.

## Requirements *(mandatory)*

### Functional Requirements

**Emissão**

- **FR-001**: O sistema MUST aceitar, de sistemas internos da plataforma, uma solicitação de emissão
  de nota de serviço contendo prestador, tomador, descrição do serviço, valores e tributação.
- **FR-002**: O sistema MUST validar a completude e a consistência da solicitação **antes** de
  qualquer consumo de numeração ou transmissão ao ambiente nacional.
- **FR-003**: O sistema MUST montar a declaração de prestação de serviços no leiaute nacional
  vigente e validá-la contra o esquema oficial antes de transmitir.
- **FR-004**: O sistema MUST assinar digitalmente a declaração com o certificado do prestador.
- **FR-005**: O sistema MUST bloquear a emissão quando o prestador não tiver certificado digital
  válido e vigente.
- **FR-006**: O sistema MUST atribuir a cada declaração um identificador único e sequencial por
  estabelecimento, série e ambiente, sem lacunas nem reuso.
- **FR-007**: O sistema MUST transmitir a declaração ao ambiente nacional e devolver o resultado na
  mesma requisição, incluindo a chave de acesso da nota quando gerada.
- **FR-008**: O sistema MUST registrar o motivo quando o ambiente nacional recusar a declaração, e
  MUST NOT tratar recusa como sucesso.
- **FR-009**: O sistema MUST garantir idempotência: uma solicitação repetida com o mesmo
  identificador de origem devolve a mesma nota, sem gerar uma segunda.
- **FR-010**: O sistema MUST distinguir ambiente de homologação de produção e MUST NOT transmitir
  em produção sem configuração explícita.

**Ciclo de vida**

- **FR-011**: Usuários MUST poder cancelar uma nota emitida, informando justificativa.
- **FR-012**: O sistema MUST distinguir o cancelamento direto (dentro do prazo) da solicitação de
  análise fiscal pelo município (fora do prazo), aplicando o caminho correto sem exigir que o
  operador saiba a diferença.
- **FR-013**: Usuários MUST poder substituir uma nota emitida por outra corrigida, preservando o
  vínculo entre as duas.
- **FR-014**: O sistema MUST recusar operações de ciclo de vida incompatíveis com o estado atual do
  documento, com mensagem que explique o motivo.

**Consulta e rastreabilidade**

- **FR-015**: Usuários MUST poder consultar uma nota emitida e obter seu documento fiscal.
- **FR-016**: Usuários MUST poder consultar o histórico de eventos de uma nota, em ordem
  cronológica, com tipo, autor e data.
- **FR-017**: O sistema MUST registrar, para cada interação com o ambiente nacional, o que foi
  enviado, o que foi recebido e o desfecho, para fins de auditoria fiscal.
- **FR-018**: O sistema MUST preservar o documento fiscal gerado de forma recuperável enquanto a
  obrigação de guarda estiver vigente.

**Acesso e limites**

- **FR-019**: O sistema MUST restringir a emissão a sistemas internos autorizados da plataforma —
  não há acesso público a estas operações.
- **FR-020**: O sistema MUST recusar emissão para prestador cujo município não seja aderente ao
  padrão nacional, antes de qualquer transmissão.

### Key Entities

- **Prestador**: o estabelecimento que presta o serviço e emite a nota. Possui inscrição federal,
  inscrição municipal, endereço, regime tributário e município de competência. Já existe na
  plataforma como o Emitente fiscal.
- **Certificado digital**: credencial do prestador usada tanto para assinar a declaração quanto para
  autenticar a conexão com o ambiente nacional. Possui vigência e vínculo com a inscrição federal do
  prestador. Já existe na plataforma.
- **Declaração de prestação de serviços**: o documento que o prestador emite e transmite. Identificada
  por município, inscrição do prestador, série e número sequencial. É a entrada do processo — não é a
  nota fiscal.
- **Nota fiscal de serviço**: o documento gerado pelo ambiente nacional a partir da declaração
  aceita. Identificada por uma chave de acesso. É o que tem valor fiscal.
- **Evento**: registro de algo que aconteceu com uma nota após sua geração — cancelamento,
  cancelamento por substituição, solicitação e desfecho de análise fiscal, confirmações e rejeições
  das partes, cancelamento/bloqueio/desbloqueio por ofício do município. Vinculado à chave de acesso.
- **Tomador**: quem contrata o serviço. Pessoa física ou jurídica, com inscrição federal e endereço.
- **Serviço prestado**: descrição, código de serviço, local da prestação, valores e tributação
  aplicável.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um operador emite uma nota de serviço a partir de um atendimento concluído sem abrir
  nenhum portal externo, e recebe a confirmação em até 30 segundos.
- **SC-002**: 100% das solicitações com dados incompletos são recusadas antes de consumir numeração —
  nenhuma lacuna na sequência de declarações causada por erro de preenchimento.
- **SC-003**: Uma nota emitida indevidamente é cancelada em até 2 minutos, sem o operador precisar
  saber se o caso exige análise fiscal do município.
- **SC-004**: O documento fiscal de qualquer nota emitida fica disponível para consulta em até 5
  segundos após a emissão.
- **SC-005**: Nenhuma emissão duplicada: reenviar a mesma solicitação nunca gera uma segunda nota,
  inclusive após falha de comunicação com o ambiente nacional.
- **SC-006**: Toda interação com o ambiente nacional é reconstituível em auditoria — para qualquer
  nota emitida é possível recuperar o que foi enviado, o que foi recebido e quando.

## Assumptions

- **Ilhéus é aderente ao Sistema Nacional da NFS-e** — confirmado pelo usuário em 2026-08-05. A
  premissa anterior de integração com o sistema municipal (MetropolisWeb/POLIS) está descartada
  para este município.
- **O modelo de certificado digital já implementado é reaproveitável**: a plataforma já armazena,
  valida e usa certificados A1 para assinar documentos e autenticar conexões na emissão de NF-e; o
  padrão nacional usa o mesmo modelo.
- **O escopo desta fase é homologação**: nenhuma transmissão em produção faz parte desta entrega —
  habilitar produção é decisão explícita separada, como já ocorre com a NF-e.
- **Ilhéus é o único município no escopo desta fase**. O desenho não deve impedir outros municípios
  aderentes, mas nenhum outro será validado agora.
- **A emissão é síncrona do ponto de vista de quem chama**: o solicitante recebe o desfecho na
  própria resposta, como já ocorre na NF-e.
- **Consumidores são sistemas internos da plataforma** (ERP, verticais), não terceiros.
- **O provider municipal existente sai de operação para Ilhéus**. Se e como manter o código para
  outros municípios não aderentes é decisão de planejamento, não de especificação.
- **Confirmações e rejeições por tomador/intermediário** existem no padrão nacional mas não fazem
  parte desta fase — a plataforma emite pelo prestador.

## Fora de escopo

- Emissão de NFS-e Via (Exploração de Vias / pedágio) — documento de outro tipo, destinado a
  concessionárias de rodovias, sem relação com prestação de serviços comum.
- Integração com sistemas municipais próprios de municípios não aderentes ao padrão nacional.
- Portal ou interface de usuário final para emissão — esta entrega expõe a capacidade para os
  sistemas da plataforma consumirem.
- Apuração, guias de recolhimento e escrituração de ISSQN/IBS/CBS.
- Papel de tomador ou intermediário (confirmar, rejeitar, anular rejeição de notas recebidas).
