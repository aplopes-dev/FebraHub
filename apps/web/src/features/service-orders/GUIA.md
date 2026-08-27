# Guia — Ordens de serviço

## O que é

Ordem de serviço (OS) é o registro completo de um serviço prestado no
equipamento de um cliente: da entrada na loja, passando pelo diagnóstico,
orçamento e conserto, até a cobrança e a devolução. É a tela ideal para
assistências técnicas (informática, celulares), oficinas (mecânica,
bicicletas), relojoarias e reparos em geral.

## Para que serve

- **Registrar a entrada** do equipamento do cliente (o que chegou, em que
  estado, com qual defeito relatado) e em qual estoque provisório ele fica.
- **Documentar o laudo técnico**: defeito declarado, defeito encontrado,
  solução aplicada e observações — por equipamento.
- **Orçar e colher a aprovação do cliente** antes de executar, evitando
  cobranças não autorizadas.
- **Lançar a cobrança**: serviços (ex.: horas de mão de obra) e produtos/peças,
  com total calculado automaticamente.
- **Concluir e receber**: transforma a OS em uma venda com o pagamento
  registrado.

## Como usar

### A lista

Em **Vendas > Ordem de serviços** você vê as OSs organizadas em abas por
etapa: **Aberta**, **Em andamento**, **Pronta para retirada**, **Concluída** e
**Cancelada**. Cada linha mostra código, cliente, equipamento, técnico, prazo
(com aviso **Vencido** quando estourado), total e status.

- **Buscar** por código, cliente, equipamento ou nº de série.
- **Filtrar** por status, técnico responsável e período de abertura;
  **ordenar** por abertura, prazo, valor ou número.
- Menu ⋯ de cada linha: **Editar**, **Imprimir** (OS, termo de entrada, termo
  de retirada), **Gerar venda** e **Cancelar OS**.

### Gerenciar status

O botão **Gerenciar status** abre o painel para criar, renomear, reordenar,
inativar ou excluir status (ex.: criar "Aguardando cliente buscar"). Cada
status pertence a uma **etapa** (tipo-base) — é ela que define em qual aba a
OS aparece, então seus status personalizados nunca quebram a navegação.
Status em uso por alguma OS não podem ser excluídos.

### Nova OS / edição

O formulário tem quatro seções:

1. **Informações gerais** — cliente (com telefone preenchido automaticamente),
   abertura, prazo de entrega, vendedor/atendente, técnico responsável e
   status.
2. **Equipamentos recebidos** — um ou mais itens por OS. Para cada um: nome,
   marca/modelo, nº de série/IMEI, estoque provisório, status do item (em
   bancada, em reparo, aguardando peça…), flags de **recebido**/**devolvido**
   e o **laudo técnico** em 4 campos.
3. **Serviços e produtos** — a cobrança. Serviços com descrição livre e
   produtos puxados do catálogo (preço preenchido automaticamente). Cada linha
   tem quantidade × valor − desconto, status próprio e o total é somado
   automaticamente (ex.: 2h de mão de obra a R$ 10 = R$ 20).
4. **Orçamento e aprovação** — valor orçado, data, taxa de diagnóstico e a
   decisão do cliente (aguardando, aprovado ou reprovado) com data e
   observação de quem aprovou.

No rodapé ficam o **total da OS** e as ações: **Imprimir**, **Salvar** (a OS
fica registrada para a equipe continuar depois) e **Salvar e gerar venda**.

### Salvar e gerar venda

Quando o serviço termina e o cliente vai pagar, use **Salvar e gerar venda**:
abre a tela de recebimento (uma ou mais formas de pagamento, com rateio do
valor), e ao confirmar a OS é marcada como **Concluída** e a venda aparece na
tela de **Vendas**.

## O que ainda não faz

- Checklist de entrada estruturado, senha do equipamento e fotos/anexos
  (roadmap).
- Garantia do serviço com prazo e OS de retorno vinculada (roadmap).
- Prioridade da OS (baixa/normal/alta/urgente) (roadmap).
- Impressão real da OS e dos termos (hoje as ações apenas avisam "em breve").
- Notificações ao cliente (WhatsApp/e-mail) e portal de acompanhamento.
- Baixa real de estoque das peças e lançamento financeiro (mock UI — os dados
  somem ao recarregar a página).
