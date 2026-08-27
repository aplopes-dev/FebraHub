# Guia — Pedidos de venda

## O que é

Pedidos de venda é a lista onde você acompanha os pedidos feitos na loja —
quem comprou, quanto valeu, em que status está e quem registrou. Também é
por aqui que você cria um **novo pedido** completo.

## Para que serve

Com essa tela você:

- Vê de forma rápida os pedidos abertos e os que foram excluídos.
- Filtra por status, valor do pedido e período (hoje, ontem, últimos dias
  ou uma data específica).
- Busca pelo número do pedido, nome do cliente ou quem criou.
- Acompanha o status de cada pedido (aberto, em preparação, em entrega,
  aguardando, etc.).
- Cria um novo pedido com produtos, pagamentos, cliente e observações.
- Usa o menu de ações para alterar status, imprimir, baixar PDF ou excluir
  um pedido.

## Como usar

### A tela de lista

Ao abrir **Pedidos de venda**, você vê:

- O botão **Novo pedido** no topo (abre o cadastro).
- As abas **Aberto** (pedidos ativos) e **Excluídos**.
- A **busca**, o botão **Filtro** e a **Ordenação**.

No **Filtro** você pode combinar:

- **Status** — um ou mais status do pedido.
- **Valor do pedido** — valor mínimo e/ou máximo.
- **Período** — Todos, Hoje, Ontem, últimos dias ou uma data específica
  (com seletor de data ou intervalo).

### A tabela

Cada linha mostra:

- O número do pedido (ex.: `#1`) e o nome do cliente.
- O valor, o status, quem criou e o **canal de venda** (ponto de venda,
  delivery, marketplace ou cardápio digital).
- A data de criação por último.

### Menu de ações (⋯)

No menu de cada pedido você pode:

- **Alterar status** — escolhe o novo status (com uma bolinha de cor ao lado
  de cada opção).
- **Gerar nota fiscal** — opções de NFe e NFCe (ainda indisponíveis).
- **Imprimir pedido**, **Baixar PDF**, **Gerar venda** e **Editar** — abre o
  mesmo formulário de criação, já preenchido com os dados do pedido.
- **Excluir** — move o pedido para a aba Excluídos.

### Novo pedido

Clique em **Novo pedido** para abrir o formulário. A tela tem duas colunas:

**À esquerda**

- **Produtos** — escolha o estoque, busque e adicione itens (quantidade e
  preço unitário editáveis). Use o menu ⋯ da linha para remover.
- **Pagamentos** — enquanto houver um único recebimento, o **valor é
  preenchido automaticamente** com o total do pedido (produtos + taxa de
  entrega − descontos), atualizando sozinho a cada produto adicionado/removido
  ou quantidade/preço alterado. Informe a forma de pagamento e a conta
  bancária. No resumo você define **taxa de entrega** e **descontos**
  (clicando nos links) e vê o total.
  - **Dividir entre mais de uma forma de pagamento** (ex.: parte em dinheiro,
    parte no cartão): clique em **Adicionar recebimento** quantas vezes
    precisar — o valor total é **rateado automaticamente** em partes iguais
    entre todos os recebimentos (a diferença de centavos, se houver, fica nos
    primeiros). Você pode ajustar cada valor manualmente depois; a tela mostra
    um aviso comparando a soma dos recebimentos com o total do pedido:
    **"Recebimentos cobrem o total do pedido"** (verde) quando bate certinho,
    **"Restante a receber"** (âmbar) se faltar valor, ou **"Valor recebido a
    mais"** (vermelho) se passar do total.
  - **Cartão de débito, cartão de crédito ou Pix:** ao escolher uma dessas
    formas de pagamento, aparecem campos extras. Para débito e crédito,
    informe a **bandeira** do cartão (Visa, Mastercard, etc.); para crédito,
    informe também o **número de parcelas**. Esses dois dados são o que
    permitem ao Financeiro calcular automaticamente, na hora de fechar a
    venda, o valor líquido (já descontada a taxa da adquirente) e a data
    certa em que o dinheiro cai na conta — de acordo com o que estiver
    configurado no **Contrato de cartões** daquela conta bancária. Sem um
    contrato cadastrado para a bandeira usada, a venda fecha normalmente e o
    recebível aparece do jeito de sempre (valor cheio, já recebido) — ver o
    guia de **Contratos de cartões e outros**.

**À direita**

- **Cliente** — selecione no combobox (busca por nome/telefone/e-mail) ou
  clique em **Novo cliente** para cadastrar rápido (nome obrigatório; CPF,
  telefone, e-mail e endereço opcionais). Sem cliente, o pedido fica como
  “Consumidor final”.
- **Informações da venda** — data, status e vendedor (obrigatório).
- **Observações da venda** — use **Editar** para incluir uma nota.

Enquanto você altera o formulário, o rodapé avisa que há **alterações não
salvas**. Clique em **Salvar** para gravar e voltar à lista, ou em
**Descartar alterações** para desfazer o que digitou.

## Em resumo

Use Pedidos de venda para acompanhar o dia a dia das vendas da loja, criar
novos pedidos, filtrar pelo período que importa e atualizar o status de
cada pedido.
