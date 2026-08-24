# Feature Specification: DANFSe conforme a NT 008/2026 (Padrão Nacional)

**Feature Branch**: `029-danfse-nt008-conformidade` (acumulada em `feat/fiscal-api`)

**Created**: 2026-08-14

**Status**: Draft

**Input**: Conversa — "a geração local do DANFSe está muito esquisita, bem diferente da
oficial"; comparação contra a **NT 008/2026 (Especificações Técnicas do DANFSe)**.

## Contexto *(registro obrigatório)*

O **DANFSe** é o documento auxiliar impresso/PDF da NFS-e do Padrão Nacional. A
**Nota Técnica nº 008/2026** (SE/CGNFS-e, jul/2026) **padronizou e tornou obrigatório**
o leiaute do DANFSe para todos os sistemas emissores (ERPs inclusive): define seções,
campos obrigatórios, quadros/bordas, identidade visual nacional e regras de impressão.

Hoje a `fiscal-api` gera o DANFSe por uma **implementação própria minimalista**
(`services/fiscal-api/src/modules/auxiliary-documents/infrastructure/pdf/danfse.renderer.ts`),
criada **antes** da NT 008/2026 (decisão research.md R3, quando não havia padrão nem
biblioteca auditável). O resultado diverge fortemente do oficial:

- leiaute em **texto corrido, sem quadros/bordas**;
- **sem a identidade visual nacional** (só a palavra "DANFSE");
- faltam seções/campos: **endereço** de prestador e tomador, **intermediário**, **local
  da prestação**, **base de cálculo**, **deduções/descontos**, **retenções federais**
  (IRRF/PIS/COFINS/CSLL/INSS), **totais de tributos**;
- o `nfse-xml.reader.ts` **nem extrai** boa parte desses campos.

Como o endpoint oficial do órgão ainda responde **`501 Not Implemented`** (spec 004, R9),
não é possível baixar o PDF pronto do Sefin — **a geração local é o que o contribuinte
efetivamente recebe**. Logo, conformar a geração local à NT 008/2026 é o que fecha o gap.

Fonte oficial: NT 008/2026 — Especificações Técnicas do DANFSe (gov.br/nfse).

## Clarifications

### Session 2026-08-14

- Q: Nível de fidelidade do leiaute à NT 008/2026? → A: **Estrutural** — mesmas seções,
  quadros/bordas, ordem e campos da NT, visualmente próximo do oficial; sem exigir
  medidas/margens/fontes idênticas ao pixel.
- Q: Identidade visual nacional no cabeçalho (FR-002) — asset? → A: **Oficial com
  fallback** — usar o asset oficial da NFS-e nacional quando disponível/licenciado; enquanto
  não houver, cabeçalho textual padronizado ("NFS-e — Padrão Nacional") no slot reservado.
- Q: Retenções federais / totais quando o campo não vier no XML? → A: **Omitir** a
  linha/seção (sem zeros falsos) — exibir só o que a nota tem.
- Q: Como verificar a conformidade (SC-001)? → A: **Medição + amostra** — teste
  automatizado confere presença/ordem das seções e campos obrigatórios no PDF gerado +
  amostra visual em `amostras/` para sign-off humano.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - DANFSe com aparência e estrutura do Padrão Nacional (Priority: P1)

Ao baixar/imprimir o DANFSe de uma NFS-e autorizada, o usuário recebe um documento com a
**mesma estrutura visual do modelo oficial**: cabeçalho com a identidade visual nacional,
seções demarcadas por **quadros/bordas** na ordem da NT (Prestador → Tomador →
Intermediário → Serviço → Valores/Base de cálculo → Tributos/Deduções → Totalizadores →
Chave/Código de verificação → QR Code), em A4.

**Why this priority**: é o cerne do problema relatado — o documento atual "não parece" um
DANFSe oficial.

**Independent Test**: gerar uma amostra a partir de um XML autorizado e conferir
visualmente contra o modelo da NT 008/2026 (conferência visual, como já exige o SC-003 da
spec 004).

**Acceptance Scenarios**:
1. **Given** um XML de NFS-e autorizado, **When** gero o DANFSe, **Then** cada seção
   aparece dentro de um quadro com título, na ordem definida pela NT.
2. **Given** o DANFSe gerado, **When** comparo com o modelo oficial, **Then** cabeçalho,
   identidade visual, QR Code e chave/código de verificação estão nas posições previstas.
3. **Given** o papel A4, **When** o documento é impresso, **Then** o leiaute cabe sem
   cortar seções.
4. **Given** um DANFSe ou um DANFE gerado, **When** inspeciono o rodapé, **Then** **não**
   há logotipo nem legenda da plataforma Citybox (FR-014).

---

### User Story 2 - Todos os campos exigidos pela NT, corretos (Priority: P1)

O DANFSe apresenta **todos os campos obrigatórios** da NT 008/2026, lidos do XML
autorizado: prestador (com endereço e IM), tomador (com endereço), intermediário quando
houver, serviço (descrição, local da prestação, código/item, valor unitário, quantidade,
alíquota), valores (base de cálculo, deduções, descontos, valor líquido), tributos
(ISS + **retenções federais** IRRF/PIS/COFINS/CSLL/INSS) e **totalizadores** de tributos.

**Why this priority**: um leiaute bonito com metade dos campos ainda é não-conforme.

**Independent Test**: erp/fiscal-api — a partir de um XML com todos os grupos preenchidos,
verificar que cada campo da NT aparece com o valor correto; campos ausentes no XML seguem
a regra de exibição da NT (omitir/zerar conforme o campo).

**Acceptance Scenarios**:
1. **Given** um XML com endereço, intermediário, deduções e retenções federais, **When**
   gero o DANFSe, **Then** todos esses valores aparecem nas seções corretas.
2. **Given** um XML sem intermediário, **When** gero o DANFSe, **Then** a seção
   Intermediário é omitida (não sai vazia), conforme a NT.
3. **Given** retenções federais no XML, **When** gero, **Then** IRRF/PIS/COFINS/CSLL/INSS
   e o valor líquido consideram as retenções.

---

### User Story 3 - Não-regressão: cancelada/substituída e marca de homologação (Priority: P2)

O documento de uma nota **cancelada** ou **substituída** continua sinalizado, e a **marca
d'água de homologação** continua aplicada — inclusive se, no futuro, o PDF vier do órgão
(a marca é aplicada fora do renderizador, research.md R4).

**Why this priority**: comportamentos já entregues (spec 004) não podem regredir no
retrabalho do leiaute.

**Acceptance Scenarios**:
1. **Given** uma nota cancelada, **When** gero o DANFSe, **Then** o documento exibe a
   marcação de cancelamento.
2. **Given** ambiente de homologação, **When** gero o DANFSe, **Then** a marca d'água de
   homologação está presente.

---

### Edge Cases

- Campo ausente no XML: **omitir** a seção/linha (seção opcional como Intermediário; linhas
  de retenção federal ou de totais que a nota não trouxe) — **sem zeros falsos**. Só campos
  estruturais sempre presentes (ex.: valor do serviço) exibem o valor.
- Descrição de serviço longa / múltiplas linhas: não pode estourar o quadro nem empurrar
  seções para fora da página.
- Tomador não identificado (sem documento): exibir "NÃO IDENTIFICADO" conforme já feito.
- Alíquota definida pelo município (sem retenção): manter o texto explicativo, não um valor
  falso.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O DANFSe DEVE ser renderizado com **seções demarcadas por quadros/bordas**,
  na **ordem definida pela NT 008/2026**, em papel A4. Fidelidade **estrutural** (mesmas
  seções, quadros, ordem e campos, visualmente próximo do oficial) — **não** se exige
  reprodução de medidas/margens/fontes idênticas ao pixel.
- **FR-002**: O cabeçalho DEVE conter a **identidade visual nacional** da NFS-e: usar o
  **asset oficial** quando disponível e licenciado; enquanto não houver, exibir um
  **cabeçalho textual padronizado** ("NFS-e — Padrão Nacional") no slot reservado. O
  leiaute reserva o mesmo espaço nos dois casos, para a troca não mexer no resto.
- **FR-003**: A seção Prestador DEVE incluir CNPJ, nome, **endereço** e Inscrição
  Municipal.
- **FR-004**: A seção Tomador DEVE incluir CNPJ/CPF, nome e **endereço**.
- **FR-005**: A seção **Intermediário** DEVE ser exibida quando presente no XML e omitida
  quando ausente.
- **FR-006**: A seção Serviço DEVE incluir descrição, **local da prestação**, código/item
  do serviço, valor unitário, quantidade e alíquota do ISS.
- **FR-007**: A seção Valores DEVE incluir **base de cálculo, deduções, descontos** e valor
  líquido.
- **FR-008**: A seção Tributos DEVE incluir ISS (retido/não) e as **retenções federais**
  IRRF, PIS, COFINS, CSLL e INSS. Retenção **ausente no XML é omitida** (não sai como
  `0,00` — não se dá a entender retenção onde não há).
- **FR-009**: O documento DEVE apresentar **totalizadores de tributos** (federais e
  municipais / transparência tributária) presentes no XML; totais **ausentes são omitidos**
  (sem linhas zeradas falsas).
- **FR-010**: O documento DEVE apresentar a **chave de acesso** legível + codificada e o
  **QR Code** de consulta pública, e o **código de verificação** quando exigido pela NT.
- **FR-011**: O `reader` DEVE extrair do XML autorizado **todos os campos** acima (hoje
  extrai um subconjunto).
- **FR-012 (NÃO-REGRESSÃO)**: A sinalização de nota **cancelada/substituída** e a **marca
  d'água de homologação** DEVEM continuar funcionando, com a marca aplicada **fora** do
  renderizador (research.md R4).
- **FR-013**: A arquitetura **"oficial primeiro, local em seguida"** (spec 004, FR-002a)
  DEVE ser mantida — quando o endpoint oficial passar a responder `200`, o PDF do órgão é
  preferido; a conformidade desta feature vale para o **caminho local**, que é o real hoje.
- **FR-014 (REMOÇÃO DA MARCA CITYBOX)**: A marca Citybox — **logotipo + legenda**
  "Documento emitido pela plataforma Citybox · citybox.com.br" — DEVE ser **removida** do
  rodapé de **ambos** os documentos auxiliares: **DANFE** (modelo 55) e **DANFSe**. Um
  documento fiscal padronizado não deve exibir logo de fornecedor concorrendo com a
  identidade visual nacional exigida pela NT 008/2026. **Isto reverte a FR-011..FR-014 da
  spec 004** (marca Citybox "sempre presente", research.md R10) — a decisão anterior fica
  substituída por esta. Aplica-se também quando o PDF vier do órgão (não recarimbar marca
  de fornecedor sobre o documento oficial).

### Key Entities

- **DANFSe**: documento auxiliar derivado **integralmente do XML autorizado** (não tem
  dado próprio); identificado pela nota que representa.
- **NfseDocumentData** (modelo de leitura): estendido para carregar endereços,
  intermediário, base de cálculo, deduções/descontos, retenções federais e totais.

## Success Criteria *(mandatory)*

- **SC-001**: A conformidade é verificada por **duas vias**: (a) teste automatizado confere
  a **presença e a ordem** das seções e dos campos obrigatórios da NT no PDF gerado (texto
  extraído); (b) **amostra visual** em `amostras/` aprovada em conferência humana contra o
  modelo da NT 008/2026 (estrutura em quadros + identidade visual + ordem das seções).
- **SC-002**: 100% dos campos obrigatórios da NT presentes no XML aparecem no documento,
  com o valor correto.
- **SC-003**: Seções opcionais ausentes no XML (ex.: Intermediário) não aparecem vazias.
- **SC-004**: Nota cancelada/substituída é sinalizada e a marca d'água de homologação está
  presente (sem regressão).
- **SC-005**: O documento cabe em A4 sem cortar seções, inclusive com descrição longa.
- **SC-006**: Nem o DANFE nem o DANFSe exibem o logotipo ou a legenda da plataforma
  Citybox — o rodapé de marca de fornecedor não aparece em nenhum dos dois.

## Assumptions

- **Identidade visual nacional (logo)** *(decidido — ver Clarifications)*: usar o asset
  oficial da NFS-e nacional quando disponível/licenciado; enquanto não houver, cabeçalho
  textual padronizado ("NFS-e — Padrão Nacional") no slot reservado. A troca asset↔texto
  não altera o resto do leiaute. (Detalhe de plan: obter o arquivo/licença oficial.)
- **Fonte da verdade dos campos**: sempre o XML autorizado; a feature não inventa dados
  nem consulta outras tabelas (mantém o isolamento do renderer, research.md R7).
- **Emissão em produção permanece fora de escopo** — o endpoint oficial do DANFSe ainda
  responde `501`; esta feature conforma a **geração local**, não liga produção.
- **DANFE (modelo 55): só a remoção da marca Citybox (FR-014)** — o leiaute do DANFE em si
  fica fora (já usa biblioteca regulada, research.md R2). A conformidade de leiaute
  (FR-001..FR-010) é só do DANFSe.
- A marca Citybox é aplicada por um estágio compartilhado (o `BrandStamper`) sobre o PDF
  pronto dos dois documentos; removê-la (FR-014) desliga esse estágio e ajusta o teste que
  hoje trava a presença da marca (spec 004).
- Sem harness de teste de frontend no erp-web (D0) — a conferência do documento é no
  backend (fiscal-api, testes de renderização/leitura) + amostra visual em `amostras/`.

## Out of Scope

- Ligar a emissão real em produção (dependência externa: endpoint oficial `501`).
- Alterar o **leiaute** do DANFE (modelo 55) — apenas a remoção da marca Citybox (FR-014)
  toca o DANFE.
- Mudar o contrato de emissão da NF-e/NFS-e (só o documento auxiliar).
