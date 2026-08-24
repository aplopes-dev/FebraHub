# Quickstart — validar o DANFSe conforme a NT 008/2026

Guia de validação **end-to-end** da geração do DANFSe (e da remoção da marca Citybox).
Não emite nota — opera sobre XML autorizado de fixture / homologação.

## Pré-requisitos

- `services/fiscal-api` com dependências instaladas (`pnpm install`).
- XSDs presentes em `resources/xsd/nfse/1.01/`.
- Fixtures em `services/fiscal-api/src/modules/auxiliary-documents/tests/fixtures/`:
  - `authorized-nfse-xml` **mínima** (só campos obrigatórios) — exercita omissão.
  - `authorized-nfse-xml` **cheia** (endereços, intermediário, retenções, totais) — exercita
    presença. (nova nesta feature)

## 1. Testes automatizados (SC-001a — presença/ordem)

```bash
pnpm --filter @citybox/fiscal-api test -- auxiliary-documents
```

Espera-se que os specs afirmem:
- `nfse-xml.reader.spec.ts`: campos novos populados no XML cheio; `undefined` no mínimo.
- `danfse.renderer.spec.ts`: texto do PDF contém os **rótulos das seções da NT na ordem**
  esperada; **sem** a legenda/marca "Citybox"; documento em A4; faixa de cancelada quando
  `isCancelled`.
- `get-auxiliary-document.use-case.spec.ts`: **sem** `brandStamper`; marca d'água de
  homologação ainda aplicada (não-regressão FR-012).

## 2. Amostras visuais (SC-001b — conferência humana)

```bash
pnpm --filter @citybox/fiscal-api test -- gerar-amostras
```

Gera PDFs em `services/fiscal-api/amostras/` (DANFSe normal, cancelada, e — se houver — com
retenções). **Conferir** contra o modelo da NT 008/2026:
- estrutura em quadros e ordem das seções;
- identidade nacional (asset oficial ou fallback textual "NFS-e — Padrão Nacional");
- ausência total da marca Citybox (logo + legenda) — também no DANFE;
- campos ausentes **omitidos** (sem `0,00` falso).

## 3. Verificação manual via API (opcional, homologação)

Com a fiscal-api no ar (`pnpm --filter @citybox/fiscal-api dev`):

```bash
curl -H "Authorization: Bearer <token-hml>" \
  http://localhost:3116/danfse/<chave-de-acesso> -o danfse.pdf
```

Abrir `danfse.pdf` e conferir os mesmos itens da seção 2.

## Critérios de aceite (resumo)

| SC | Como validar |
|----|--------------|
| SC-001 | seções 1 e 2 passam |
| SC-002 (campos NT presentes) | reader spec + amostra cheia |
| SC-003 (omissão sem zeros falsos) | reader spec (mínima) + amostra mínima |
| SC-004 (sem marca Citybox em DANFE+DANFSe) | renderer/use-case spec + amostras |
| SC-005 (descrição longa pagina) | amostra com descrição longa |
| SC-006 (não-regressão cancelada/watermark) | use-case + renderer spec |

## Referências

- [spec.md](./spec.md) · [plan.md](./plan.md) · [research.md](./research.md) ·
  [data-model.md](./data-model.md) · [contracts/reader.contract.md](./contracts/reader.contract.md)
- NT 008/2026 — Especificações Técnicas do DANFSe (gov.br/nfse).
