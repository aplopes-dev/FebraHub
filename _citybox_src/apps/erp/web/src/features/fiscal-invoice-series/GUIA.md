# Guia — Séries de Nota Fiscal (aba Séries)

Explica, em linguagem simples, como usar a aba **Séries** da tela Fiscal.

## O que é

Toda nota fiscal tem uma **série** e um **número** que avança a cada emissão (001, 002, 003…).
A série organiza essa numeração. Esta tela deixa você ver e controlar as séries da sua empresa.

## Onde fica

**Configurações → Fiscal → aba Séries**.

## Ambiente (Homologação / Produção)

No topo há um seletor de **ambiente**. A mesma série tem uma numeração para **Homologação**
(testes) e outra para **Produção** (valendo de verdade). Você vê **um** ambiente por vez para não
confundir os números. O padrão é Homologação.

## O que aparece na lista

Cada linha mostra:
- **Série** (ex.: 001)
- **Número atual** (o último número já usado)
- **Para venda de** (NF-e, NFC-e ou NFS-e)
- **Status** (Ativa ou Inativa)

## Adicionar uma série

Clique em **Adicionar série**, escolha o tipo (Produto - NF-e / Produto - NFC-e / Serviço),
informe a série (ex.: 001) e o número atual inicial. Deixe o número em **0** para uma série nova.
Use um número maior **apenas** se você está migrando de outro emissor e precisa continuar de onde
parou (ex.: 4520).

> Você não precisa cadastrar a série para emitir: se não existir, ela é criada automaticamente na
> primeira emissão. Esta tela serve para **controlar** e **migrar** a numeração.

## Ajustar o número atual

No menu da linha (⋯), escolha **Ajustar número**. O número **só pode ser aumentado** — a tela pede
confirmação e guarda o registro de quem alterou e quando.

Por que não dá para diminuir? Um número menor faria a empresa reemitir uma faixa de numeração que
já foi autorizada, o que a Receita rejeita e não tem conserto. Aumentar apenas "pula" números, o
que é regularizável.

## Desativar / reativar

- **Desativar**: bloqueia novas emissões naquela série (útil para aposentar uma série sem apagar o
  histórico). A tela avisa antes. Uma nota emitida numa série desativada é recusada com uma mensagem
  clara.
- **Reativar**: volta a permitir emissões.

## Excluir

Só é possível excluir uma série que **nunca foi usada** (número atual 0) — o caso típico é um erro
de digitação. Séries que já emitiram notas **não podem ser excluídas** (são histórico fiscal); nesse
caso, use **Desativar**.
