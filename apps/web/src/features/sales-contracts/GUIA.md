# Contratos de venda

## Para que serve

Contratos de venda registram vendas recorrentes (serviços ou produtos cobrados em intervalos). Ao salvar o contrato, o sistema gera automaticamente as parcelas no financeiro (mock nesta versão), evitando lançamentos manuais todo mês.

## Telas

### Listagem (`/vendas/contratos-de-vendas`)

- Abas **Ativos** e **Excluídos**
- Busca por número, cliente ou item
- Filtros: status do contrato, cliente, categoria do cliente, vencimento das parcelas, produtos/serviços e status do pagamento (pago / em aberto / vencido)
- Paginação com quantidade de itens por página
- Ações: **Status** (abre drawer de gestão) e **Novo contrato**

### Novo / Editar (`/novo` e `/[id]`)

Formulário em três seções (layout título/descrição à esquerda + card à direita):

1. **Informações gerais** — cliente, vendedor, início, término (ou indefinido), status, detalhe do status e observação
2. **Produtos ou serviços** — itens com quantidade e valor
3. **Pagamento e recorrência** — primeiro vencimento, frequência, duração (para sempre / até a data / algumas vezes) e forma de pagamento

Ao **Salvar**, as parcelas são geradas conforme a recorrência. Em contratos “para sempre”, o mock gera um horizonte de 12 parcelas iniciais.

### Drawer de Status

O botão **Status** na listagem abre um drawer lateral para cadastrar, editar, excluir e **arrastar para reordenar** os status personalizados (ex.: Ativo, Aberto, Inativo). Status em uso por contratos não podem ser excluídos.

## Observações

- Dados em memória (mock) — sem API ainda
- Integração real com Finanças (contas a receber) virá em etapa posterior
