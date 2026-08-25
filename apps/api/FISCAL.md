# Módulo Fiscal — cupom fiscal (NFC-e) e cupom não fiscal

Emite, a partir de uma venda do PDV (`PdvVenda`):

- **Cupom NÃO fiscal** — recibo/comprovante interno. **Sem** SEFAZ, **sem** certificado, **sem** CSC. Funciona imediatamente.
- **Cupom FISCAL — NFC-e (modelo 65)** — autorizada pelo **SVRS** (a Bahia delega a NFC-e ao SEFAZ Virtual RS). Exige certificado A1, CSC e credenciamento.

Portado/adaptado de `@citybox/fiscal-api`. Núcleo (XML mod 65, assinatura XMLDSig, QR Code/CSC, SOAP mTLS, XSD) em `src/modules/fiscal/nfce/`.

## Endpoints (`/fiscal`, guard por permissão)

| Método | Rota | Permissão | O quê |
|---|---|---|---|
| GET | `/fiscal/config` | emitir/gerenciar | estado fiscal + pendências |
| PUT | `/fiscal/config` | gerenciar | dados do emitente + ambiente |
| POST | `/fiscal/config/csc` | gerenciar | cadastra CSC (id + token) |
| POST | `/fiscal/config/certificado` | gerenciar | upload do .pfx (multipart `arquivo` + `senha`) |
| POST | `/fiscal/emitir` | emitir | `{ vendaId, tipo: 'fiscal'\|'nao_fiscal' }` |
| GET | `/fiscal/documentos` | emitir | histórico |
| GET | `/fiscal/documentos/:id/comprovante?formato=bobina\|a4` | emitir | HTML imprimível |
| POST | `/fiscal/documentos/:id/cancelar` | gerenciar | cancelamento (em implantação) |

Permissões: `fiscal.emitir`, `fiscal.gerenciar` (catálogo + perfis-padrão + migration 39).

## Variáveis de ambiente

**Obrigatória para qualquer segredo fiscal (certificado/CSC):**

```
# AES-256-GCM, 32 bytes em base64. NUNCA reaproveitar entre ambientes.
# Gerar: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
FISCAL_CERT_ENCRYPTION_KEY=
```

**NFC-e (homologação) — SVRS + URLs de consulta pública da NFC-e (por UF/ambiente):**

```
# Endpoint do SVRS (default já é o de homologação; produção precisa ser setado)
SVRS_NFCE_HOMOLOGATION_ENDPOINT=https://nfce-homologacao.svrs.rs.gov.br
# SVRS_NFCE_PRODUCTION_ENDPOINT=   # setar só quando for para produção

# URLs de consulta da NFC-e da BAHIA (obrigatórias — sem default de propósito).
# Formato: NFCE_QRCODE_URL_<UF>_<AMBIENTE> e NFCE_CHAVE_URL_<UF>_<AMBIENTE>.
# ⚠️ urlChave cabe em 85 chars — a SEFAZ-BA publica uma forma CURTA para este
#    campo; o caminho completo da página de consulta (88 chars) NÃO cabe.
NFCE_QRCODE_URL_BA_HOMOLOGATION=https://hinternet.sefaz.ba.gov.br/nfce/qrcode
NFCE_CHAVE_URL_BA_HOMOLOGATION=https://hinternet.sefaz.ba.gov.br/nfce/consulta
# NFCE_QRCODE_URL_BA_PRODUCTION=https://nfe.sefaz.ba.gov.br/servicos/nfce/qrcode
# NFCE_CHAVE_URL_BA_PRODUCTION=https://nfe.sefaz.ba.gov.br/servicos/nfce/consulta
```

> ⚠️ **As URLs acima são um placeholder.** Confirmar a forma exata (curta) publicada
> pela SEFAZ-BA antes do primeiro teste real — apontar para o lugar errado gera
> cupom autorizado com QR Code que a consulta não reconhece.

**Cadeia ICP-Brasil (para o TLS com o SVRS):**

```
# Bundle raiz+intermediária ICP-Brasil. Sem ele o handshake TLS falha com
# UNABLE_TO_GET_ISSUER_CERT_LOCALLY. Colocar o arquivo em resources/ca/icp-brasil.pem
# ou apontar aqui. (ver resources/ca/README.md)
# SEFAZ_CA_BUNDLE_PATH=/app/apps/api/resources/ca/icp-brasil.pem
```

## Pré-requisitos de build (deploy)

`libxmljs2` é módulo nativo (node-gyp) — a imagem de build precisa de **python3, make, g++**.
Sem o binding, o boot falha (`xsd-validator` está na cadeia de import). No container,
após `pnpm install`, rodar `pnpm rebuild libxmljs2` (ou `node-gyp rebuild` no pacote).

## Passo a passo para ligar a NFC-e (produção)

1. **Certificado A1** (e-CNPJ .pfx) da Febracis — subir em Configurações → Fiscal.
2. **Credenciamento de NFC-e** na SEFAZ-BA (portal → "Como se tornar emissor de NFC-e", com o certificado). Prazo: "de acordo com a análise" (sem garantia).
3. **CSC** gerado no mesmo portal (imediato) — cadastrar id + token na tela.
4. Preencher CNPJ, IE, endereço, código IBGE do município (Salvador = 2927408).
5. Testar **em homologação** (ambiente `homologacao`) até autorizar de verdade.
6. Trocar ambiente para `producao` + setar `SVRS_NFCE_PRODUCTION_ENDPOINT` e as URLs `_BA_PRODUCTION`.

## Ressalvas herdadas do porte (ler antes do 1º teste real)

- **QR Code** (`nfce/qr-code.ts`) é o ponto de maior risco: a composição/hash está travada por teste, mas só um cupom real escaneado contra a consulta da SEFAZ-BA prova que confere.
- **WSDLs** (`resources/wsdl/nfe/`) são de autoria própria (o cliente SOAP monta o envelope à mão; os WSDLs são efetivamente ignorados em runtime).
- **NCM/CFOP** dos itens usam defaults genéricos (`00000000` / `5102`, CST `00`/CSOSN `102`). Para produção, mapear NCM/CFOP reais por produto.
- **Cancelamento eletrônico** ainda não transmite o evento (a infra está portada; falta ligar o fluxo).
