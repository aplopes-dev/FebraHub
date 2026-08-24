# Teste — rodada 6

**Data:** 2026-08-15 · **Organização:** RR EMPREENDIMENTOS (credenciada)

---

## 🎉 NFS-e autorizada pela tela

Emiti com o tomador **Daniel Anselmo** e a nota foi **AUTORIZADA**:

```
Protocolo  29136062250031609000104000000000003026081934567912
```

A integração de NFS-e está fechada ponta a ponta pelo ERP. O subtítulo da tela também já saiu
corrigido ("Emissão de nota fiscal de serviço (Padrão Nacional).", sem menção fixa a ambiente).

---

## 🔴 P1 — Facilita NF-e não carrega, e o download não funciona: o proxy não eleva essas rotas

A NFS-e não "sumiu" — **a aba inteira falha ao carregar**. A tela mostra *"Não foi possível
carregar os documentos emitidos"*, e a causa é 401:

```
GET /api/proxy/fiscal/v1/fiscal-documents?companyId=96a3c268-…
401  {"message":"Client não autorizado: erp-web"}
```

O `erp-web` não está na allowlist de `azp` da fiscal-api — por design. Quem deveria falar com a
fiscal-api é o **token de serviço**, e o proxy é quem faz essa elevação. Só que ele não elevou.

### Isolei quais formas de rota o proxy eleva

| Rota | Eleva? | Resultado |
| --- | --- | --- |
| `/v1/companies?cnpj=` (lista) | ✅ | **200** |
| `/v1/companies/:id` (path) | ✅ | **200** |
| `/v1/fiscal-documents?companyId=` (**query**) | ❌ | **401** `azp: erp-web` |
| `/v1/nfse/:id/xml` | ❌ | **401** |
| `/v1/nfse/:id/danfse` | ❌ | **401** |

Duas consequências distintas:

1. **`?companyId=` na query não é reconhecido.** `isCompanyScopedRoute` deveria cobrir esse caso
   (`Boolean(queryCompanyId)`), mas na prática não cobre — o Facilita NF-e é o único consumidor
   dessa forma, e é justamente ele que está quebrado.
2. **As rotas de documento (`/v1/nfe/:id/…`, `/v1/nfse/:id/…`) não têm dono resolvível** e caem no
   fallback com o token do usuário. **É exatamente a armadilha que apontei no prompt 029** — o
   resolvedor de dono por documento não foi implementado, então o download nasce com 401.

Verificado com a NFS-e autorizada `188c3ec0-e828-4937-9c42-4303290ee15c`: XML e DANFSE, ambos 401.

---

## 🔴 P2 — NF-e bloqueada: o pedido guarda um id de catálogo mock

Erro na tela, com o pedido `#8 — Cliente Teste`:

> A forma de pagamento **"desconhecida"** não tem o código fiscal (tPag) configurado.

### Respondendo à sua pergunta: sim, o sistema já vem configurado

O seed **já preenche o `tPag` de todas as formas do sistema**
(`apps/erp/api/src/modules/store-setup/application/seed-data/finance.seed.ts:228`):

```
Dinheiro 01 · Cheque 02 · Cartão de Crédito 03 · Cartão de Débito 04
Boleto 15 · Depósito 16 · Vale Alimentação 10 · Vale Refeição 11 · …
```

E confirmei na sua organização — as formas cadastradas **têm** o código:

```
Boleto 15 · Cartão de Crédito 03 · Cartão de Débito 04 · Cheque 02 · Crédito em Loja 21
```

Ou seja: **não é você que precisa configurar nada.** O problema é outro.

### A causa real

O pagamento do pedido #8 guarda:

```json
{ "methodId": "pm-dinheiro", "amountCents": 10000, … }
```

`pm-dinheiro` é um **slug do catálogo mock**
(`apps/erp/web/src/features/purchases/data/mock-payment-methods.ts`), enquanto as formas reais têm
UUID (`5db440ed-eb03-…`). O resolvedor procura `pm-dinheiro` em `payment_methods`, não acha, e cai
no rótulo "desconhecida".

Isso está documentado no próprio `apps/erp/web/AGENTS.md` como dívida conhecida:

> ⚠️ `features/purchases/data/mock-payment-methods.ts` (usado por Compras/Vendas/OS) **não foi
> migrado** — os ids `pm-dinheiro`/`pm-boleto`/`pm-cartao`/`pm-pix` seguem repetidos de propósito
> **para o dia em que esses seletores também lerem deste cadastro**

Esse dia chegou: a emissão de NF-e é o primeiro consumidor que precisa do vínculo real.

**Correção:** o formulário de pedido de venda (e Compras/OS) deve selecionar a forma de pagamento
a partir de `/v1/payment-methods` (UUID real), não do catálogo mock. Pedidos já gravados com slug
precisam de backfill — senão continuam inemitíveis.

O bloqueio em si está **correto** e foi bem implementado: melhor recusar com mensagem clara do que
emitir com `99` errado, como acontecia antes. Só a mensagem induz ao erro — manda configurar algo
que já está configurado.

---

## Observação menor

Na tela de NFS-e, o grupo "Principal" aparece como **"Alíquota 0.05%"**. Se a intenção era 5%, o
valor está sendo interpretado como fração em um lugar e percentual em outro. Vale conferir como o
campo é gravado no cadastro do grupo de ISSQN — não cheguei a confirmar qual dos dois é o correto.

---

## Resumo

| # | Item | Situação |
| --- | --- | --- |
| — | NFS-e emitida e **autorizada** pela tela | ✅ |
| 1 | Proxy não eleva `?companyId=` na query → Facilita NF-e 401 | 🔴 |
| 2 | Proxy não eleva rotas de documento → XML/DANFSE 401 | 🔴 |
| 3 | Pedido guarda `methodId` de catálogo mock → NF-e bloqueada | 🔴 |
| 4 | Alíquota do grupo ISSQN exibida como 0.05% | 🟡 verificar |
