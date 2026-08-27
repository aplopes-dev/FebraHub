# Guia — Movimentações de estoque

## O que é

Movimentações é o lugar onde você registra entradas e saídas manuais de
produtos no estoque — por exemplo, uma quebra, um desperdício, um ajuste de
contagem ou uma entrada avulsa que não veio de compra.

A tela também mostra, no mesmo histórico, as movimentações que o próprio sistema
gera: venda, compra, produção, transferência e inventário. Nessas, o **motivo**
vem pronto e não é editável; a **categoria** que você cadastra em Categorias de
Movimentação vale só para o que é lançado à mão.

## Para que serve

Com as movimentações você:

- Corrige o saldo quando algo entra ou sai fora do fluxo normal de vendas e
  compras.
- Escolhe se a operação é **entrada** (aumenta o estoque) ou **saída** (reduz
  o estoque) na mesma tela.
- Informa a categoria do motivo (ajuste, quebra, desperdício, etc.), a data e
  qual estoque foi afetado.
- Mantém um histórico do que foi movimentado, para auditoria e conferência.

## Como usar

### A tela de lista

Ao abrir **Movimentações**, você vê o histórico das operações já registradas.
Nela você pode:

- Separar por abas: **Todos**, **Entradas** e **Saídas**.
- **Buscar** por categoria, estoque ou nome/código do produto.
- Filtrar por **motivo** (Venda, Compra, Transferência, Inventário, Produção ou
  Lançamento manual) para isolar o que veio de cada fluxo.
- Clicar em **Nova movimentação** para registrar uma operação.
- Clicar em qualquer linha (ou em **Visualizar**, no menu de ações) para abrir
  o **detalhe da movimentação**: motivo, estoque, data, quem executou a
  operação e a lista completa de produtos movimentados com quantidade, preço
  de custo e subtotal.

### Registrar uma movimentação

A tela de registro une entrada e saída em um só fluxo:

1. Escolha o **estoque** que será afetado (canto superior do bloco de produtos).
2. Clique em **Adicionar** e selecione os produtos. O sistema mostra o **saldo**
   atual e o **preço de custo** de cada item.
3. Informe a **quantidade** a movimentar e, se precisar, ajuste o preço de
   custo.
4. No painel de **Informações gerais**, defina:
   - **Tipo de movimentação:** Entrada de estoque ou Saída de estoque.
   - **Categoria de movimentação:** o motivo (ex.: Ajustes de Estoque, Quebra).
   - **Data da operação.**
5. Clique em **Salvar**. Se ainda estiver editando, o sistema avisa que há
   alterações não salvas; use **Descartar alterações** para voltar ao estado
   anterior.

### Transferência entre estoques

Se a intenção for **mover produtos de um estoque para outro**, use o atalho
**Transferências** na própria tela de registro. Transferência é um fluxo
diferente de entrada/saída avulsa.

## Em resumo

Use Movimentações para entradas e saídas manuais de itens específicos, com tipo,
categoria, data e estoque na mesma tela. Para mudar produtos de um estoque para
outro, use Transferências.
