# Research — DANFE / DANFSE

**Data**: 2026-08-07 · **Spec**: [spec.md](./spec.md)

Todas as consultas a registries e órgãos foram feitas nesta data. Onde há número de
downloads, é o último mês.

---

## R1 — Motor de renderização do PDF

**Decisão**: `pdfkit` (MIT, 23M downloads/mês) como motor de desenho.

**Rationale**: DANFE não é um documento fluido — é um **formulário de posições fixas**
(MOC Anexo II define quadros, larguras e ordem). PDFKit dá posicionamento absoluto, que é
exatamente o modelo do leiaute. É JS puro: nada de binário nativo no container, nada de
Chromium.

Sinal decisivo: **todas as bibliotecas maduras de DANFE em Node convergem para pdfkit**
(ver R2). Quando implementações independentes do mesmo leiaute escolhem a mesma base, a
base está validada pelo problema.

**Alternativas rejeitadas**:

| Alternativa | Por que não |
| --- | --- |
| Puppeteer / HTML→PDF | Chromium (~300 MB) no container de uma API fiscal. Custo de imagem e superfície de ataque desproporcionais para gerar um formulário estático. |
| `pdfmake` | Modelo declarativo de fluxo; DANFE precisa de coordenada absoluta. Lutaria contra a ferramenta. |
| `@react-pdf/renderer` | Flexbox em PDF, 13 dependências, e nenhuma implementação de DANFE conhecida a validá-lo. |
| `jspdf` | Orientado a browser. |

---

## R2 — DANFE: adotar biblioteca ou implementar

**Decisão**: **adotar `@alexssmusica/node-pdf-nfe`** (MIT, 1.2.21, publicada 2026-07-03),
encapsulada atrás de uma porta própria.

**Rationale**: o leiaute do DANFE é regulado e extenso. Existe biblioteca MIT, mantida
neste ano, cuja assinatura encaixa exatamente no que a spec exige:

```js
gerarPDF(xml, { pathLogo, cancelada })
```

Ela consome **o XML autorizado** — que FR-001 já define como a única fonte legítima — e
tem sinalização de cancelamento, que é FR-006. Não há transformação intermediária nossa
para divergir do que o fisco tem.

A regra de *Research & Reuse* do projeto manda procurar implementação pronta antes de
escrever. Aqui ela existe, é permissiva e é mantida.

**Alternativas avaliadas**:

| Pacote | Licença | Downloads/mês | Veredito |
| --- | --- | --- | --- |
| `@alexssmusica/node-pdf-nfe` | MIT | 5.120 | ✅ **escolhida** — mantida (2026-07), API alinhada a FR-001/FR-006 |
| `nfe-danfe-pdf` | MIT | 20.887 | Mais adotada, mas parada desde 2025-09. Fallback se a escolhida regredir. |
| `@nfewizard/danfe` | **GPL-3.0** | — | ❌ **rejeitada por licença.** Copyleft é incompatível com produto proprietário. Bloqueio jurídico, não técnico. |
| `node-sped-pdf` | MIT | — | Depende de `canvas` — **binário nativo**, contraria a premissa de R1. |
| Implementar do zero | — | — | Reimplementar o MOC Anexo II sem necessidade, com risco de recusa em fiscalização. |

**Risco aceito**: dependemos de um mantenedor individual. Mitigado por (a) encapsulamento
atrás de porta própria — trocar de lib é trocar um adapter; (b) `nfe-danfe-pdf` como
fallback já identificado; (c) o teste de aceitação valida o PDF, não a lib.

---

## R3 — DANFSE: adotar ou implementar

**Decisão**: **implementar**, com pdfkit, reaproveitando os primitivos de R5.

**Rationale**: aqui a pesquisa deu o resultado **oposto** ao do DANFE, e é isso que
justifica tratar os dois documentos de forma diferente:

| Pacote | Licença | Downloads/mês | Repositório público |
| --- | --- | --- | --- |
| `danfse-pdf-generator` | MIT | **78** | ❌ ausente |
| `@notaas/danfse-viewer` | MIT | **1.709** | ❌ ausente |

Nenhum tem repositório declarado — não dá para auditar o código, abrir issue, nem corrigir
um bug de leiaute. Para um documento fiscal, adotar uma caixa-preta de 78 downloads/mês é
pior do que escrever 400 linhas de layout que a gente controla.

O DANFSE também é **mais simples** que o DANFE: sem quadro de itens de mercadoria, sem
cálculo de ICMS por item, sem canhoto de recebimento.

**Consequência de projeto**: R2 e R3 discordam de propósito. A porta de renderização
(§ Estrutura, `AuxiliaryDocumentRenderer`) existe justamente para que "adotada" e "própria"
sejam detalhes de adapter, invisíveis para o use case.

---

## R4 — Marca d'água (FR-005)

**Decisão**: estágio de **estampagem independente da fonte**, aplicado ao buffer PDF
pronto, via `pdf-lib` (MIT, 42M downloads/mês).

**Rationale** — este é o ponto mais importante do plano:

> A marca d'água **não pode** ser responsabilidade de quem renderiza.

Três fontes distintas produzem PDF neste sistema: a biblioteca de DANFE (R2), o nosso
renderizador de DANFSE (R3) e, na Fase 2, **a API oficial do Sefin** (FR-002a). Se a marca
d'água morasse dentro do renderizador, o PDF vindo do órgão sairia **sem marcação** — e é
exatamente esse o caminho preferencial quando disponível. FR-005 falharia justamente no
caso que FR-002a privilegia.

Um estágio que recebe `Buffer` e devolve `Buffer` cobre as três fontes com um único
caminho de código, e é testável isoladamente.

**Implementação**: iterar as páginas, desenhar texto diagonal em cinza com baixa opacidade,
cobrindo a diagonal da página. Opacidade baixa atende FR-005a (legibilidade preservada,
inclusive em impressão monocromática).

**Risco aceito**: `pdf-lib` não recebe publicação desde 2021-11. É JS puro, sem rede, e
processa apenas PDF que nós mesmos acabamos de produzir — a superfície de risco de um
parser sem entrada hostil é pequena. Com 42M downloads/mês, uma regressão séria seria
pública. **Fallback**, se necessário: assumir a renderização do DANFE (R2) e usar
`bufferPages: true` do pdfkit para estampar todas as páginas antes do `end()` — o que
custaria abrir mão da adoção da lib.

---

## R5 — Código de barras e QR Code (FR-004)

**Decisão**: `bwip-js` (MIT, sem dependências, 3.5M downloads/mês) para o
**CODE-128C** da chave de acesso; `qrcode` (MIT) para QR.

**Rationale**: o DANFE exige a chave de 44 dígitos em CODE-128C. `bwip-js` é a
implementação de referência em Node e **zero dependências** — atributo relevante para uma
API fiscal. Ambos já vêm transitivamente pela lib de R2; declaramos explicitamente porque
o renderizador de DANFSE (R3) os usa diretamente, e dependência transitiva não é contrato.

---

## R6 — Determinismo da reimpressão (FR-008 / SC-004)

**Decisão**: determinismo garantido no **conteúdo**, não nos bytes do arquivo.

**Rationale**: PDF carrega `CreationDate` e identificadores de documento; dois arquivos
gerados do mesmo XML em instantes diferentes **nunca** serão byte-idênticos, sem que nada
esteja errado. SC-004 já está redigido corretamente — "comparação byte a byte do **conteúdo
textual**" —, e é isso que o teste verifica: extrair o texto e comparar.

O que de fato garante FR-008 é derivar tudo do XML autorizado e **nada** do cadastro atual:
se o renderizador nunca lê a tabela `companies`, é estruturalmente impossível que uma
mudança de cadastro vaze para uma reimpressão. Essa é a razão de FR-010 recusar em vez de
cair para outra fonte.

---

## R7 — Isolamento por emitente (FR-007) — ⚠️ decisão que precisa de posição

**Achado**: FR-007 exige recusar solicitação de quem não é o emitente da nota. Hoje, no
`fiscal-api`, **isso não é verificado em nenhuma rota de leitura**.

`GetNfeXmlUseCase` busca por `id` e devolve o XML sem comparar `companyId`. Não é
esquecimento — é decisão registrada, documentada no próprio código:

> `company-id.decorator.ts`: "⚠️ NÃO USADO por design no v1 (decisão explícita registrada
> em research.md §8, achado G1 de `/speckit-analyze`, 2026-08-04) — a autorização do v1 é
> só por role/sistema chamador, confiando que os sistemas internos do CityBox já controlam
> o acesso por Loja/Emitente antes de chamar esta API."

**Tensão com a Constituição**: o Princípio V (*Tenant Isolation*) exige respeito à
hierarquia de tenant nas operações. A premissa do v1 — "o chamador interno já filtrou" — é
uma confiança transitiva, não um controle.

> ⚠️ **CORREÇÃO (revisão de segurança, 2026-08-08).** A decisão abaixo foi implementada,
> mas **não entrega o isolamento que este texto originalmente afirmava**. O
> `X-Company-Id` é um header **escolhido pelo chamador** — o JWT não carrega claim de
> empresa (`AuthenticatedUser` tem `sub`, `roles`, `username`, `email` e nada mais).
> A comparação `document.companyId !== dto.companyId` confronta o valor do banco com
> um valor que o atacante controla, e passa sempre que ele informar o UUID da vítima.
>
> Qualquer portador de token com `fiscal.documents.view` — role de ERP, PDV e
> marketplace — obtém o DANFE/DANFSE de qualquer empresa. O agravante é que estes dois
> endpoints produzem justamente o artefato **feito para sair da plataforma**.
>
> **RESOLVIDO em 2026-08-08** pela `CompanyAccessPolicy`. A autorização passou a
> partir do `sub` do JWT, resolvendo a loja em `platform.store_members` e daí o
> Emitente por `fiscal.companies.store_id` (`@unique`). Nem atributo Keycloak
> nem tabela nova: a associação já existia, faltava consultá-la. Segue o mesmo
> padrão do `StoreMembershipGuard` do `admin-api`, com `platform_admin` como
> bypass e **recusa em caso de falha**.

**Decisão para esta feature**: o use case de documento auxiliar **recebe `companyId` e
compara** com o da nota, recusando divergência. Motivos:

1. FR-007 é requisito explícito **desta** spec — não é ampliação de escopo, é implementar o
   que foi pedido.
2. É barato: uma comparação, sem mudança de contrato de infraestrutura.
3. O documento auxiliar é o artefato **mais compartilhável** do sistema — é feito para ser
   enviado por e-mail e WhatsApp. É o pior lugar para confiar em filtro de terceiro.

**Fora do escopo, mas registrado**: `GET /nfe/{id}/xml` e `GET /nfse/{id}/xml` continuam
com a mesma lacuna. Não corrijo aqui porque reverter uma decisão de arquitetura registrada
do v1 é decisão do dono do produto, não efeito colateral de outra feature. Fica anotado
como item a decidir.

---

## R8 — Momento da geração e armazenamento

**Decisão**: gerar **sob demanda**, sem persistir o PDF.

**Rationale**: o PDF é função pura do XML autorizado — que já está armazenado e é
imutável. Persistir o derivado gastaria armazenamento para documentos que talvez nunca
sejam pedidos, e criaria um segundo artefato a invalidar. Se a geração ficar cara sob
carga, cache entra depois, com medição; hoje seria otimização especulativa.

---

## R9 — Quando preferir a API oficial de DANFSE (FR-002a)

**Decisão**: em Fase 2, tentar a API oficial primeiro; ao receber `501` — ou qualquer falha
—, cair para geração local **sem propagar erro**.

**Rationale**: verificado em 2026-08-07 que
`GET https://sefin.producaorestrita.nfse.gov.br/SefinNacional/danfse/{chave}` responde
`501 Not Implemented` em produção restrita. Ou seja: hoje o caminho oficial **nunca**
funciona no ambiente onde o sistema é testado, e o fallback é o caminho real.

A ordem "oficial primeiro, local em seguida" existe para que o dia em que o órgão publicar
o serviço não exija mudança de código. Timeout curto — o usuário está esperando um PDF
(SC-001: 5 s), não pode pagar por um serviço que ainda não existe.

Quando o PDF vier do órgão, a origem é registrada (FR-002b) e **a marca d'água é aplicada
do mesmo jeito** (R4).

---

## Resumo de dependências novas

| Pacote | Licença | Papel | Fase |
| --- | --- | --- | --- |
| `@alexssmusica/node-pdf-nfe` | MIT | Renderiza DANFE a partir do XML | 1 |
| `pdfkit` | MIT | Motor de desenho (DANFSE próprio) | 1 (transitivo) / 2 (direto) |
| `pdf-lib` | MIT | Estampa a marca d'água, independente da fonte | 1 |
| `bwip-js` | MIT | CODE-128C da chave de acesso | 2 (direto) |
| `qrcode` | MIT | QR Code do DANFSE | 2 |

Nenhuma tem dependência nativa. Nenhuma é copyleft.


---

## R10 — Onde a marca Citybox pode legalmente aparecer ⚠️

**Decisão**: **rodapé de crédito**, fora dos quadros regulados. **Nunca** no quadro
"IDENTIFICAÇÃO DO EMITENTE".

**Rationale** — esta é a decisão que impede um erro caro:

O leiaute do DANFE reserva um espaço de logotipo **dentro do quadro de identificação do
emitente**. A biblioteca expõe isso como `pathLogo`, e verifiquei onde ela desenha:

```
lib/application/helpers/generate-pdf/nfe/get-dados-emitente.js:66
  doc.image(pathLogo, margemEsquerda + ajusteX + 4.5, ...)
```

É o quadro que declara **quem emitiu a nota**. A logo do Citybox ali afirmaria, no
documento fiscal, que quem emitiu foi o Citybox — e não a RR Empreendimentos. Não é
questão de gosto: é identificação incorreta do emitente num documento que acompanha
mercadoria e é apresentado em fiscalização.

O lugar correto para a marca de quem **fez o software** é um crédito discreto no rodapé,
fora dos quadros que o Manual de Orientação ao Contribuinte especifica. É prática
corrente entre emissores fiscais brasileiros e não interfere na conferência do documento.

**Consequência de projeto**: o slot `pathLogo` fica **reservado ao emitente**. Se um dia o
lojista quiser a própria logo ali, é outra feature — e aí o slot é o lugar certo.

| Alternativa | Por que não |
| --- | --- |
| Logo Citybox em `pathLogo` | Identifica o Citybox como emitente. Risco fiscal real. |
| Marca d'água com a logo | Colide com a marca de homologação, e em produção sujaria o documento sem necessidade. |
| Cabeçalho próprio acima dos quadros | Empurra o leiaute para baixo; o MOC define margens e a paginação já é apertada. |

---

## R11 — Como desenhar a logo, que é SVG

**Decisão**: `svg-to-pdfkit` (MIT, 1,5M downloads/mês, **única dependência é o pdfkit**).

**Rationale**: os assets do design system são vetoriais —
`packages/ui/logotipo.svg` (605×166, marca com o nome) e `packages/ui/logobrand.svg`
(143×143, só o símbolo). O pdfkit não embute SVG: aceita PNG e JPEG.

`svg-to-pdfkit` traduz os paths do SVG para comandos de desenho do próprio pdfkit — o
resultado é **vetorial no PDF**, então não borra em impressão nem em zoom, e o arquivo não
engorda com bitmap.

| Alternativa | Por que não |
| --- | --- |
| `@resvg/resvg-js` | Binário nativo — mesma premissa que descartou `pdf-parse` e `canvas`. |
| `sharp` | Binário nativo. |
| Converter para PNG e commitar | Some com a vetorização (borra ao imprimir), e cria um asset derivado que desatualiza em silêncio quando o design system mudar a marca. |

**Qual asset**: `logotipo.svg` — o rodapé é uma faixa horizontal, e a marca com o nome é
legível em tamanho pequeno. O `logobrand.svg` (símbolo isolado) não comunica "Citybox" a
quem não conhece.

**Risco aceito**: `svg-to-pdfkit` cobre um subconjunto do SVG. Os dois assets são paths
simples, sem filtro, gradiente ou máscara. Se o design system publicar uma marca mais
elaborada, o teste de renderização é o que avisa.
