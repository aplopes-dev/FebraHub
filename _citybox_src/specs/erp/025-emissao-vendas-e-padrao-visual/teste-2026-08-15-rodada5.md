# Teste — rodada 5 (pedido #4)

**Data:** 2026-08-15 · **Pedido:** `#4 — Daniel Anselmo — R$ 100,00` (`7829bed7-fc35-480e-a3d3-c0079eb31ed7`)

---

## ✅ B2 e B3 corrigidos

O feedback de rejeição ficou como pedido — traduzido, com código e mensagem do órgão:

> **NF-e Rejeitada.** · `[719] Rejeicao: NF-e sem a identificação do destinatario.`
> **NFS-e Rejeitada.** · `[E0116] A IM deve ser informada para o emitente prestador do serviço na DPS…`

A NFS-e está **correta**: `E0116` é a rejeição esperada para a Aplopes (IM fictícia no CNC).

---

## 🔴 B1 — o front está certo; o erro está num cadastro envenenado na fiscal-api

### O payload enviado está completo

Interceptei a requisição da tela. O endereço **está lá**:

```json
{
  "saleOrderId": "7829bed7-fc35-480e-a3d3-c0079eb31ed7",
  "customer": {
    "documentType": "CNPJ", "document": "43505459000150",
    "name": "Daniel Anselmo", "email": "danielanselmo@gmail.com",
    "address": {
      "street": "Rua das flores", "number": "10", "complement": null,
      "district": "Centro", "city": "Ilhéus", "uf": "BA",
      "cityCodeIbge": "2913606", "zipCode": "45680000"
    }
  }
}
```

A correção do B1 **funcionou**. O contrato da erp-api (`FiscalApiCustomer`) e o mapeamento
`recipient` da fiscal-api também estão corretos. Mesmo assim: `719`.

### A causa: `resolveCustomer` ignora o payload quando o cliente já existe

`services/fiscal-api/src/modules/nfe/application/use-cases/issue-nfe/issue-nfe.use-case.ts:402`

```ts
private async resolveCustomer(companyId, dto) {
  const existing = await this.customerRepository.findByDocument(companyId, dto.document);
  if (existing) return existing;          // ← devolve o antigo e DESCARTA o dto inteiro

  const customer = Customer.create({
    …,
    address: dto.address ?? {             // ← fallback que grava endereço vazio
      street: '', number: 'S/N', district: '', city: '', uf: '',
    },
  });
  return this.customerRepository.save(customer);
}
```

O que aconteceu, em ordem:

1. Nas tentativas **antes** da correção do B1, a tela não mandava endereço.
2. O fallback gravou o cliente `43505459000150` com **endereço vazio e sem `cityCodeIbge`**.
3. Agora, com o payload correto, `findByDocument` acha esse registro e **retorna ele** — o
   endereço novo é jogado fora.
4. No mapeamento, `customer.address.cityCodeIbge` é vazio → `address: null`.
5. `buildDestXml` faz `...(recipient.address ? { enderDest } : {})` → **omite `enderDest`**.
6. SEFAZ rejeita com **719**.

É um cache read-through que nunca atualiza — e que **se auto-envenena**: a primeira tentativa
malsucedida contamina todas as seguintes, mesmo depois de o cliente ser corrigido. Por isso a
correção parece não ter pegado.

### O que corrigir

1. **`resolveCustomer` deve atualizar o existente** com os dados recebidos (upsert), não
   devolver o antigo. Dados cadastrais mudam — endereço é justamente o que mais muda.
2. **Remover o fallback de endereço vazio.** Ele grava um registro garantidamente inválido
   para NF-e. Melhor recusar na entrada (422, dizendo que falta endereço) do que persistir
   lixo que só falha lá na SEFAZ.
3. **Corrigir o registro já envenenado** do `43505459000150` no ambiente — senão, mesmo com o
   código certo, esse cliente continua falhando.

Depois disso a NF-e da Aplopes deve passar a receber **`203`** (emissor não habilitado), que é
a rejeição correta para ela e o sinal de que o `dest` ficou bem formado.

---

## 📄 Onde baixar PDF e XML — hoje, em lugar nenhum pela interface

As rotas **existem na fiscal-api**:

| Documento | XML | PDF |
| --- | --- | --- |
| NF-e | `GET /v1/nfe/:id/xml` | `GET /v1/nfe/:id/danfe` (DANFE) |
| NFS-e | `GET /v1/nfse/:id/xml` | `GET /v1/nfse/:id/danfse` (DANFSE) |

Mas **o ERP não tem nenhum botão de baixar**. Procurei em `facilita-nfe`, `nfe-issuance` e
`nfse-issuance`: zero ocorrência de download, XML, DANFE ou "Baixar".

Ou seja: hoje só pelo Swagger/API. O `/financas/facilita-nfe` lista os documentos emitidos, mas
não deixa obter o arquivo — que é justamente o que o lojista precisa entregar ao cliente e ao
contador.

⚠️ Vale lembrar: **o XML e o PDF só existem para nota autorizada.** Documento rejeitado devolve
404, e isso é correto — não há documento fiscal a baixar. Como nenhuma emissão da Aplopes é
autorizada (falta credenciamento), o botão só poderá ser testado de verdade com um Emitente
credenciado.

**Sugestão:** ação de baixar XML e PDF na listagem do Facilita NF-e (menu da linha) e na tela de
emissão logo após um `AUTHORIZED`, habilitada só nesse status.

---

## Resumo

| # | Item | Situação |
| --- | --- | --- |
| — | B2 feedback traduzido com código e motivo | ✅ corrigido |
| — | B3 botões de emitir com fundo | ✅ corrigido |
| — | B1 payload do front com endereço | ✅ corrigido |
| 1 | `resolveCustomer` descarta o payload e devolve cadastro velho | 🔴 corrigir |
| 2 | Fallback grava endereço vazio | 🔴 corrigir junto |
| 3 | Cliente `43505459000150` envenenado no ambiente | 🔴 limpar |
| 4 | Sem botão de baixar XML/PDF no ERP | 🟡 implementar |
