# KDS — guia de uso

**KDS** (Kitchen Display System) é a tela que mostra à equipe de produção os
pedidos que precisam ser preparados. No lugar da comanda impressa, o pedido
aparece direto no monitor da cozinha, do bar ou da chapa.

Cada KDS recebe **só os produtos que foram vinculados a ele**. Assim a cozinha
vê os pratos, o bar vê as bebidas, e ninguém precisa filtrar nada na correria.

**Onde fica:** menu **Ponto de venda → KDS**.

---

## A lista de KDS

Mostra todas as telas cadastradas:

- **Nome** — como a tela é chamada (ex.: Cozinha, Bar, Expedição).
- **Status** — se está **Ativo** (recebendo pedidos) ou **Inativo**.
- **Expedição** — **Sim** quando esta tela é a responsável por conferir o pedido
  montado e liberá-lo para entrega ou retirada.

Use a busca no topo para filtrar por nome. A caixa de seleção à esquerda permite
marcar várias telas de uma vez.

---

## Cadastrar um KDS

Clique em **Novo KDS**, no topo direito, e preencha:

| Campo | O que significa |
|---|---|
| Nome | Como a tela vai ser identificada. Use o nome do posto de trabalho (Cozinha quente, Bar, Sobremesas). |
| Status | **Ativo** já começa a receber pedidos; **Inativo** deixa a tela cadastrada mas parada. |
| Tela de expedição | Ligue apenas na tela que faz a conferência final do pedido antes de sair. Normalmente é uma só. |

Clique em **Salvar**. O KDS aparece na lista, ainda sem produtos.

> Um KDS recém-criado não recebe nada até você vincular produtos a ele.

---

## Vincular produtos ao KDS

É o que define o que cada tela vai mostrar.

1. Na lista, abra o menu de três pontos da tela desejada.
2. Clique em **Vincular produtos**.
3. Na tela que abrir, clique em **Adicionar produtos**.
4. Marque os produtos na lista lateral (dá para buscar por nome ou código) e
   confirme.

Os produtos vinculados aparecem numa tabela com **Nome**, **Código (SKU)** e
**Categoria**. A busca no topo filtra essa tabela.

**Para desvincular:** menu de três pontos do produto → **Remover do KDS**. O
produto continua normalmente no catálogo — só deixa de ser enviado para aquela
tela.

Um mesmo produto pode estar em mais de um KDS, se ele passa por mais de um
posto de preparo.

---

## Editar, inativar e excluir

Tudo pelo menu de três pontos da linha:

- **Editar** — muda nome, status e a marcação de expedição.
- **Marcar como inativo** — a tela para de receber pedidos, mas o cadastro e os
  produtos vinculados ficam guardados. Use quando um posto está fechado por um
  período. Para religar, use **Marcar como ativo** no mesmo menu.
- **Excluir** — remove a tela da listagem. Os produtos vinculados deixam de ser
  enviados para ela. O sistema pede confirmação antes.

---

> **Nesta fase os KDS são de demonstração.** Os cadastros valem enquanto a
> página estiver aberta e voltam ao estado inicial quando você recarrega. Os
> **produtos** que aparecem para vincular, porém, são os do seu catálogo real.
