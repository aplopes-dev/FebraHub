# Guia — Módulos do PDV

## O que é

O Citybox atende **restaurante e loja no mesmo sistema**. Um restaurante usa
mesas e comandas; uma loja de roupa não. Uma loja consulta preço no balcão; um
restaurante raramente.

Aqui você diz **quais telas os seus PDVs mostram**. O que estiver desligado
some da tela inicial do caixa, do menu lateral e do atalho de teclado.

## Para que serve

- **Deixar a tela do caixa com o que a sua loja realmente usa.** Menos botão na
  frente do operador é menos erro e menos treinamento.
- **Tratar caixas diferentes de formas diferentes.** O caixa do salão usa
  mesas; o balcão de retirada, não.

## Como usar

### 1. Defina o padrão da loja

Em **Ponto de venda → Configurações → Módulos**.

Escolha um **perfil** — Restaurante, Lanchonete com delivery, Loja ou Mercado.
Ele liga de uma vez o conjunto que aquele tipo de negócio costuma usar. Depois,
ajuste chave a chave se quiser.

> Ao ajustar qualquer chave, o perfil vira **Personalizado**. É proposital: um
> conjunto que já não é "Loja" não pode continuar dizendo que é.

### 2. Ajuste um PDV específico, se precisar

No cadastro do PDV (**Ponto de venda → Cadastros**), há a seção **Módulos** com
a chave **"Usar o padrão da loja"**.

| Chave | O que acontece |
|---|---|
| **Ligada** | O PDV segue o padrão e **muda junto** quando você mudar o padrão da loja |
| **Desligada** | O PDV tem a própria configuração e **não muda** com a loja |

Desligar a chave copia o padrão atual como ponto de partida — você ajusta só o
que for diferente.

## O que é importante saber

**Desligar um módulo esconde a tela; não apaga o que já existe.** Mesa ocupada,
comanda aberta e pedido de delivery em rota continuam no sistema, invisíveis até
você religar. Se precisar fechar o que está aberto, faça isso **antes** de
desligar.

**A mudança não chega instantaneamente nos caixas.** Cada PDV recarrega a
configuração na próxima vez que falar com o servidor — na prática, ao reabrir o
app. Um caixa sem rede continua com o que tinha.

**Alguns módulos não podem ser desligados.** Balcão, Cliente, Vendedor, Caixa,
Sangria/reforço, Últimas vendas, Devolução e Crédito são o que qualquer caixa
faz, em qualquer tipo de loja. Por isso nem aparecem na lista.

**Delivery é um módulo só.** No PDV, novo pedido e quadro vivem na mesma
tela (**Pedidos delivery** → Novo delivery). No ERP aparece um único switch
**Delivery**; o id interno `delivery` só espelha `delivery_orders`.

## Dicas

- **Comece pelo perfil.** Ele acerta o conjunto em um clique, e ajustar dois ou
  três itens depois é mais rápido que decidir seis do zero.
- **Prefira o padrão da loja.** Configurar caixa a caixa vira trabalho a cada
  PDV novo — e quem herda acompanha as suas mudanças sozinho.