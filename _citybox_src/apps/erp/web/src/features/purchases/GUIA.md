# Guia — Compras

## O que é

Compras é o lugar onde você registra a aquisição de produtos junto aos
fornecedores: o que entrou, quanto custou, como será pago e em qual estoque a
mercadoria deve ficar.

## Para que serve

Com as compras você:

- Lança produtos comprados com quantidade e custo.
- Escolhe o estoque de destino e o fornecedor.
- Informa série, número da nota, observações e, se precisar, frete, descontos e
  outras despesas.
- Atualiza o estoque **somente** quando o status da entrega estiver como
  **Recebido**.

> **Sobre o pagamento da compra:** o lançamento financeiro ainda não é criado a
> partir da compra. Registre o título em **Finanças › Lançamentos**, escolhendo
> o fornecedor e a categoria. A tela de compra cuida da entrada da mercadoria;
> o financeiro é lançado à parte.

## Como usar

### A tela de lista

Ao abrir **Compras**, você vê o histórico. Nela você pode:

- Separar por abas: **Ativas** e **Excluídas**.
- Filtrar pelo **status** (Todos, Pendente ou Recebido).
- **Buscar** por código da compra, fornecedor ou número da NF.
- Usar **Filtro** para restringir por estoque, fornecedor e período.
- Selecionar linhas com a caixa de seleção.
- Clicar em **Nova compra** para lançar uma aquisição.
- No menu da linha (ativas): **Baixar PDF da compra**, **Imprimir**, **Editar**
  (ou **Visualizar** se já recebida) ou **Excluir** (vai para Excluídas).
- Na aba **Excluídas**, o menu tem **Restaurar** (volta para Ativas; não altera
  o estoque).

### Registrar uma nova compra

1. Em **Produtos**, escolha o **estoque**, clique em **Adicionar** e informe
   quantidade e preço de custo de cada item.
2. Em **Fornecedor**, selecione quem vendeu.
3. Em **Informações da compra**, preencha data, série, número da NF e
2. Em **Pagamentos**, selecione forma de pagamento (lista vem do cadastro em
   Configurações → Formas de pagamento) e conta bancária (prévia — ainda não
   é salva com a compra).
3. Em **Fornecedor**, selecione quem vendeu.
4. Em **Informações da compra**, preencha data, série, número da NF e
   observações. Defina o **status da entrega** (Pendente ou Recebido).
4. Se houver frete, descontos ou outras despesas, clique em **Informar** em
   Frete e despesas e preencha o modal.
5. Clique em **Salvar**. Se o status for **Recebido**, abre o modal para
   confirmar quais itens chegaram (ou foram cancelados) e a quantidade real;
   em seguida o sistema lança a **entrada no estoque**. Depois disso a compra
   fica só para visualização.

> Ao marcar como **Recebido**, cada item precisa ficar como *recebido* ou
> *cancelado* — não é possível fechar a compra deixando item em aberto. Se parte
> da mercadoria ainda não chegou, mantenha a compra como **Pendente** até a
> entrega ser concluída.

## Em resumo

Use Compras para registrar compras de fornecedor. Deixe o status **Pendente**
se a mercadoria ainda não chegou; ao marcar **Recebido**, confirme os itens e
salve para atualizar o estoque.
