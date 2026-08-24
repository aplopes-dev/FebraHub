# Guia — Promoções

## O que é

Promoções são **regras de benefício** aplicadas nas vendas — brinde, desconto,
cupom ou “leve mais pague menos”. Nesta tela você acompanha as promoções
cadastradas, o período em que valem e se estão ativas, agendadas ou encerradas.

## Para que serve

- **Ver todas as promoções** da loja em um só lugar.
- **Separar o que está em uso** do que foi excluído.
- **Identificar rapidamente** o tipo de benefício e o período de validade.
- **Excluir ou restaurar** promoções sem apagá-las de vez.

## Como usar

### A tela de lista

Ao abrir Promoções, você vê os cadastros separados em duas abas:

- **Ativas** — promoções disponíveis (mesmo que o período ainda não tenha
  começado ou já tenha terminado).
- **Excluídas** — as que foram removidas (ficam guardadas e podem ser
  restauradas).

No topo há o botão **Nova promoção** e, abaixo das abas, a **busca por nome**.

Cada linha mostra:

- **Nome** da promoção
- **Tipo de promoção** (brinde por quantidade, desconto por valor, cupom, etc.)
- **Período** (data de início e fim)
- **Status** — Agendada (ainda não começou), Ativa (dentro do período) ou
  Encerrada (já passou o fim)

No menu de opções (⋯) de cada linha ativa você pode **Editar** (abre a promoção
no mesmo formulário de 3 etapas, já preenchido) ou **Excluir** (a promoção vai
para a aba Excluídas). Nas excluídas, a ação é **Restaurar**. Em promoções do
tipo **Cupom de desconto** aparece também **Baixar códigos do cupom**, que gera
uma planilha (CSV) com os códigos para distribuição.

### Criar uma promoção (Nova promoção)

O botão **Nova promoção** abre um formulário em **3 etapas**, com uma barra de
ações fixa no rodapé (à esquerda, a promoção selecionada; à direita, os botões
**Voltar**, **Continuar** e **Salvar**):

1. **Selecionar promoção** — escolha o tipo entre os 7 modelos, organizados em
   grupos (combos, por valor da compra, por quantidade e cupom). Cada card
   explica o que é e como usar.
2. **Informações gerais** — igual para todos os tipos: nome, descrição, vigência
   (início e término, com data e hora), opções da campanha (acumulativa,
   opcional, só clientes identificados), unidades onde a promoção vale e a
   **configuração de restrição** (sem restrições, apenas em dias específicos da
   semana ou apenas no mês de aniversário do cliente).
3. **Regras finais** — muda conforme o tipo escolhido. É onde entra a
   “matemática” da promoção: faixas de desconto progressivo, quantidade/valor do
   combo, detalhes do cupom, condição por valor/quantidade e a configuração de
   brindes (quando aplicável).

Ao salvar, a promoção passa a aparecer na lista.

### Editar uma promoção

No menu (⋯) de uma promoção, **Editar** abre o mesmo formulário de 3 etapas com
o tipo e as informações gerais já preenchidos — ajuste o que precisar e clique
em **Salvar alterações**. As regras detalhadas (etapa 3) voltam ao padrão,
porque o protótipo ainda não guarda essa parte da configuração.

### Tipos de promoção

| Tipo | Ideia |
| ---- | ----- |
| Brinde por quantidade | Ganha um brinde ao atingir certa quantidade |
| Desconto por quantidade | Desconto ao comprar uma quantidade mínima |
| Brinde por valor | Brinde ao atingir um valor de compra |
| Desconto por valor | Desconto ao atingir um valor de compra |
| Cupom de desconto | Código de cupom com desconto |
| Desconto progressivo | Quanto mais compra, maior o desconto |
| Leve mais pague menos | Ex.: leve 3 pague 2 |

## O que ainda não faz

- Persistência completa da configuração da campanha (mock: a lista guarda
  apenas nome, tipo e período; as regras detalhadas da etapa 3 são transientes,
  então não são recarregadas ao editar).
- Ligação automática com o PDV ou com o pedido de venda (integração futura).
