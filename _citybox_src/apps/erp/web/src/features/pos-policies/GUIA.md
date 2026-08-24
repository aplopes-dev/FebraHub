# Guia — Alçadas do PDV

## O que é

**Alçada** é até onde o operador de caixa vai sozinho. Acima do que você
definir aqui, o PDV para e pede o **PIN de um supervisor** antes de continuar.

## Para que serve

- **Segurar desconto** dado por conta própria no balcão.
- **Segurar sangria** acima de um valor.
- **Exigir supervisor** para cancelamento de venda e devolução.
- **Deixar registrado quem autorizou** cada exceção — o nome do supervisor
  fica gravado junto com a operação.

## Como usar

### Limites do operador

| Campo | O que significa |
|---|---|
| **Desconto sem supervisor (até %)** | Desconto **acima** disto pede PIN de supervisor. Com 10, um desconto de exatamente 10% passa; 11% já pede. **100 = nunca pede.** |
| **Sangria sem supervisor (até)** | Mesma lógica, em dinheiro. **R$ 0,00 = sempre pede.** |

### Operações que exigem supervisor

Cancelamento de venda e devolução são liga/desliga — não têm valor de corte,
porque não é o tamanho que importa: é a operação sair do fluxo normal.

## O que é importante saber

**A alçada vale para a empresa inteira, não por terminal.** É proposital: se
cada caixa tivesse o seu limite, bastaria escolher o mais frouxo para
contornar a regra.

**A mudança não chega instantaneamente nos terminais.** Cada PDV recarrega a
alçada na próxima sincronização com o servidor. Se você acabou de apertar o
limite, um caixa que está sem rede continua com o valor antigo até voltar.

**Sem rede, as exceções ficam bloqueadas** — mesmo com o supervisor do lado.
Cancelamento, devolução e desconto acima do limite exigem servidor: são
justamente as operações que não podem ser conferidas depois do fato.

**Empresa que nunca abriu esta tela já começa restritiva:** desconto até 10%,
sangria até R$ 500, cancelamento e devolução pedindo supervisor. O contrário —
começar liberado — seria uma loja sem alçada nenhuma sem ninguém ter decidido
isso.

## Dicas

- **Limite muito baixo trava a operação.** Se o caixa chama o supervisor dez
  vezes por dia, o supervisor acaba entregando o PIN — e aí a alçada deixa de
  existir de verdade. Prefira um limite que o dia a dia respeite.
- **Supervisor é perfil de operador**, definido em *Ponto de venda →
  Operadores*. Sem ninguém marcado como supervisor, ninguém consegue autorizar.
