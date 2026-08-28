# Guia — Eventos e operação de sala

## O que é

Uma **edição** é o produto datado: mesmo treinamento, instrutor, praça e lote
diferentes dão resultados que não se comparam. É a edição que fatura — e é nela
que a conversão do negócio acontece.

## Para que serve

- **Acompanhar ingressos** por lote (Bronze, Black, Diamond) e ocupação da casa.
- **Ver o funil do dia**: ingressos → presentes → abordados → matrículas.
- **Operar a sala** enquanto o evento acontece.

## Como usar

### Lista e detalhe

A lista mostra ocupação e receita de ingresso ao lado das matrículas geradas na
sala — são dois resultados diferentes, e um evento pode acertar um e falhar no
outro. O detalhe abre lotes, funil e as vendas fechadas naquela edição.

### Operação de sala (`/comercial/eventos/<id>/sala`)

É a tela que um CRM genérico não tem. Durante o evento ela responde quem entrou,
quem já foi abordado e quem fechou — **enquanto ainda dá tempo de agir**.

- O filtro padrão é **A abordar**: quem fez check-in e ninguém falou ainda.
- **Check-in** por linha; a busca aceita nome ou telefone.
- **Abordagem** registra quem abordou e o desfecho. "Matriculou" cria a
  oportunidade já ganha (com o evento como origem), gera a venda e marca a
  pessoa como aluno.

A conversão fica ao lado dos absolutos de propósito: sete matrículas parece bom
até aparecer que havia oitenta pessoas na sala.

## Em resumo

Só edições em andamento ou encerradas têm sala. A matrícula fechada na sala é
registro, não estimativa — é o que faz a conversão evento→curso existir de fato.
