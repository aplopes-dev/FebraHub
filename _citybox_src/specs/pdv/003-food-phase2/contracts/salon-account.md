# Contract: Salon account (mesas / comandas / atendimentos)

Contrato interno do domínio de salão. Persistência local — sem HTTP.

## Identifiers

| Conceito | Module id | Feature folder |
|---|---|---|
| Mesas | `tables` | `features/tables/` |
| Comandas | `tabs` | `features/tabs/` |
| Atendimentos | `service` | `features/service/` |

## Operations (application API — nomes ilustrativos)

| Operação | Pré-condição | Efeito |
|---|---|---|
| `openTable(tableId)` | mesa `free`; turno open; módulo tables | cria `SalonAccount`; mesa `occupied`; navega counter |
| `resumeAccount(accountId)` | account open/closing | navega counter com accountId |
| `openTab({number?, card?})` | turno open; módulo tabs; id único se open | cria/retoma account; counter |
| `listOpenTabs()` | — | contas com tabNumber/card e status open/closing |
| `transferTable(from, to)` | from occupied; to **free** | move tableId; se to occupied → **erro** |
| `joinAccounts(sourceId, targetId)` | ambos open | merge lines → target; source closed; confirmação UI |
| `splitEqual(accountId, n)` | n≥2; account open | N contas; totais partes iguais; resto na 1ª |
| `beginClose(accountId)` | open | status closing; navega payment |
| `cancelAccount(accountId)` | confirmação | closed; mesa free se aplicável |
| `serviceQueue()` | módulo service | projeções das accounts open/closing |

## Table status mapping

| Account | Mesa |
|---|---|
| nenhuma / closed | `free` |
| open | `occupied` |
| closing | `closing` |

## Errors (domínio → UI)

| Código | Quando | UI |
|---|---|---|
| `shift_required` | sem turno | redirect hub Caixa |
| `table_occupied` | transfer destino ocupado | mensagem; não silenciar |
| `tab_not_found` | número inválido | PdvErrorState / snack |
| `tab_duplicate` | número já open | mensagem |
| `empty_account` | fechar sem itens | bloquear ou confirmar zero (fixture: bloquear) |
| `sale_in_progress` | operação destrutiva com pagamento a meio | confirmação |

## Persistence shape (sketch)

```json
{
  "version": 1,
  "tables": [{ "id": "t1", "label": "Mesa 1", "sortOrder": 0 }],
  "accounts": [{ "id": "a1", "status": "open", "tableId": "t1", "lines": [] }],
  "deliveryOrders": []
}
```

Chave: `pdv.salon.v1`.
