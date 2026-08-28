# Guia — Funil de vendas

## O que é

O **funil** é onde as oportunidades comerciais vivem: cada card é uma pessoa
interessada num produto, numa etapa da negociação. É a tela do dia a dia do
consultor e o painel de caça do gestor.

## Para que serve

- **Ver onde cada negociação está** — em quadro (arrastar entre etapas) ou em
  lista (comparar valor, desconto e tempo parado).
- **Achar o que travou**: os quatro recortes rápidos no topo são os buracos
  conhecidos — paradas há 14 dias, follow-up vencido, sem próxima ação e
  desconto esperando aprovação.
- **Fechar ou perder** com o registro que cada caminho exige.

## Como usar

### O quadro

Cada coluna é uma etapa configurada do funil (elas vêm do cadastro, não do
código). O cabeçalho mostra **quantas** e **quanto** — porque cinco
oportunidades de R$ 300 e cinco de R$ 12 mil não são a mesma coluna.

Arrastar o card muda a etapa e grava na linha do tempo. Soltar em **Perdida**
abre a caixa de motivo: a etapa é marcada como `requiresReason` e o card só vai
depois que o motivo for registrado.

### A ficha (clique no card)

Três colunas com papéis distintos:

- **Esquerda — quem é**: contato, origem e a **jornada** (o que a pessoa já
  comprou e em que eventos esteve). É o que muda a conversa: quem já fez o
  Método CIS não recebe a mesma oferta de quem nunca veio.
- **Centro — o que aconteceu**: linha do tempo, com a caixa de registro rápido
  em cima. Registrar tem que custar menos que não registrar.
- **Direita — o que decide**: próxima ação e proposta.

### Proposta e alçada

A proposta mostra **tabela**, **praticado** e **desconto** como três números.
Cada produto tem uma alçada (`maxDiscountPercent`); desconto acima dela não
bloqueia a venda — manda para aprovação e fica visível como tal.

Marcar **ganha** gera a venda em `/comercial/vendas`, sempre *aguardando
aprovação* e com o financeiro *pendente*. O comercial não decide que o dinheiro
entrou.

## Em resumo

Quadro para operar, lista para comparar, ficha para decidir. Perder exige
motivo, desconto acima da alçada exige aprovação, e ganhar gera venda.
