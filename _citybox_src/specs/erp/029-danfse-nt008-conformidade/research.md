# Research — DANFSe conforme a NT 008/2026

Todas as NEEDS CLARIFICATION foram resolvidas no `/speckit-clarify` (spec §Clarifications).
Este documento consolida as decisões de design.

## R1 — Nível de fidelidade ao leiaute

- **Decisão**: fidelidade **estrutural** — mesmas seções, quadros/bordas, ordem e campos da
  NT; visualmente próximo do oficial, **sem** reproduzir medidas/margens/fontes ao pixel.
- **Rationale**: o valor pro usuário é "parecer um DANFSe oficial e ter os campos certos".
  Perseguir pixel-perfect multiplica o esforço e cria retrabalho a cada revisão da NT, sem
  ganho proporcional. A verificação (R4) mede presença/ordem, não milímetros.
- **Alternativas**: (a) à risca — rejeitada pelo custo/retrabalho; (b) mínimo (só campos, sem
  quadros) — rejeitada, contradiz US1 (continuaria "esquisito").

## R2 — Identidade visual nacional (FR-002)

- **Decisão**: **oficial com fallback**. Usar o asset **oficial** da NFS-e nacional (já obtido,
  ver abaixo); o **cabeçalho textual padronizado** ("NFS-e — Padrão Nacional") permanece como
  fallback caso o asset falhe ao carregar. O slot tem o mesmo tamanho nos dois casos.
- **Asset obtido** (2026-08-15): logo horizontal oficial baixada da documentação técnica da
  NFS-e (gov.br/nfse › logos da NFS-e) para
  `services/fiscal-api/resources/brand/nfse-nacional-horizontal.png` (PNG 1920×389, RGBA).
  Fonte oficial gov.br — uso do documento auxiliar padronizado. Como é PNG (raster), embutir
  via `pdf-lib`/pdfkit `image()` (não `svg-to-pdfkit`), preservando proporção (~4.94:1) no slot
  do cabeçalho.
- **Rationale**: usar a identidade oficial é o que a NT pede; o fallback textual garante que a
  geração nunca quebra por um problema no asset. A troca asset↔texto fica isolada num único
  ponto do renderer.
- **Alternativas**: só texto (sem logo) — rejeitada, não cumpre a identidade; exigir SVG —
  desnecessário, o oficial disponível é PNG horizontal de alta resolução.

## R3 — Campos ausentes no XML (retenções federais / totais)

- **Decisão**: **omitir** a linha/seção quando o campo não existe no XML — sem `0,00` falso.
- **Rationale**: um `0,00` de retenção **afirma** que não houve retenção; a ausência do campo
  no XML significa "não informado", não "zero". Omitir evita declarar algo que a nota não diz.
  Seções opcionais inteiras (ex.: Intermediário) também são omitidas quando ausentes.
- **Alternativas**: sempre exibir com `0,00` — rejeitada (pode induzir a erro de leitura).

## R4 — Verificação de conformidade (SC-001)

- **Decisão**: **duas vias**. (a) teste automatizado extrai o texto do PDF gerado e afirma a
  **presença e a ordem** das seções e dos campos obrigatórios da NT; (b) **amostra visual**
  em `amostras/` para sign-off humano contra o modelo da NT.
- **Rationale**: o automatizado trava regressão de campo/ordem de forma barata e repetível; a
  amostra cobre o que o automatizado não vê (aparência dos quadros, identidade). O projeto já
  tem o padrão de amostra visual (spec 004 SC-003, `gerar-amostras.spec.ts`).
- **Nota técnica**: o `pdfkit` gera texto extraível; o teste pode afirmar substrings/rótulos e
  a ordem relativa dos títulos de seção (mesma abordagem dos builder tests da NF-e).

## R5 — Remoção da marca Citybox (FR-014)

- **Decisão**: remover a marca (logo + legenda) de **DANFE e DANFSe**, desligando o estágio
  `BrandStamper` no `get-auxiliary-document.use-case.ts` (a chamada `brandStamper.stamp`),
  e removendo a porta `domain/branding.ts`, a impl `citybox-brand.stamper.ts`, o provider no
  módulo e o asset `resources/brand/citybox-logotipo.svg`.
- **Rationale**: documento fiscal padronizado não deve exibir marca de fornecedor concorrendo
  com a identidade nacional (NT). Reverte a FR-011..014 da spec 004 (marca "sempre presente",
  R10) — decisão explicitamente substituída pela do usuário.
- **Cuidado (não-regressão FR-012)**: a **marca d'água de homologação** (`WatermarkStamper`) é
  um estágio **separado** e **permanece**; após remover o brand, `content` passa a ser
  `rendered` (produção) ou `watermark(rendered)` (homologação). O teste que hoje trava a
  presença da marca Citybox é **removido/reescrito** para afirmar a **ausência** dela.
- **Alternativas**: remover só do DANFE / só a logo mantendo a legenda — descartadas pela
  resposta do clarify ("logo+legenda, ambos").

## R6 — Mapa de campos do XML (reader estendido, FR-011)

- **Decisão**: estender `readNfseXml`/`NfseDocumentData` lendo os elementos do **Padrão
  Nacional 1.01** (`resources/xsd/nfse/1.01/`), mantendo a busca por nome de elemento
  (tolerante a profundidade, como hoje) — número/chave do nível `infNFSe`, demais da DPS
  aninhada.
- **Campos a mapear** (nomes confirmar no XSD durante a implementação):
  - Endereço prestador/tomador: grupo `end`/`enderNac` (`xLgr`, `nro`, `xBairro`, `cMun`/
    `xMun`, `UF`, `CEP`).
  - Intermediário: grupo `interm` (documento + nome), quando presente.
  - Serviço: `locPrest` (local da prestação), `cServ`/item LC116, `cTribNac`, quantidade/valor
    unitário quando existirem.
  - Valores: base de cálculo, deduções, descontos, valor líquido (grupo `valores`/`trib`).
  - Tributos: `tribMun` (ISS: `pAliq`, `vISS`, `tpRetISSQN`); `tribFed` (retenções: IRRF, PIS,
    COFINS, CSLL, INSS/CP); `totTrib` (totais/transparência).
- **Rationale**: o XSD é a fonte de verdade estável dos nomes; a fixture atual é mínima e
  precisa ganhar um XML "cheio" para os testes de presença.
- **Risco**: campos que o Simples/prestador não preenche vêm ausentes → omitidos (R3).

## R7 — Abordagem de desenho: grade do DANFSe v2.0 (renderer)

- **Decisão (revisada na conferência com o modelo oficial)**: reproduzir o **formulário
  oficial do DANFSe v2.0** — uma **grade** de barras de seção sobre células rotuladas (rótulo
  pequeno no topo, valor abaixo), tudo emoldurado, como o DANFE. Helpers em `danfse-layout.ts`
  (`sectionBar`, `cellRow`, `textBox`, `ensureSpace`); A4 retrato. O primeiro corte (quadros
  simples, um campo por linha) **não** batia com o modelo — o usuário apontou a divergência
  contra o modelo da NT 008/2026 (imagem oficial) e a documentação técnica (RTC NT-008 v1.02).
- **Ordem/seções**: cabeçalho (identidade / título / município) → chave + QR + identificação
  → PRESTADOR/FORNECEDOR → TOMADOR/ADQUIRENTE → [INTERMEDIÁRIO] → SERVIÇO PRESTADO →
  TRIBUTAÇÃO MUNICIPAL (ISSQN) → TRIBUTAÇÃO FEDERAL (EXCETO CBS) → VALOR TOTAL DA NFS-e →
  INFORMAÇÕES COMPLEMENTARES → rodapé.
- **Célula sem dado → em branco** (só o rótulo), como o template oficial — reconciliando com R3:
  não se fabrica `R$ 0,00`; a seção federal é fixa e aparece com células vazias quando não há
  retenção. Autenticação por **QR** (o v2.0 usa QR, não código de barras 1D).
- **Seções omitidas por falta de fonte no Padrão Nacional 1.01**: `DESTINATÁRIO DA OPERAÇÃO` e
  `TRIBUTAÇÃO IBS/CBS` (reforma tributária, ainda não emitida) — acrescentar quando houver dado.
- **Paginação**: `ensureSpace` empurra a seção inteira para a próxima página quando não cabe;
  a descrição do serviço mede a altura antes (SC-005).
- **Alternativas**: HTML→PDF (headless browser) — rejeitada (binário nativo pesado, contra
  Princípio IV); quadros simples/texto corrido — rejeitada (não corresponde ao modelo oficial).
