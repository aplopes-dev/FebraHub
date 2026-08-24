# Feature Specification: Cupom fiscal eletrônico (NFC-e, modelo 65)

**Feature Branch**: `feat/nfce-cupom-fiscal`
**Created**: 2026-08-08
**Status**: Draft
**Input**: "Agora precisamos emitir Cupom Fiscal também"

## Nota de terminologia — o que "cupom fiscal" significa hoje

"Cupom fiscal" nomeou por décadas o papel que saía do **ECF**, uma impressora fiscal
homologada. Esse modelo está **extinto**: os estados encerraram o uso do ECF e o
substituíram por documento eletrônico.

Existem três substitutos no Brasil, e **só um se aplica aqui**:

| Documento | Modelo | Onde vale |
| --- | --- | --- |
| **NFC-e** | **65** | Maioria dos estados, **incluindo a Bahia** |
| SAT CF-e | 59 | São Paulo |
| MFE | 59 | Ceará |

O piloto é Ilhéus/BA. Esta especificação cobre a **NFC-e, modelo 65** — e quando este
documento disser "cupom fiscal", é dela que se trata.

Importa não confundir com a NF-e (modelo 55), já implementada: são documentos distintos,
com numeração, série, leiaute impresso e regras próprias. A NFC-e **não** é uma NF-e
simplificada.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fechar uma venda no balcão (Priority: P1)

O operador do PDV finaliza uma venda ao consumidor final, recebe o pagamento e precisa
entregar o cupom. A venda não termina sem ele.

**Why this priority**: é a única razão pela qual a NFC-e existe. Sem cupom, a venda ao
consumidor final não pode ser concluída legalmente — e o caixa para.

**Independent Test**: registrar uma venda, emitir o cupom e verificar que a SEFAZ-BA
autorizou, devolvendo chave de acesso e protocolo.

**Acceptance Scenarios**:

1. **Given** uma venda com itens e forma de pagamento, **When** o operador finaliza,
   **Then** o cupom é autorizado pela SEFAZ-BA e o sistema devolve chave de acesso,
   protocolo e o conteúdo do QR Code.
2. **Given** uma venda a consumidor **não identificado**, **When** o cupom é emitido,
   **Then** ele é autorizado normalmente — informar CPF é direito do consumidor, não
   obrigação.
3. **Given** uma venda cujo valor ultrapassa o limite estadual para consumidor não
   identificado, **When** a emissão é tentada, **Then** o sistema recusa **antes** de
   transmitir, explicando que aquela venda exige NF-e com destinatário identificado.
4. **Given** um pagamento em dinheiro com troco, **When** o cupom é emitido, **Then** o
   valor recebido e o troco constam do documento.

---

### User Story 2 - Entregar o cupom impresso ao consumidor (Priority: P1)

Autorizado o cupom, o consumidor precisa levar o comprovante — em papel na bobina da
impressora do caixa, ou digital.

**Why this priority**: mesma criticidade da US1. Um cupom autorizado que ninguém consegue
imprimir não fecha a venda.

**Independent Test**: emitir um cupom e obter o documento auxiliar, verificando que contém
o QR Code e a chave de acesso.

**Acceptance Scenarios**:

1. **Given** um cupom autorizado, **When** o operador solicita o documento auxiliar em
   bobina, **Then** recebe um arquivo imprimível em **80 mm**, com QR Code, chave de acesso,
   itens, totais e formas de pagamento.
1a. **Given** um cupom autorizado, **When** o consumidor pede o comprovante por e-mail ou
   WhatsApp, **Then** o sistema entrega a versão **A4** com os mesmos dados da bobina.
2. **Given** um cupom autorizado, **When** o consumidor lê o QR Code, **Then** chega à
   consulta pública da SEFAZ-BA e confere a autenticidade do documento.
3. **Given** um cupom cancelado, **When** o documento é solicitado, **Then** ele é
   entregue **marcado como cancelado**.

---

### User Story 3 - Continuar vendendo com a SEFAZ fora do ar (Priority: P2)

A SEFAZ-BA fica indisponível — o que é rotina, não exceção. O caixa não pode parar.

⚠️ **Recorte decidido**: cobre a indisponibilidade **da SEFAZ**, com o PDV ainda alcançando
a `fiscal-api`. Queda da internet **da loja** deixa o PDV sem alcançar a API, e nenhuma
contingência server-side resolve isso — exigiria agente local no caixa, fora de escopo
(ver Clarifications).

**Why this priority**: no varejo, indisponibilidade acontece — e a legislação **prevê** a
contingência exatamente por isso. Mas é P2, não P1: um sistema que emite online já vende;
um que só emite offline não vende nunca. A ordem é ter o caminho normal primeiro.

**Independent Test**: simular a SEFAZ indisponível, emitir em contingência, restabelecer a
conexão e verificar que o cupom foi transmitido e autorizado.

**Acceptance Scenarios**:

1. **Given** a SEFAZ-BA indisponível, **When** o operador finaliza a venda, **Then** o
   cupom é emitido em contingência, o consumidor recebe o documento **identificado como
   emitido em contingência**, e a venda se conclui.
2. **Given** cupons emitidos em contingência, **When** a SEFAZ volta, **Then** eles são
   transmitidos automaticamente, na ordem, sem intervenção do operador.
3. **Given** um cupom em contingência **rejeitado** na transmissão posterior, **Then** o
   sistema sinaliza explicitamente — o consumidor já levou o papel, e a pendência precisa
   ser resolvida pelo lojista.

---

### User Story 4 - Cancelar um cupom emitido por engano (Priority: P2)

O operador registra a venda errada e percebe em seguida.

**Why this priority**: acontece diariamente no varejo, mas tem janela curta e não bloqueia
a operação — a venda seguinte sai normalmente.

**Independent Test**: emitir um cupom, cancelá-lo dentro do prazo e verificar que a SEFAZ
registrou o cancelamento.

**Acceptance Scenarios**:

1. **Given** um cupom autorizado há poucos minutos, **When** o operador cancela com
   justificativa, **Then** a SEFAZ-BA autoriza o cancelamento.
2. **Given** um cupom fora do prazo legal de cancelamento, **When** o cancelamento é
   tentado, **Then** o sistema recusa informando o prazo e a alternativa.

---

### Edge Cases

- **Numeração**: a NFC-e tem **série e numeração próprias**, independentes da NF-e. Usar a
  mesma sequência da NF-e produziria conflito de numeração na SEFAZ.
- **Faixa de numeração queimada**: se a emissão falha depois de reservar o número, aquele
  número não pode ser reaproveitado — precisa ser inutilizado junto à SEFAZ.
- **CSC ausente ou inválido**: o QR Code é assinado com o CSC. Sem ele não há cupom válido,
  e a recusa precisa acontecer **antes** de consumir numeração.
- **Item sem tributação definida**: o cupom não pode ser emitido com imposto indeterminado.
- **Venda sem itens ou com valor zero**: recusada.
- **Consumidor pede CPF depois de impresso**: não há alteração de cupom emitido; o caminho
  é cancelar e reemitir dentro do prazo.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE emitir NFC-e (modelo 65) junto à SEFAZ-BA, devolvendo chave de
  acesso, protocolo de autorização e o conteúdo do QR Code.
- **FR-002**: O sistema DEVE manter **numeração e série próprias** da NFC-e, isoladas das
  da NF-e.
- **FR-003**: O sistema DEVE permitir a emissão **sem identificação do consumidor**, e
  aceitar CPF ou CNPJ quando informado.
- **FR-004**: O sistema DEVE recusar, **antes de transmitir e antes de consumir numeração**,
  venda que ultrapasse o limite legal para consumidor não identificado, indicando que o
  caso exige NF-e.
- **FR-005**: O sistema DEVE registrar as **formas de pagamento** da venda e, no pagamento
  em dinheiro, o troco.
- **FR-006**: O sistema DEVE armazenar o **CSC** de cada Emitente de forma cifrada, no mesmo
  padrão já aplicado ao certificado digital, e recusar a emissão quando ele não estiver
  configurado.
- **FR-007**: O sistema DEVE entregar o documento auxiliar do cupom (**DANFE NFC-e**) em
  **bobina de 80 mm**, contendo QR Code, chave de acesso, itens, totais e formas de
  pagamento.
- **FR-007a**: O sistema DEVE entregar **também** uma versão em **A4**, para envio digital.
  Os dois leiautes representam o mesmo cupom e DEVEM mostrar os mesmos dados — divergência
  entre as duas vias de um documento fiscal é defeito, não variação de formato.
- **FR-008**: O sistema DEVE permitir o **cancelamento** dentro do prazo legal, recusando
  fora dele com explicação do prazo.
- **FR-009**: O sistema DEVE permitir a **inutilização** de faixa de numeração não
  utilizada.
- **FR-010**: O sistema DEVE emitir em **contingência** quando a SEFAZ-BA estiver
  indisponível, e transmitir os cupons pendentes automaticamente, **na ordem de emissão**,
  ao restabelecimento.
- **FR-010a**: A contingência cobre indisponibilidade **da SEFAZ**. Quando o próprio
  solicitante não alcança a API, não há emissão — e o sistema não deve fingir que há.
- **FR-011**: O documento emitido em contingência DEVE ser **identificado como tal** no
  papel entregue ao consumidor.
- **FR-012**: O sistema DEVE sinalizar explicitamente cupom de contingência **rejeitado** na
  transmissão posterior — não pode falhar em silêncio, porque o consumidor já levou o
  comprovante.
- **FR-015**: O certificado A1 e o CSC DEVEM permanecer no servidor. Nenhum material de
  assinatura pode ser entregue ao navegador — o PDV é um PWA, e material de assinatura no
  cliente é exposição inaceitável para documento fiscal.
- **FR-013**: O sistema DEVE recusar emissão em ambiente de **produção** enquanto ele não
  for deliberadamente habilitado, no mesmo padrão já aplicado a NF-e e NFS-e.
- **FR-014**: O documento gerado em homologação DEVE exibir marcação inequívoca de que não
  tem valor fiscal.

### Key Entities

- **Cupom fiscal (NFC-e)**: documento fiscal de venda ao consumidor final. Compartilha a
  natureza de "documento fiscal" com NF-e e NFS-e, mas tem numeração, série, leiaute e
  regras próprias.
- **CSC (Código de Segurança do Contribuinte)**: segredo emitido pela SEFAZ ao Emitente,
  usado para assinar o QR Code. **Distinto do certificado digital** — um não substitui o
  outro, e o cupom exige os dois.
- **Forma de pagamento**: como a venda foi paga (dinheiro, cartão, PIX…), com valor e, no
  dinheiro, o troco. Sem isso o cupom não é válido.
- **Emitente** (já existente): o contribuinte, que agora também guarda CSC.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O operador conclui a venda e entrega o cupom em até 5 segundos desde a
  finalização, no fluxo normal.
- **SC-002**: 100% dos cupons autorizados têm chave de acesso e protocolo correspondentes ao
  que a SEFAZ-BA registrou.
- **SC-003**: O QR Code impresso leva à consulta pública da SEFAZ-BA e exibe o documento
  correto, verificado por leitura com celular comum.
- **SC-004**: Com a SEFAZ indisponível, o caixa **continua vendendo** — nenhuma venda é
  perdida por indisponibilidade do órgão. (Indisponibilidade da internet da loja está fora
  do alcance desta entrega.)
- **SC-005**: 100% dos cupons emitidos em contingência são transmitidos ou explicitamente
  sinalizados como pendentes; nenhum fica esquecido.
- **SC-006**: Um cupom de homologação é distinguível de um real à primeira vista, por pessoa
  não treinada — nos **dois** leiautes.
- **SC-007**: A bobina e o A4 do mesmo cupom mostram os mesmos dados, verificado por
  comparação de conteúdo entre as duas versões.

---

## Assumptions

- **Documento**: NFC-e modelo 65 pela SEFAZ-BA. SAT (SP) e MFE (CE) estão fora — o piloto é
  Ilhéus/BA. Reavaliar se a plataforma sair da Bahia.
- **Ambiente**: homologação. Produção segue recusada por construção, como em NF-e e NFS-e.
- **Certificado**: o mesmo A1 ICP-Brasil já cadastrado por Emitente. O CSC é adicional, não
  substituto.
- **Tributação**: mesma limitação já declarada para NF-e — Simples Nacional com tributos
  zerados. Lucro Presumido/Real exigiria cálculo por produto, ainda não implementado.
- **Formato do documento auxiliar**: **dois** leiautes — bobina de 80 mm (padrão das
  impressoras térmicas de balcão) e A4 para envio digital.

---

## Dependencies

- Emitente cadastrado com certificado A1 válido — já existente.
- **CSC obtido junto à SEFAZ-BA** por Emitente. É um passo administrativo do contribuinte,
  externo ao sistema, e **bloqueia a emissão** enquanto não existir.
- Credenciamento do Emitente na SEFAZ-BA para modelo 65 — distinto do credenciamento para
  NF-e, e igualmente administrativo.

---

## Out of Scope

- **SAT CF-e (modelo 59)** e **MFE**: outros estados, outro hardware, outro protocolo.
- **Integração com impressora térmica**: a API entrega o arquivo; enviar ao dispositivo é do
  aplicativo que consome.
- **Agente local no caixa**: seria o único caminho para emitir com a internet da loja fora,
  mas transforma a entrega em software instalável, com atualização e suporte por loja.
  Decisão registrada em Clarifications.
- **Cálculo de tributos para Lucro Presumido/Real**: mesma fronteira já declarada para NF-e.
- **Substituição de cupom**: a NFC-e não tem substituição; o caminho é cancelar e reemitir.

---

## Clarifications

### Session 2026-08-08

Três decisões de **escopo** que mudam materialmente o tamanho e o desenho da entrega:

- Q: A **contingência** (US3, FR-010 a FR-012) entra nesta entrega? → A: **Sim, para a
  queda da SEFAZ.** São duas falhas distintas, e o desenho escolhido em Q1 cobre uma delas:

  | Falha | Coberta? |
  | --- | --- |
  | SEFAZ indisponível, PDV alcança a `fiscal-api` | ✅ o servidor assina, marca o cupom como contingência e transmite depois |
  | Internet da loja fora, PDV não alcança a API | ❌ exigiria agente local no caixa — fora de escopo |

  A coberta é a **mais frequente**: instabilidade da SEFAZ é rotina, queda total de internet
  é evento. Custo aceito: fila persistente, retransmissão ordenada e reconciliação.
- Q: Quem chama esta API — o **PDV**, o **ERP**, ou os dois? → A: **Os dois, sempre
  online.** Certificado A1 e CSC permanecem no servidor; o navegador nunca assina nada.
  Consequência que molda o resto: **sem agente local no caixa**, uma queda da internet *da
  loja* deixa o PDV sem alcançar a API, e nenhum desenho de contingência resolve isso. O que
  a contingência ainda cobre é a queda **da SEFAZ** — ver a decisão seguinte.
- Q: O **DANFE NFC-e** sai só em bobina de 80 mm, ou também em formato compartilhável
  digitalmente? → A: **Os dois, nesta entrega.** Bobina para o balcão e A4 para envio
  digital. Custo aceito: são dois leiautes distintos, cada um com renderização e conferência
  visual própria — não é o mesmo documento em papel diferente. Em troca, o consumidor que
  prefere receber por e-mail ou WhatsApp não fica dependente de ler o QR Code.
