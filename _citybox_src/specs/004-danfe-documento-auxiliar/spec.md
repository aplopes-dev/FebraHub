# Feature Specification: Documento auxiliar impresso da nota fiscal (DANFE / DANFSE)

**Feature Branch**: `feat/danfe-documento-auxiliar`
**Created**: 2026-08-07
**Status**: Draft
**Input**: "Preciso de endpoint para criação de DANFE a partir de uma NF ou NFS"

## Nota de terminologia

São **dois documentos distintos**, com layouts, legislações e nomes diferentes. Tratá-los como um só
levaria a um documento que nenhum dos dois fiscos aceita:

| Nota | Documento auxiliar | Regido por |
| --- | --- | --- |
| NF-e (mercadoria) | **DANFE** | Manual de Orientação ao Contribuinte da NF-e |
| NFS-e (serviço) | **DANFSE** | Padrão Nacional da NFS-e |

O pedido diz "DANFE a partir de uma NF ou NFS"; esta especificação cobre os dois, cada um com seu
leiaute.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entregar o comprovante ao cliente na venda (Priority: P1)

O lojista conclui uma venda de mercadoria, a NF-e é autorizada, e ele precisa entregar ao cliente um
documento que acompanhe a mercadoria. Sem esse papel a mercadoria não circula legalmente.

**Why this priority**: É a única razão pela qual o documento auxiliar existe. Sem ele, a NF-e
autorizada não serve para o que o lojista precisa — a mercadoria não pode sair da loja.

**Independent Test**: Emitir uma NF-e, solicitar o documento auxiliar e verificar que o arquivo
gerado abre, é legível e contém a chave de acesso da nota.

**Acceptance Scenarios**:

1. **Given** uma NF-e autorizada, **When** o lojista solicita o documento auxiliar, **Then** recebe
   um arquivo imprimível contendo a chave de acesso, o protocolo de autorização, emitente,
   destinatário, itens e totais.
2. **Given** uma NF-e ainda não autorizada, **When** o documento é solicitado, **Then** a solicitação
   é recusada com explicação — documento auxiliar de nota não autorizada não tem valor e induziria o
   lojista a entregar papel inválido.
3. **Given** uma NF-e cancelada, **When** o documento é solicitado, **Then** o documento é entregue
   **marcado como cancelado**, porque o histórico precisa ser reconstituível.

---

### User Story 2 - Enviar o comprovante do serviço ao tomador (Priority: P2)

O prestador conclui um serviço, a NFS-e é autorizada, e o tomador pede o comprovante — normalmente
por e-mail ou WhatsApp, não impresso.

**Why this priority**: Igualmente necessário na operação, mas **menos urgente que a US1**: o serviço
já foi prestado quando a nota sai, enquanto a mercadoria **não circula** sem o DANFE. Decisão
registrada em Clarifications — DANFE primeiro, DANFSE em seguida.

**Independent Test**: Emitir uma NFS-e, solicitar o documento auxiliar e verificar que contém a
chave de acesso e o código de verificação da nota.

**Acceptance Scenarios**:

1. **Given** uma NFS-e autorizada, **When** o prestador solicita o documento auxiliar, **Then**
   recebe um arquivo imprimível com os dados do serviço, prestador, tomador, valores e ISS.
2. **Given** uma NFS-e substituída, **When** o documento é solicitado, **Then** o documento indica
   que a nota foi substituída e identifica a substituta.

---

### User Story 3 - Reimprimir uma nota antiga (Priority: P3)

O cliente perdeu o comprovante e volta à loja semanas depois, ou o contador pede a via de uma nota
para conferência.

**Why this priority**: Frequente na operação real, mas não bloqueia a venda — por isso vem depois.

**Independent Test**: Solicitar o documento auxiliar de uma nota emitida em data anterior e verificar
que o conteúdo é idêntico ao da primeira geração.

**Acceptance Scenarios**:

1. **Given** uma nota autorizada há semanas, **When** o documento auxiliar é solicitado novamente,
   **Then** o conteúdo é idêntico ao gerado na primeira vez.
2. **Given** uma nota cujos dados cadastrais do emitente mudaram depois da emissão, **When** o
   documento é solicitado, **Then** ele reflete os dados **vigentes na emissão**, não os atuais — o
   documento auxiliar representa a nota como ela foi autorizada.

---

### Edge Cases

- **Nota rejeitada pelo órgão fiscal**: não há documento auxiliar. A solicitação é recusada com a
  razão, e não com um arquivo vazio.
- **Nota autorizada em homologação**: o documento precisa deixar **visualmente evidente** que não tem
  valor fiscal. Um documento de teste indistinguível de um real é risco de fraude involuntária.
- **XML autorizado indisponível** (falha de armazenamento): a solicitação falha com erro explícito.
  Gerar o documento a partir dos dados do banco em vez do XML autorizado produziria um documento que
  diverge do que o fisco tem.
- **Nota com muitos itens**: o documento precisa paginar. Um documento truncado omite mercadoria que
  está circulando.
- **Solicitação de nota de outra empresa**: recusada. Documento fiscal é dado de um contribuinte
  específico.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE entregar o documento auxiliar de uma NF-e autorizada, em formato
  imprimível, a partir do XML efetivamente autorizado pelo órgão fiscal.
- **FR-002**: O sistema DEVE entregar o documento auxiliar de uma NFS-e autorizada, com o leiaute
  próprio da NFS-e — que é distinto do da NF-e.
- **FR-002a**: O sistema DEVE ser capaz de gerar o DANFSE por conta própria, sem depender do órgão
  fiscal. Quando a API oficial de DANFSE estiver disponível, ela DEVE ser preferida — é a fonte de
  maior autoridade —, mas sua indisponibilidade NÃO PODE impedir a entrega do documento.
- **FR-002b**: Quando o documento vier da API oficial, o sistema DEVE registrar essa origem, para que
  uma divergência visual entre documentos da mesma nota seja explicável.
- **FR-003**: O sistema DEVE recusar a geração para notas que não tenham sido autorizadas, informando
  o estado atual do documento.
- **FR-004**: O documento DEVE conter a chave de acesso da nota em forma legível e em código de
  barras ou QR Code, conforme exigido pelo leiaute de cada documento.
- **FR-005**: O documento gerado em ambiente de homologação DEVE exibir uma **marca d'água**
  cobrindo a página com a indicação de que não tem valor fiscal. Marca d'água — e não faixa de
  cabeçalho — porque não pode ser removida recortando o papel.
- **FR-005a**: A marca d'água NÃO PODE comprometer a legibilidade dos dados da nota, inclusive em
  impressão monocromática de baixa qualidade.
- **FR-006**: O documento de nota cancelada DEVE indicar o cancelamento; o de nota substituída DEVE
  indicar a substituição e identificar a nota substituta.
- **FR-007**: O sistema DEVE recusar a solicitação quando o solicitante não for o emitente da nota.
- **FR-008**: Solicitações repetidas para a mesma nota DEVEM produzir documento com conteúdo
  idêntico, independentemente de mudanças no cadastro do emitente após a emissão.
- **FR-009**: O sistema DEVE paginar documentos cujo conteúdo exceda uma página, sem omitir itens.
- **FR-010**: Falha ao obter o XML autorizado DEVE resultar em erro explícito, nunca em documento
  gerado a partir de fonte alternativa.

- **FR-011**: Os dois documentos DEVEM exibir a marca **Citybox** — logo e legenda — de
  forma discreta, identificando o sistema que gerou o documento.
- **FR-012**: A marca do Citybox NÃO PODE aparecer no quadro de **identificação do
  emitente**, nem em qualquer posição que sugira que o Citybox emitiu a nota. O emitente é
  o contribuinte; o Citybox é o sistema.
- **FR-013**: A marca NÃO PODE deslocar, encobrir ou reduzir nenhum campo exigido pelos
  leiautes oficiais.
- **FR-014**: A marca DEVE permanecer legível em impressão monocromática, como o restante
  do documento.

### Key Entities

- **Documento auxiliar**: representação imprimível de uma nota fiscal autorizada. Deriva
  integralmente do XML autorizado; não possui dados próprios. Identificado pela nota que representa.
- **Nota fiscal** (já existente): a NF-e ou NFS-e autorizada, com seu XML e protocolo.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O lojista obtém o documento auxiliar de uma nota recém-autorizada em até 5 segundos, no
  mesmo fluxo em que emitiu — sem trocar de sistema ou baixar arquivos intermediários.
- **SC-002**: 100% dos documentos gerados para notas autorizadas contêm chave de acesso e protocolo
  correspondentes ao que o órgão fiscal registrou.
- **SC-003**: Um documento gerado em homologação é distinguível de um real **à primeira vista**,
  verificado por inspeção visual de qualquer pessoa não treinada.
- **SC-004**: Reimprimir uma nota de qualquer data produz documento com o mesmo conteúdo da primeira
  geração, verificado por comparação byte a byte do conteúdo textual.
- **SC-005**: Nenhuma solicitação retorna documento para nota não autorizada.
- **SC-006**: Numa leitura do documento por pessoa não treinada, o **emitente** é
  identificado como o contribuinte — nunca como o Citybox — e a marca do Citybox é
  reconhecida como do sistema que o gerou.

---

## Assumptions

- **Formato**: PDF. É o formato que atende impressão e envio digital sem depender do dispositivo, e é
  o que a legislação e os validadores fiscais pressupõem.
- **Fonte de verdade**: o XML autorizado armazenado, não os dados relacionais. O XML é o que o fisco
  reconhece; o banco é conveniência de consulta.
- **Momento da geração**: sob demanda, na solicitação. Gerar antecipadamente para toda nota
  consumiria armazenamento para documentos que talvez nunca sejam pedidos.
- **Idioma e moeda**: português do Brasil e real, conforme os leiautes oficiais.
- **Escopo de emissão**: apenas notas emitidas por esta API. Importar XML de terceiros para gerar
  documento auxiliar é caso de uso distinto, fora deste escopo.

---

## Dependencies

- Notas fiscais autorizadas com XML armazenado — já existente (`GET /nfe/{id}/xml`,
  `GET /nfse/{id}/xml`).
- Leiautes oficiais: Manual de Orientação ao Contribuinte (DANFE) e Padrão Nacional da NFS-e
  (DANFSE).

---

## Ordem de entrega

Decidida em Clarifications: **DANFE primeiro, DANFSE em seguida.**

| Fase | Entrega | Critério de conclusão |
| --- | --- | --- |
| 1 | DANFE (NF-e) — US1 e US3 | Documento de NF-e autorizada, com marca d'água em homologação |
| 2 | DANFSE (NFS-e) — US2 | Documento de NFS-e, com preferência pela API oficial quando disponível |

A fase 1 entrega valor sozinha: o lojista que vende mercadoria fica desbloqueado. A fase 2 não
depende de nada da fase 1 além da infraestrutura de geração compartilhada.

---

## Out of Scope

- **DANFE NFC-e** (modelo 65, cupom fiscal eletrônico): leiaute próprio, formato de bobina, e a API
  não emite NFC-e hoje.
- **Envio automático por e-mail ou WhatsApp**: o endpoint entrega o documento; distribuição é
  responsabilidade de quem consome.
- **Personalização visual por lojista** (logotipo do lojista, cores): os leiautes são
  regulados; desvios arriscam recusa em fiscalização.

  ⚠️ **Não confundir com FR-011.** A marca do **Citybox** no rodapé é crédito de quem fez o
  software, é igual em todo documento e fica fora dos quadros regulados. O que segue fora
  de escopo é o lojista escolher **a própria** identidade visual. O espaço de logotipo que
  o leiaute do DANFE reserva pertence ao **emitente** — se um dia for preenchido, será com
  a logo do lojista, nunca com a do Citybox (ver [research.md § R10](./research.md)).
- **Geração a partir de XML de terceiros**.

---

## Achado de investigação que molda o escopo

Verificado contra os órgãos em 2026-08-07, antes de escrever esta especificação:

**Existe uma API oficial de DANFSE no Padrão Nacional**, mas em produção restrita ela responde
**`501 Not Implemented`**:

```
GET https://sefin.producaorestrita.nfse.gov.br/SefinNacional/danfse/{chave}
  → 501
```

Para a **NF-e não existe equivalente**: a SEFAZ não fornece o DANFE pronto — o emitente é quem gera,
a partir do XML autorizado.

Isso significa que a geração local é **obrigatória para NF-e** e, no mínimo, necessária como caminho
único enquanto a API oficial de DANFSE não estiver disponível em homologação — que é onde o sistema
é testado hoje.

---

## Clarifications

### Session 2026-08-07

- Q: Qual a fonte do DANFSE, dado que a API oficial responde 501 em homologação? → A: **Geração
  local, com a API oficial como preferência quando estiver disponível.** O sistema tem caminho
  próprio para os dois documentos e não fica refém da disponibilidade do órgão; quando a API oficial
  responder, ela vence — é a fonte de maior autoridade.
- Q: Quão evidente deve ser a marcação de homologação? → A: **Marca d'água.** Cobre a página inteira
  e não pode ser recortada, diferente de uma faixa de cabeçalho.
- Q: Qual o escopo da primeira entrega? → A: **DANFE (NF-e) primeiro, DANFSE (NFS-e) em seguida.**
  Sem o DANFE a mercadoria não circula legalmente — é o bloqueio mais duro dos dois.
