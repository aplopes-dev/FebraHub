# Contrato interno — leitura do XML e geração do DANFSe

Esta feature **não altera** nenhuma interface externa (HTTP). Os contratos abaixo são
**internos** ao `services/fiscal-api` (módulo `auxiliary-documents`) e mudam apenas em forma
compatível (campos novos opcionais).

## 1. Reader — `readNfseXml(authorizedXml: Buffer): NfseDocumentData`

- **Entrada**: `Buffer` do XML autorizado da NFS-e (Padrão Nacional 1.01).
- **Saída**: `NfseDocumentData` (ver [data-model.md](../data-model.md)) — **estendido** com
  endereços, intermediário, valores/base, retenções federais e totais.
- **Regra de compatibilidade**: todos os campos novos são **opcionais**; consumidores atuais
  continuam válidos. Campo/grupo ausente no XML ⇒ `undefined` (nunca `0`/`""` sintético).
- **Erros**: XML malformado / sem `infNFSe` ⇒ erro de leitura (comportamento atual mantido).
- **Fonte dos nomes**: `resources/xsd/nfse/1.01/`.

## 2. Renderer — `danfse.renderer.ts` (implementa `AuxiliaryDocumentRenderer`)

- **Contrato de porta inalterado**: `render(input: RenderInput): Promise<Buffer>`, com
  `RenderInput = { authorizedXml: Buffer; isCancelled: boolean; substitutedBy?: string }`.
- **Comportamento novo (interno)**: desenha o PDF em **quadros na ordem da NT 008/2026**
  (identidade nacional → identificação da NFS-e/chave/QR → prestador → tomador →
  [intermediário] → serviço → valores/base → [tributos municipais] → [retenções federais] →
  [totais/transparência] → rodapé). Seções entre `[...]` são **omitidas** quando ausentes.
- **Cancelada** (`isCancelled`) e **substituição** (`substitutedBy`): faixa/indicação
  preservada (não-regressão, spec 004).

## 3. Use-case — `get-auxiliary-document.use-case.ts`

- **Mudança (FR-014)**: remover a dependência `BrandStamper` e a chamada
  `brandStamper.stamp(rendered)`. Pipeline passa a ser:
  `rendered = renderer.render(input)` → `content = isHomologation ? watermark(rendered) : rendered`.
- **Não-regressão (FR-012)**: `WatermarkStamper` permanece; marca d'água de homologação
  intacta.

## 4. Rota HTTP — **inalterada**

`GET /danfse/:accessKey` (e a rota do DANFE) mantêm assinatura, autenticação e formato de
resposta (`application/pdf`). Nenhuma mudança de contrato público — portanto **sem** impacto
em Swagger além de, se aplicável, nota de que o documento não exibe mais a marca Citybox.
