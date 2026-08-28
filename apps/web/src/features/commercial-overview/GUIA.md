# Guia — Visão geral do Comercial

## O que é

A primeira tela do módulo. O desenho é o do hub do **web legado**, que já tinha
resolvido a densidade: números no topo, pendências logo abaixo, e então duas
colunas — **história à esquerda**, **gente à direita**.

## Para que serve

- Ver **como o mês está** e como ele se compara ao mesmo mês do ano passado.
- Saber **o que precisa de atenção hoje**, com um clique para onde se resolve.
- Ver **quem está entregando** — e a que preço.
- Entrar direto na **sala do evento** que está acontecendo.

## Como ler a tela

**Faixa de chips.** Um único chip é destacado: o *valor praticado no mês*. Os
outros existem para qualificá-lo — quantas matrículas o produziram, a que
ticket, contra que ano, com quanto de desconto. Se tudo fosse destaque, nada
seria.

**Pílulas de alerta.** Fila de trabalho, não resumo: follow-up vencido, sem
próxima ação, parada, desconto travado, lead órfão. Cada uma leva para a tela
onde aquilo se resolve.

**Evolução do faturamento.** 13 meses. Duas convenções herdadas do legado e que
valem manter:

- a **última barra é hachurada** porque o mês é parcial — barra cheia ao lado
  de barra parcial faz o mês em curso parecer queda;
- a **linha tracejada é o mesmo mês do ano anterior**, comparação e não meta.
  Não existe meta no banco, e pintar referência como meta é inventar cobrança.

**Matrículas × faturamento.** Dois eixos, porque contagem e reais não dividem
escala. Responde o que o total esconde: o mês cresceu porque vendeu **mais** ou
porque vendeu **mais caro**?

**Consultores.** Pódio para os três primeiros, lista para o resto, ordenado por
valor praticado — com o desconto médio na mesma linha. Só quem carrega carteira
entra: relacionadora apoia a venda, e ranqueá-la por valor a deixaria
eternamente em R$ 0.

**Sala de hoje** e **próximas edições** fecham a coluna da direita: o que está
acontecendo agora e o que vem.

**Rodapé de fontes.** De onde viria cada número — e, enquanto o `apps/api` não
expõe o comercial, ele diz exatamente isso em vez de fingir sincronismo.

## Em resumo

Não existe card de "receita total": ingresso de evento e matrícula de curso são
unidades de negócio diferentes e nunca se somam.
