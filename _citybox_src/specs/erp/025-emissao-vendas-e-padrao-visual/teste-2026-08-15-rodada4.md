# Teste da 025 — rodada 4 (após deploy)

**Data:** 2026-08-15 · **Ambiente:** `backoffice.aplopes.com`
**Organização:** Aplopes · CNPJ `36698609000123` · Emitente `070566ad-c97a-4ce6-9e08-2d0fde8b1249`

---

## ✅ O bloqueador foi resolvido

O deploy saiu e o `FISCAL_API_URL` foi corrigido. **As duas telas agora transmitem ao órgão:**

| Tela | HTTP | Resultado no órgão |
| --- | --- | --- |
| `/vendas/nfe` | `201` | `REJECTED` · chave `29260836698609000123550010000000051015620684` |
| `/vendas/nfse` | `201` | `REJECTED` |

Isso é progresso real: até a rodada anterior nada saía da erp-api (`422 "Não foi possível
resolver o Emitente"`). Agora o XML é montado, assinado, transmitido e **avaliado pela SEFAZ**.

### NFS-e ✅ — comportamento esperado, nada a corrigir

Rejeitada com **`E0116`** — *"A IM deve ser informada para o emitente prestador do serviço na DPS,
conforme informações complementares registradas no CNC NFS-e do município emissor"*.

É exatamente a rejeição prevista para a Aplopes, que está no CNC de Ilhéus com IM fictícia. **Não é
bug** — é cadastro do contribuinte, e confirma que o pipeline funciona ponta a ponta.

---

## 🔴 Achado — a NF-e sai sem o endereço do destinatário

A NF-e **não** foi rejeitada com o `203` (emissor não habilitado) que eu previa. Veio antes:

```
719 — "Rejeicao: NF-e sem a identificação do destinatario."
```

O `203` só aparece quando o grupo `dest` está bem formado — foi o que aconteceu no meu teste via
Swagger em 14/08, onde mandei o cliente com endereço completo. Pela tela do ERP a validação para
antes, no destinatário.

### Não é dado faltando no cadastro

O cliente do pedido está completo:

```
customerId  aa7f938f-6bba-4e99-a4b0-3b211a74e801
nome        Daniel Anselmo
tipo        PJ · CNPJ 43505459000150
endereço    presente
```

### Causa-raiz

`nfe-issuance-page.tsx:126-134` monta o destinatário com **quatro campos apenas**:

```ts
customer: {
  documentType: customer.documentType,
  document: customer.document,
  name: customer.name,
  email: customer.email,
}
```

A origem desses dados é `getCustomerFiscalInfoApi`, que vem da feature **de NFS-e**
(`nfse-issuance/api/nfse-issuance.service.ts:34`) e cujo tipo `CustomerFiscalInfo` carrega
só `documentType`, `document`, `name` e `email` — **não tem endereço**.

Para a NFS-e isso basta. Para a **NF-e não**: o grupo `dest` exige `enderDest`, e sem ele a SEFAZ
recusa com 719. A tela de NF-e reusou o resolvedor da irmã sem notar que o contrato fiscal dos dois
documentos é diferente.

**Correção:** estender `CustomerFiscalInfo` (ou criar um resolvedor próprio da NF-e) para carregar o
endereço do cliente — logradouro, número, bairro, município, UF, código IBGE e CEP — e enviá-lo no
`customer.address`. O `IssueNfeCustomerPayload` do DTO já prevê `address`; é o preenchimento que
falta. Vale conferir também se o `indIEDest` é necessário para destinatário PJ.

---

## 🟡 Achado — rejeição é anunciada como sucesso

Nas duas telas, o resultado aparece assim:

> ✅ **NF-e REJECTED.**
> ✅ **NFS-e REJECTED.**

Três problemas num toast só:

1. **É `toast.success`** (`nfe-issuance-page.tsx:136`) — uma nota recusada pela SEFAZ vira
   notificação verde de sucesso.
2. **`REJECTED` em inglês**, cru do enum da API.
3. **O motivo não aparece.** Nem o código (`719`, `E0116`) nem a mensagem do órgão. O usuário
   precisa ir até Facilita NF-e para descobrir por que a nota foi recusada — e nada na tela diz
   que é lá.

O dado existe: `GET /v1/fiscal-documents` devolve `errorCode` e `errorMessage` prontos, com o texto
do órgão em português. É só exibir.

Sugestão: `AUTHORIZED` → toast de sucesso com o protocolo; `REJECTED` → toast de erro (ou aviso) com
o código e a mensagem do órgão, e link para o documento.

---

## Resumo

| # | Item | Situação |
| --- | --- | --- |
| — | `FISCAL_API_URL` / deploy | ✅ **resolvido** |
| — | NFS-e chega ao órgão (`E0116`) | ✅ esperado, sem ação |
| 1 | NF-e sem `enderDest` → `719` | 🔴 corrigir |
| 2 | Rejeição anunciada como sucesso, sem motivo | 🟡 corrigir |

Depois do item 1, a NF-e da Aplopes deve passar a receber **`203`** (emissor não habilitado) — que
é a rejeição *correta* para essa empresa e o sinal de que o `dest` ficou bem formado. Autorização de
verdade só pela RR EMPREENDIMENTOS (`50031609000104`), que é credenciada mas não está vinculada a
nenhuma organização do ERP.
