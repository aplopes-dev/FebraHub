# Research — NFC-e (cupom fiscal, modelo 65)

**Data**: 2026-08-08 · **Spec**: [spec.md](./spec.md)

Verificações feitas contra o código existente e a biblioteca já adotada, nesta data.

---

## R1 — Pipeline novo ou extensão do que já existe? ⭐

**Decisão**: **estender o pipeline da NF-e**, parametrizando modelo e tipo de emissão.
Não criar um módulo paralelo.

**Rationale**: a NFC-e não é um documento tecnicamente distinto da NF-e — é **o mesmo
schema, o mesmo webservice, a mesma assinatura**, com `mod=65` em vez de `55`. O que muda
é o conteúdo (destinatário opcional, grupo de pagamento obrigatório, QR Code) e o leiaute
impresso.

O que a inspeção do código mostrou:

| Peça | Situação |
| --- | --- |
| `nfe-xml.builder.ts` | `NFE_MODEL = '55'` fixo em **2 lugares**; `tpEmis: '1'` fixo em 2 |
| `recipient: NfeRecipient` | **Obrigatório** — NFC-e precisa opcional |
| `infNFeSupl` (QR Code) | Ausente — é o grupo exclusivo da NFC-e |
| XSD `nfe_v4.00` | **O mesmo** serve os dois modelos |
| `SefazBaNfeProvider`, `fiscal-soap`, assinatura | Reaproveitáveis sem mudança |
| `FiscalSequence` | Já chaveada por `documentType` — ver R6 |

**Alternativa rejeitada**: módulo `nfce` próprio, com builder próprio. Duplicaria ~800
linhas de montagem de grupos tributários que precisam permanecer idênticas entre os dois
modelos — e a NF-e já sangrou várias rodadas de rejeição (`745`, `486`, `487`) até acertar
esses grupos. Duas cópias divergiriam na primeira correção aplicada só de um lado.

**Custo aceito**: o builder ganha condicionais por modelo. Mitigado mantendo a assinatura
de entrada explícita (`model`, `emissionType`) em vez de inferir de outros campos.

---

### 🔴 R1 ESTÁ ERRADO no ponto do webservice (E2E de 2026-08-09)

A premissa "NFC-e usa o **mesmo webservice** da NF-e; só o modelo muda dentro do XML"
**foi desmentida pela SEFAZ-BA**, no primeiro E2E real:

```
Rejeição 702: NFC-e não é aceita pela UF do Emitente
```

O cupom foi montado, assinado, validado contra o XSD e **transmitido com sucesso** — a
SEFAZ recebeu, entendeu e recusou por regra de negócio. Ou seja: XML, assinatura,
transporte e schema estão certos. O que está errado é **para onde enviamos**.

**A Bahia DELEGA a NFC-e ao SVRS.** O *Manual de Configuração do Programa Emissor NFC-e*
da SEFAZ-BA (fev/2018) traz as tabelas sob o cabeçalho **"HOMOLOGAÇÃO NFC-e - SEFAZ
VIRTUAL SVRS"**. O certificado é o mesmo da NF-e; o endpoint não.

⚠️ Registro de método: cheguei a afirmar o contrário a partir de uma thread de fórum,
que dizia ser a BA autorizadora própria. Estava errado, e a fonte oficial corrigiu — o
PDF baixa normalmente com `curl -k`; o que falhava era a validação de cadeia do
WebFetch, não o documento.

| Serviço | Homologação (SVRS) |
| --- | --- |
| NFeAutorizacao 4.00 | `https://nfce-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx` |
| NFeRetAutorizacao | `.../ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx` |
| NfeInutilizacao | `.../ws/nfeinutilizacao/nfeinutilizacao4.asmx` |
| NfeConsultaProtocolo | `.../ws/NfeConsulta/NfeConsulta4.asmx` |
| RecepcaoEvento | `.../ws/recepcaoevento/recepcaoevento4.asmx` |

Os caminhos **não são deriváveis** do padrão da Bahia (`/webservices/{op}/{op}.asmx`):
o SVRS usa `/ws/`, com nomes que variam por operação e até na caixa. Daí o mapa
explícito em `sefaz-ba-config.ts`, copiado do manual.

**O que muda no código**: `sefaz-ba-config.ts` monta a URL como
`${baseUrl}/webservices/${operation}/${operation}.asmx`, sem considerar o modelo.
Precisa de um endpoint próprio para o 65 — provavelmente uma variável
`SEFAZ_BA_NFCE_HOMOLOGATION_ENDPOINT`, e **não** o mesmo `SEFAZ_BA_NFE_*`.

**URLs de consulta, confirmadas no mesmo manual** (seções 6 e 7):

| Campo | Homologação | Chars |
| --- | --- | --- |
| `qrCode` | `http://hnfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx` | 53 |
| `urlChave` | `http://hinternet.sefaz.ba.gov.br/nfce/consulta` | 46 |

⚠️ **Hosts diferentes** — `hnfe.` e `hinternet.`. E o `urlChave` tem de ser a forma
curta: o XSD limita a 85 caracteres e o caminho completo da página de consulta tem 87.

## R2 — QR Code da NFC-e ⚠️

**Decisão**: calcular o conteúdo do QR Code **depois de assinar** e inseri-lo em
`infNFeSupl` antes de transmitir.

> ⚠️ **Corrigido em 2026-08-09, ao implementar T015.** A decisão original mandava calcular o
> QR Code *antes* de assinar. Está errada, e teria produzido contingência quebrada — ver
> "A ordem, corrigida" abaixo.

**Rationale** — a ordem aqui não é preferência, é obrigação estrutural:

O QR Code da NFC-e não é uma imagem decorativa: seu **conteúdo** é um texto padronizado
(URL de consulta + parâmetros + hash) que precisa estar **dentro do XML transmitido**, no
grupo `infNFeSupl`. O hash é calculado sobre os parâmetros concatenados com o **CSC**.

`infNFeSupl` é irmão de `infNFe` dentro de `NFe` e fica **fora do elemento assinado** — a
assinatura cobre `infNFe`. É justamente isso que torna a inserção pós-assinatura legítima:
acrescentar `infNFeSupl` **não invalida** a assinatura já aplicada.

### A ordem, corrigida

```
1. montar infNFe          (define a chave de acesso)
2. assinar infNFe         (produz o DigestValue)
3. calcular o QR Code     (chave + CSC; na contingência, TAMBÉM o DigestValue)
4. inserir infNFeSupl
5. transmitir
```

**Por que a ordem original não serve**: na emissão em contingência offline o conteúdo do QR
Code inclui o `digVal` — o `DigestValue` da assinatura. Ele **não existe antes de assinar**.
Calcular o QR Code no passo 2 funcionaria para a emissão normal e falharia exatamente no
caminho de contingência, que é o menos exercitado e o mais caro de descobrir quebrado: o
consumidor já levou o papel.

**O que continua valendo da análise original**: transmitir sem `qrCode` é a falha grave, e
ela é silenciosa — o cupom pode ser autorizado e ficar inconsultável. O que muda é onde
travar: não na ordem relativa à assinatura, mas na garantia de que **nada é transmitido sem
`infNFeSupl`**, e de que inserir o grupo não quebra a assinatura.

### O formato veio do XSD, não de documentação em prosa (2026-08-09)

O `leiauteNFe_v4.00.xsd` **já no repositório** traz, no elemento `infNFeSupl/qrCode`, os
regex de cada versão do QR Code. É autoridade local e verificável — muito melhor que
qualquer descrição em texto. Conferir contra ele desmentiu três coisas da primeira
implementação:

| O que eu tinha | O que o XSD diz |
|---|---|
| Contingência com `dhEmi` inteiro em hexadecimal | Apenas o **dia** (`01`–`31`) |
| Contingência com campo `vICMS` | **Não existe** na V2 — é da V1 |
| Contingência com 9 campos | **8 campos** |
| `cIdToken` como `000001` | Zeros à esquerda **proibidos**: `(0\|[1-9]{1}([0-9]{1,5})?)` |

Os três primeiros são herança da V1 do QR Code, que saiu de uso. Nenhum deles quebraria a
emissão normal — só a contingência, o caminho menos exercitado.

A suíte agora valida o conteúdo gerado contra esses regex copiados literalmente do XSD. O
que eles **não** cobrem é o hash: para o schema ele é só `[A-Fa-f0-9]{40}`, então um SHA-1
do texto errado passa. Essa parte continua dependendo do Cenário 2 do quickstart.

**Existe uma V3** (`|3|` na versão) que dispensa o hash. Ficou de fora: a V2 é a
amplamente aceita, e adotar a V3 sem poder testá-la contra o órgão trocaria um risco
conhecido por um desconhecido.

**A imagem** do QR Code é problema do documento impresso, não do XML — e o `bwip-js`/
`qrcode` já adotados na feature 004 resolvem.

---

## R3 — Onde guardar o CSC

**Decisão**: reaproveitar o mesmo caminho de cifragem já usado para a senha do certificado
(`cert-encryption`), com o CSC em colunas próprias do Emitente.

**Rationale**: o CSC é um segredo por Emitente, exatamente como a senha do PKCS#12 —
mesma natureza, mesmo ciclo de vida, mesma exigência de nunca aparecer em log. Introduzir
um segundo mecanismo de cifragem para o mesmo tipo de segredo criaria duas superfícies
para auditar e duas chaves para rotacionar.

São **dois valores**: o identificador (`CSCId`, curto, não é segredo) e o token (o segredo).
Só o segundo é cifrado.

**Alternativa rejeitada**: guardar o CSC junto do certificado, no object storage. O
certificado é um arquivo binário grande; o CSC é um texto curto consultado a cada emissão.
Ida ao storage por cupom seria latência desnecessária contra o orçamento de 5 s (SC-001).

---

## R4 — Contingência (queda da SEFAZ)

**Decisão**: emissão com **tipo de emissão de contingência offline**, fila persistente e
retransmissão ordenada.

**Rationale**: o próprio leiaute prevê o caso — há um campo de tipo de emissão que
distingue emissão normal de contingência, e o documento impresso precisa exibir a
condição. Não é gambiarra nossa; é o caminho legal.

Três propriedades que o desenho precisa garantir, e que a spec exige:

1. **Ordem**. Os cupons pendentes são transmitidos na ordem de emissão. Fora de ordem, a
   numeração chega quebrada à SEFAZ.
2. **Prazo**. A transmissão posterior tem prazo legal. Um cupom que fica na fila além dele
   vira problema fiscal, não pendência técnica — precisa de alarme, não de retry silencioso.
3. **Rejeição visível** (FR-012). O consumidor **já levou o papel**. Um cupom de
   contingência rejeitado depois não pode falhar em silêncio.

### Três desfechos, não dois (descoberto em T048, 2026-08-09)

A redação original desta decisão tratava a falha como binária: **respondeu** ou **não
respondeu**. São três, e o terceiro é o perigoso.

| Desfecho | O que significa | Ação |
|---|---|---|
| Respondeu (autorizado/rejeitado) | O órgão decidiu | Aceitar. Rejeição **não** vira contingência |
| Inalcançável | O envio não aconteceu; a SEFAZ não viu nada | **Contingência** |
| Desconhecido | Enviamos e não sabemos se chegou | **Consultar** — nunca contingência |

**Por que "desconhecido" não pode virar contingência**: o tipo de emissão ocupa o dígito 35
da chave de acesso, então o cupom de contingência é um documento **diferente**, com chave
diferente. Se a transmissão original chegou e foi autorizada, emitir a versão de
contingência cria **dois documentos fiscais para uma venda** — os dois válidos, um
impossível de justificar numa fiscalização, e a descoberta acontece semanas depois na
conciliação, quando ninguém sabe qual cancelar.

A tentação é tratar os dois casos juntos ("a SEFAZ está fora de qualquer jeito, e o caixa
precisa vender"). O código separa em `domain/contingency/contingency-decision.ts`, com o
`switch` exaustivo sobre união discriminada para que um desfecho novo vire erro de
compilação.

**Alternativa rejeitada**: retentar em memória até a SEFAZ voltar. Um restart do serviço
perderia cupons já entregues ao consumidor — a pior falha possível nesta feature.

---

## R5 — Documento auxiliar: bobina e A4

**Decisão**: **bobina pela biblioteca já adotada**; **A4 com renderizador próprio**,
reusando a arquitetura da feature 004.

**Rationale** — descoberta que economiza a maior parte do trabalho:

A `@alexssmusica/node-pdf-nfe`, já em uso para o DANFE, **também gera DANFE NFC-e**. Ela
despacha pelo modelo:

```js
// lib/domain/use-cases/pdf/index.js
if (nfeProc.NFe.infNFe.ide.mod === '55') return pdfNFe(...)
else                                     return pdfNFCe(...)   // bobina
```

E a página da NFC-e é `[larguraPagina, 1000]` — largura fixa, altura generosa: o formato de
bobina. Ou seja: passar um XML modelo 65 ao renderizador **já existente** produz o cupom em
bobina, sem código novo de leiaute.

O **A4** (FR-007a) não vem da biblioteca — é nosso, e encaixa na porta
`AuxiliaryDocumentRenderer` da feature 004 como uma terceira implementação, ao lado de
`DanfeRenderer` e `DanfseRenderer`.

**Consequência**: a marca d'água de homologação e a marca Citybox, já implementadas como
estágios independentes do renderizador, aplicam-se aos dois formatos **sem alteração**. Foi
exatamente para isso que foram separadas.

---

## R6 — Numeração própria (FR-002)

**Decisão**: acrescentar o valor `NFCE` ao tipo de documento. Nenhuma tabela nova.

**Rationale**: a `fiscal_sequences` já é única por
`(companyId, documentType, series, environment)`. Um valor de enum novo dá numeração
isolada **de graça** — a NFC-e não compartilha sequência com a NF-e porque a chave já
separa por tipo.

⚠️ Efeito colateral conhecido nesta base: `DocumentType` tem **três espelhos manuais**
(enum Postgres, `DOCUMENT_TYPES` no domínio, e o `FILE_PREFIX` da feature 004). Acrescentar
um valor exige tocar os três — divergência não quebra compilação, quebra no INSERT em
runtime. Já documentado em `fiscal-document.entity.ts`.

---

## R7 — Limite de valor sem identificação (FR-004)

**Decisão**: validar **antes** de reservar numeração, com o limite configurável por UF.

**Rationale**: recusar depois de reservar o número **queima numeração** — e número
queimado precisa de inutilização junto à SEFAZ, um procedimento administrativo. Esta base
já pagou por isso: a recusa de ambiente PRODUCTION acontecia depois da reserva e deixou
sete documentos órfãos, corrigido movendo a verificação para antes.

Configurável por UF, e não constante, porque o limite é definido por legislação estadual e
muda sem aviso do nosso lado.

---

## Resumo do reaproveitamento

| Peça | Origem |
| --- | --- |
| Assinatura, SOAP, TLS mútuo, cadeia ICP-Brasil | ✅ existente, sem mudança |
| XSD `nfe_v4.00` | ✅ o mesmo |
| `SefazBaNfeProvider` (autorizar/consultar/cancelar/inutilizar) | ✅ existente |
| `nfe-xml.builder` | 🟡 parametrizar modelo, tipo de emissão, destinatário opcional |
| DANFE NFC-e bobina | ✅ biblioteca já adotada |
| Marca d'água e marca Citybox | ✅ estágios independentes da feature 004 |
| Numeração isolada | 🟡 um valor de enum |
| QR Code, CSC, contingência, DANFE A4 | 🔴 novos |
