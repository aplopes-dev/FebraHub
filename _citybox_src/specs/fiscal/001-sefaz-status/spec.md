# Feature Specification: Status de comunicação com o órgão fiscal (NFC-e e NFS-e)

**Feature Branch**: `feat/fiscal-api`
**Feature Directory**: `specs/fiscal/001-sefaz-status`
**Created**: 2026-08-12
**Status**: Draft
**Input**: "fiscal-api / endpoint de status sefaz (retornar se a comunicação com a sefaz está online ou não) Do lado da SEFAZ / faz um para a NFS e NFC, precisamos saber se a comunicação do lado deles está OK"

## Contexto

Hoje, quando uma emissão falha, quem está no balcão ou no suporte não tem como
saber **de que lado está o problema**. A falha chega como um erro genérico, e as
três causas possíveis exigem ações opostas:

| Causa real | O que fazer |
|---|---|
| O órgão está fora do ar | Esperar, ou entrar em contingência. Nada a corrigir aqui. |
| A loja não consegue alcançar o órgão (rede, certificado, DNS) | Corrigir do nosso lado. Contingência não resolve. |
| O documento está errado (dado inválido, regra de negócio) | Corrigir o documento. Nada a ver com disponibilidade. |

Sem essa distinção, um problema de rede local vira chamado aberto contra a SEFAZ,
e uma parada real do órgão vira caça a bug inexistente no nosso código.

Esta feature expõe a pergunta "**o órgão está atendendo?**" como uma consulta
explícita, separada de qualquer emissão.

## Clarifications

### Session 2026-08-12

- Q: Onde deve viver o registro da última verificação de disponibilidade (o que faz FR-007 limitar contatos e SC-004 evitar bloqueio)? → A: Em armazenamento compartilhado e durável (tabela no schema `fiscal`), não na memória do processo.
- Q: Incluir NF-e (modelo 55) no escopo do status, junto de NFC-e e NFS-e? → A: Sim — os três modelos emitidos pelo serviço (NF-e, NFC-e e NFS-e) entram no escopo.
- Q: Como a consulta deve ser feita — uma chamada cobrindo os três modelos, ou uma por modelo? → A: Uma única consulta, que por padrão cobre os três e aceita filtro opcional para restringir a quais modelos perguntar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Descobrir de que lado está a falha (Priority: P1)

Um operador tenta emitir uma nota fiscal ou um cupom fiscal e recebe erro. Antes de
abrir chamado ou mexer em qualquer coisa, ele (ou o suporte) consulta o status do
órgão para aquele modelo de documento e recebe uma resposta que distingue **"eles
estão fora"** de **"nós não conseguimos chegar até eles"**.

**Why this priority**: É o motivo declarado da feature. Sem isso, todo o resto é
otimização. Entrega valor sozinho, mesmo sem nenhuma das outras histórias. Cobre
nota fiscal e cupom fiscal juntos porque ambos usam a mesma forma padronizada de
perguntar — o que muda entre eles é **para quem** se pergunta.

**Independent Test**: Consultar o status com o órgão respondendo normalmente
(esperado: atendendo), depois com o endereço do órgão inacessível (esperado:
inalcançável, e a resposta deve deixar claro que a falha é de alcance, não do órgão).

**Acceptance Scenarios**:

1. **Given** o órgão responde que está em operação, **When** o usuário consulta o
   status, **Then** recebe "atendendo", com a mensagem original do órgão e o
   horário da verificação.
2. **Given** o órgão responde declarando estar paralisado, **When** o usuário
   consulta, **Then** recebe "paralisado" — **não** "inalcançável" —, com o motivo
   informado pelo órgão e, quando houver, a previsão de retorno.
3. **Given** o órgão não responde dentro do tempo limite, **When** o usuário
   consulta, **Then** recebe "inalcançável", e a resposta indica que o serviço não
   obteve resposta — sem afirmar que o órgão está fora.
4. **Given** a empresa não tem certificado válido, **When** o usuário consulta,
   **Then** recebe uma recusa explicando que a verificação exige certificado, sem
   nenhuma tentativa de contato com o órgão.

---

### User Story 2 - Mesma resposta para NFS-e (Priority: P2)

Quem emite nota de serviço precisa da mesma resposta, para o sistema de NFS-e —
que é um órgão diferente, com disponibilidade independente da do órgão de NFC-e.

**Why this priority**: Foi pedido explicitamente e tem o mesmo valor de
diagnóstico, mas NFC-e é o caminho com contingência e volume de balcão, então vem
primeiro.

**Independent Test**: Consultar o status de NFS-e enquanto o de NFC-e está
atendendo, e confirmar que as duas respostas são independentes — uma parada em um
não afeta a resposta do outro.

**Acceptance Scenarios**:

1. **Given** o sistema de NFS-e está atendendo e o de NFC-e não, **When** o usuário
   faz uma consulta, **Then** a mesma resposta traz situações diferentes e corretas
   para cada modelo, e o veredito de topo indica que há problema.
2. **Given** o sistema de NFS-e não oferece uma forma de perguntar disponibilidade,
   **When** o usuário consulta, **Then** recebe "não verificável" com essa razão
   declarada — e **não** um "atendendo" que ninguém confirmou.

---

### User Story 3 - Consultar sem ser bloqueado pelo órgão (Priority: P3)

Durante uma parada, várias pessoas e sistemas consultam o status repetidamente. O
serviço precisa responder a todos sem exceder o limite de consultas do órgão, que
bloqueia quem consulta demais.

**Why this priority**: Não entrega função nova, mas sem isso a própria feature vira
a causa de um bloqueio — o oposto do que se quer. É pré-requisito de operação real,
não de demonstração.

**Independent Test**: Disparar muitas consultas em sequência curta e confirmar que
o número de contatos reais com o órgão fica dentro do limite, enquanto todos os
consultantes recebem resposta.

**Acceptance Scenarios**:

1. **Given** uma consulta acabou de ser feita ao órgão, **When** outra chega logo em
   seguida, **Then** a resposta é servida a partir da última verificação, e informa
   **há quanto tempo** aquele dado foi obtido.
2. **Given** um usuário precisa de leitura nova durante um diagnóstico e a última
   verificação ainda está dentro do intervalo mínimo, **When** ele consulta,
   **Then** recebe o dado conhecido, a idade dele e **em quanto tempo** haverá nova
   verificação — em vez de um dado antigo apresentado como atual.

---

### Edge Cases

- **O órgão responde algo que não é nem "em operação" nem "paralisado"** (código
  desconhecido, resposta malformada): tratar como "resposta não compreendida",
  preservando o texto original. Nunca converter em "atendendo" por omissão.
- **Órgãos diferentes para o mesmo estado**: na Bahia isso não é hipótese — cupom
  fiscal é delegado a outro órgão, enquanto nota fiscal é atendida pela própria
  SEFAZ estadual. Logo, "a SEFAZ está fora" pode ser verdade para um modelo e falso
  para o outro **ao mesmo tempo**, na mesma empresa. A resposta precisa dizer
  **qual** órgão foi consultado, e a janela de FR-007 é contada por modelo.
- **Certificado vencido ou prestes a vencer**: falha de handshake é indistinguível,
  na rede, de órgão fora. A resposta deve identificar a causa como nossa quando o
  problema é o certificado.
- **Ambiente de produção**: consultar produção exige configuração que este serviço
  deliberadamente não tem. A consulta deve ser recusada com a mesma clareza das
  demais operações.
- **O órgão está lento, não fora**: uma resposta que demora 40s não pode travar
  quem consultou. Passado o tempo limite, responder "inalcançável" é mais útil que
  esperar.
- **Empresa de outro tenant**: consultar o status de uma empresa que não pertence
  ao solicitante deve se comportar como se a empresa não existisse.
- **Reinício do serviço durante uma parada**: um deploy no meio de uma
  indisponibilidade é justamente quando mais se consulta. A janela de FR-007 não
  pode zerar por causa disso — depois de reiniciar, o serviço ainda deve saber
  quando foi o último contato.
- **Consultas simultâneas com janela vencida**: várias chegando ao mesmo tempo não
  podem virar vários contatos com o órgão (FR-007b). É a mesma armadilha de
  concorrência da fila de contingência: verificar-e-agir sem serialização não
  serializa nada sob concorrência real.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST responder à pergunta "o órgão está atendendo?" em uma
  **única consulta**, para uma empresa e um ambiente, cobrindo por padrão os
  **três** modelos que o serviço emite — nota fiscal eletrônica, cupom fiscal e
  nota de serviço —, sem emitir nem alterar documento algum.
- **FR-001a**: A consulta MUST aceitar um filtro opcional de modelos. Quando
  informado, o sistema MUST NOT contatar o órgão dos modelos não pedidos — quem
  quer checar só o cupom no balcão não deve gastar cota dos outros órgãos.
- **FR-001b**: A resposta MUST trazer um veredito de topo, legível sem interpretar
  o detalhe ("está tudo respondendo" / "há problema"), **acompanhado** do detalhe
  por modelo. O veredito resume; ele não substitui a distinção de FR-002, que é o
  que diz de que lado está a falha.
- **FR-002**: A resposta MUST distinguir, no mínimo, quatro situações:
  **atendendo**, **paralisado** (o órgão respondeu declarando indisponibilidade),
  **inalcançável** (não houve resposta) e **não verificável** (aquele órgão não
  oferece forma de perguntar).
- **FR-003**: O sistema MUST NOT afirmar "atendendo" sem ter obtido resposta do
  órgão. Ausência de informação é "inalcançável" ou "não verificável", nunca
  disponibilidade presumida.
- **FR-004**: A resposta MUST identificar qual órgão foi consultado, já que o
  destino varia por modelo de documento mesmo dentro do mesmo estado.
- **FR-005**: A resposta MUST informar, por modelo, o momento da verificação, há
  quanto tempo o dado foi obtido e quando haverá nova verificação, para que quem lê
  saiba se está vendo informação atual e não precise adivinhar.
- **FR-005a**: O sistema MUST NOT oferecer forma de contatar o órgão fora do
  intervalo de FR-007, nem a pedido explícito do usuário — exceder o limite pode
  bloquear o CNPJ e impedir a emissão, dano muito maior que o de aguardar.
- **FR-006**: A resposta MUST preservar a mensagem original do órgão e, quando
  informada, a previsão de retorno.
- **FR-007**: O sistema MUST limitar a frequência de contato real com o órgão ao
  intervalo mínimo que o próprio órgão admite, servindo as demais consultas a
  partir da última verificação conhecida.
- **FR-007a**: A última verificação MUST ser guardada em armazenamento
  compartilhado e durável, de forma que o limite de FR-007 valha para o serviço
  inteiro — não por instância nem por processo. O limite é imposto pelo órgão por
  CNPJ; um registro que não seja compartilhado multiplicaria os contatos pelo
  número de instâncias e seria perdido a cada reinício.
- **FR-007b**: Quando várias consultas chegarem simultaneamente e não houver
  verificação recente, o sistema MUST realizar **um único** contato com o órgão e
  servir o mesmo resultado a todas — a simultaneidade não pode furar o limite de
  FR-007.
- **FR-008**: O sistema MUST responder dentro de um tempo limite fixo mesmo quando
  o órgão não responde, classificando o estouro como "inalcançável".
- **FR-008a**: Sendo vários modelos numa consulta, o sistema MUST contatar os
  órgãos de forma que o tempo total não seja a soma dos tempos individuais, e MUST
  devolver o resultado de cada modelo independentemente — um órgão inalcançável
  **não pode** impedir que os demais sejam reportados, nem derrubar a consulta
  inteira em erro.
- **FR-009**: O sistema MUST recusar a consulta em ambiente de produção, pela mesma
  razão e com a mesma clareza das demais operações do serviço.
- **FR-010**: O sistema MUST exigir certificado digital válido da empresa e, quando
  ausente ou vencido, MUST recusar identificando a causa como local — sem
  contabilizar isso como indisponibilidade do órgão.
- **FR-011**: O sistema MUST restringir a consulta às empresas do tenant do
  solicitante.
- **FR-012**: A consulta MUST NOT consumir numeração fiscal nem criar documento,
  em nenhuma circunstância, inclusive em falha.
- **FR-013**: O sistema MUST registrar cada contato real com o órgão de forma
  auditável, permitindo reconstruir depois o que se sabia e quando.

### Key Entities

- **Verificação de disponibilidade**: o resultado de uma pergunta ao órgão,
  **persistido em armazenamento compartilhado e durável**. Guarda a situação
  apurada, o órgão consultado, o modelo de documento, o ambiente, a mensagem
  original recebida, a previsão de retorno (quando houver) e o instante da
  apuração. A combinação empresa + modelo de documento + ambiente é o que
  identifica a janela de FR-007: é nessa granularidade que o órgão conta as
  consultas. Serve tanto de fonte para FR-007 quanto de trilha de auditoria para
  FR-013 — são a mesma informação, e mantê-las separadas abriria a chance de
  divergirem.
- **Órgão consultado**: quem efetivamente responde por um modelo de documento em
  um estado. Não é derivável só do estado da empresa — cupom fiscal e nota de
  serviço podem ter destinos distintos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Diante de uma falha de emissão, o usuário determina em uma única
  consulta se a causa está no órgão ou do lado da loja, sem precisar interpretar
  log ou abrir chamado.
- **SC-002**: "Órgão paralisado" e "não conseguimos alcançar o órgão" produzem
  respostas distintas em 100% dos casos — nenhuma das duas situações é apresentada
  como a outra.
- **SC-003**: Toda consulta recebe resposta em até 5 segundos, inclusive quando os
  três modelos são consultados e **todos** os órgãos estão inacessíveis — ou seja,
  o pior caso, não o caso feliz.
- **SC-004**: Nenhum bloqueio por excesso de consultas é provocado pelo serviço, em
  volume de uso de dia de parada (consultas repetidas por vários usuários e
  sistemas simultaneamente), **com mais de uma instância do serviço no ar e
  atravessando um reinício** — as três condições em que o limite mais tende a ser
  furado.
- **SC-005**: 100% das respostas declaram a idade da informação, de forma que
  ninguém confunda dado de minutos atrás com leitura instantânea.
- **SC-006**: Nenhuma consulta de status, em nenhum cenário de teste, consome
  numeração fiscal ou deixa documento registrado.

## Assumptions

Registradas como decisão tomada, não como fato verificado — cada uma é revisível
em `/speckit-clarify` ou na fase de plano.

1. **Consulta por empresa, não global.** A verificação exige certificado digital, e
   certificado é da empresa. Não existe, portanto, uma sondagem anônima do serviço
   inteiro: a pergunta é sempre "esta empresa consegue falar com aquele órgão?".
   Isso também torna a resposta honesta — inclui o caminho real que a emissão
   usaria, certificado incluso.
2. **Nota fiscal e cupom fiscal têm forma padronizada de perguntar; nota de serviço
   a verificar.** Ambos usam a **mesma** consulta de disponibilidade prevista no
   padrão nacional do documento eletrônico — o que muda é só o órgão de destino.
   Por isso os dois entram juntos na US1, e por isso incluir nota fiscal custou
   pouco. Para nota de serviço, a existência de operação equivalente ainda **não
   foi confirmada** — é tarefa de pesquisa da fase de plano. Se não existir, a
   situação retornada é "não verificável" (FR-002), e **não** se implementa
   sondagem sintética disfarçada de status: chamar uma operação de emissão só para
   ver se responde consome cota do órgão e distorce o significado da resposta.
3. **Intervalo mínimo entre contatos reais: 3 minutos por empresa + modelo +
   ambiente** — a mesma granularidade da entidade de verificação, que é como o
   órgão conta as consultas. Deriva do limite praticado pelo órgão de documentos
   eletrônicos, que trata consulta em excesso como uso indevido e chega a bloquear
   temporariamente o CNPJ. O valor exato deve ser confirmado na documentação
   oficial durante o plano.
4. **Não há como furar o intervalo mínimo — nem a pedido.** A tentação é oferecer
   uma "verificação forçada" para quem está diagnosticando. Foi descartada: o preço
   de exceder o limite não é uma resposta lenta, é o órgão **bloquear o CNPJ**, e
   um CNPJ bloqueado não emite. Trocar até 1 hora sem emitir por 3 minutos de dado
   mais fresco é péssimo negócio, ainda mais durante uma parada. A conciliação é
   transparência, não exceção: informar sempre a idade do dado e quando haverá
   verificação nova (FR-005, US3).
5. **Só ambiente de homologação.** Consistente com a decisão vigente do serviço,
   produção não tem configuração e a consulta é recusada.
6. **Reaproveita a sondagem já existente.** O serviço já possui uma verificação
   opcional de disponibilidade, usada internamente para decidir contingência de
   cupom fiscal, com a mesma distinção entre "respondeu negativamente" e "não
   respondeu". Esta feature a expõe e a implementa de fato, em vez de criar um
   segundo conceito paralelo.
7. **A operação de status ainda não existe no serviço.** A consulta de
   disponibilidade não está entre as operações que o serviço sabe endereçar hoje —
   precisa ser acrescentada, com seu destino em cada órgão. O roteamento por modelo,
   esse sim, já existe e não precisa ser refeito.

## Fora de escopo

- Monitoramento contínuo, alertas ou notificação proativa de queda.
- Histórico de disponibilidade, relatórios ou indicador de tempo no ar.
- Decisão automática de entrar em contingência — já existe no fluxo de emissão de
  cupom fiscal e não muda aqui.
- Qualquer consulta em ambiente de produção.
