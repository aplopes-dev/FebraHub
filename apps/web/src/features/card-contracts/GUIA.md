# Contratos de cartões e outros

Os **contratos de cartões e outros** representam os vínculos da sua empresa com
provedores de pagamento (maquininhas, gateways, etc.). Eles definem como as
vendas parceladas no cartão serão recebidas e agrupadas.

## Colunas da lista

| Coluna | Descrição |
| ------ | --------- |
| **Provedor** | Nome da adquirente ou gateway (ex.: Cielo, Stone, Rede). |
| **Conta para crédito** | Conta bancária onde os valores são depositados. |
| **Métodos** | Quantidade de métodos de pagamento configurados. |
| **Agrupamento** | Como as vendas são agrupadas: por **bandeira**, por **método** ou sem agrupamento. |
| **Status** | Se o contrato está ativo ou inativo. |

## Abas

- **Ativos** — contratos em uso.
- **Excluídos** — contratos removidos que podem ser restaurados.

## Como usar

- **Buscar:** digite o nome do provedor no campo de busca.
- **Novo contrato:** clique em **Novo contrato** e preencha provedor, conta
  bancária, prazos e taxas. Salve para ir à lista.
- **Editar:** clique em **⋮ > Editar** (ou na linha). Na tela de detalhe você
  altera o contrato e gerencia os **métodos de pagamento** (Pix, débito, crédito
  com faixas progressivas).
- **Excluir:** clique em **⋮ > Excluir** — o contrato vai para a aba Excluídos.
- **Restaurar:** na aba Excluídos, use **⋮ > Restaurar**.

## Conta bancária

A conta para crédito vem do cadastro de **Contas bancárias**. Cadastre a conta
antes de criar o contrato.

## Para que serve este cadastro, na prática

Este contrato faz o Financeiro saber **exatamente quanto** e **quando** você
vai receber por uma venda no cartão — em vez de mostrar o valor cheio da venda
na hora, como se o dinheiro já tivesse caído na conta.

**Sem o contrato configurado:** uma venda de R$ 100,00 no débito aparece no
Financeiro como R$ 100,00, recebida hoje. Mas a maquininha cobra uma taxa e só
deposita o valor no dia seguinte (ou depois) — o Financeiro fica mostrando um
valor e uma data que não batem com o que realmente cai na sua conta.

**Com o contrato configurado:** a partir do momento em que você fecha uma
venda no cartão ou Pix, o sistema já lança o recebível **com a taxa
descontada** e **na data em que o dinheiro efetivamente cai na conta** —
aguardando recebimento, não já quitado. Se a venda for parcelada no cartão de
crédito, o sistema já lança as parcelas futuras certinhas, ou uma parcela
única, dependendo de como você configurou o "Prazo entre parcelas".

### O que cada campo muda no Financeiro

- **Dias para o 1º pagamento / dias úteis ou corridos:** define quando o
  recebível vai vencer. "Dias úteis" pula sábado e domingo; "dias corridos"
  conta todos os dias, inclusive fim de semana.
- **Habilitar vencimento em apenas dias úteis:** se o cálculo cair num fim de
  semana, o vencimento é empurrado para a próxima segunda-feira.
- **Prazo entre parcelas (Pagamento único / dias úteis / dias corridos):**
  no cartão de crédito parcelado, define se a maquininha repassa tudo de uma
  vez ("Pagamento único") ou parcela por parcela, nas datas futuras certas.
- **Taxa (%) e Tarifa:** o valor que a adquirente cobra por venda — descontado
  automaticamente do valor que entra no Financeiro. A tarifa é um valor fixo
  em dinheiro, além da taxa em porcentagem (menos comum).
- **Faixas de taxa progressiva:** quando a taxa muda conforme o número de
  parcelas (ex.: taxa menor para 1-3x, maior para 4-6x), cadastre as faixas em
  vez de uma taxa única — o sistema aplica automaticamente a faixa certa
  conforme a venda.
- **Agrupamento:** hoje só organiza como os recebíveis são conferidos contra o
  extrato bancário — não muda o valor nem a data de nenhum recebível.

### O que ainda não tem efeito

Alguns campos deste cadastro existem, mas **ainda não mudam nada** no
Financeiro — ficam guardados para uma entrega futura:

- **Período de corte** (diário/semanal/mensal).
- **Antecipação** (período e taxa).
- **Tarifa para depósito** (a do contrato, na seção "Taxas e antecipações") —
  diferente da taxa/tarifa de cada **método de pagamento**, essa sim aplicada.
- **Definir todas as entradas como pagas neste contrato**.
- **Pagamentos são depositados apenas em dias úteis** (a que decide isso hoje
  é "Habilitar vencimento apenas em dias úteis", na seção Prazos de
  pagamento).
- **Parcelas mínimas/máximas** de cada método — cadastráveis, mas o sistema
  ainda não recusa nem avisa se uma venda vier com um número de parcelas fora
  da faixa configurada.
- Bandeira "Voucher" — hoje só Pix, débito e crédito são reconhecidos pelo
  motor de recebíveis.

### Se a venda não encontra um contrato configurado

Se uma venda for feita numa bandeira ou forma de pagamento sem contrato
cadastrado, o sistema **nunca trava a venda** — ela fecha normalmente, e o
recebível entra do jeito antigo (valor cheio, já recebido, na data da venda).
Nesse caso, o lançamento aparece na tela de Lançamentos com um aviso — "Gerado
sem contrato de cartão aplicável" — sinalizando que vale a pena revisar o
cadastro deste contrato.
