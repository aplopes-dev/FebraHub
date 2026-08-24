# Grupos de PIS/COFINS — Guia de uso

> **A lista de grupos mudou de lugar (spec erp/022).** Cadastrar e editar continuam aqui; a lista agora fica em **Configurações → Fiscal → Grupos fiscais**, aba PIS/COFINS, junto com os outros impostos — veja o guia da tela unificada em `features/fiscal-groups/GUIA.md`. Links antigos (ex.: `/grupos-icms`) continuam funcionando e te levam pra lá.

## O que é

Um **Grupo de PIS/COFINS** é uma regra de tributação reutilizável. Em vez de
configurar PIS e COFINS produto por produto, você cria um grupo (ex.: "Lucro Real
padrão", "Monofásico") e aplica esse grupo aos produtos.

Fica em **Configurações → Fiscal → Padrões fiscais → "Gerenciar grupos de
PIS/COFINS"**.

## Para que serve

PIS e COFINS são obrigatórios em **toda** nota fiscal. Este cadastro é o que faz a
nota sair com os **valores calculados** de PIS/COFINS (antes saíam zerados na nota
de Regime Normal). O grupo define, para PIS e para COFINS:

- a **situação tributária** (CST) — se é tributado, monofásico, isento, etc.;
- a **alíquota (%)** — só quando a situação é tributada.

## Como usar

1. Abra **Configurações → Fiscal → Padrões fiscais** e clique em **Gerenciar
   grupos de PIS/COFINS**.
2. Clique em **Novo Grupo PIS/COFINS**.
3. Dê um **nome** ao grupo.
4. Escolha a **Situação do PIS**. Ao escolher, a **Situação do COFINS** é
   preenchida igual automaticamente (você pode mudar depois).
5. Se a situação for tributada, a **Alíquota** aparece já preenchida conforme o
   regime da sua empresa (Lucro Presumido: PIS 0,65% / COFINS 3,00%; Lucro Real:
   PIS 1,65% / COFINS 7,60%). Você pode ajustar.
6. Se a situação **não** for tributada (monofásica, isenta, etc.), o campo de
   alíquota não aparece — é o comportamento correto.
7. Clique em **Salvar**.

> Situações que ainda não são suportadas (como "por unidade de medida" ou
> "outras operações 49") aparecem na lista **desabilitadas, com o motivo**.

## Aba "Produtos"

Depois de salvar, a aba **Produtos** mostra (somente leitura) quais produtos usam
esse grupo. O vínculo em si é feito na tela de **Parâmetros fiscais** de cada
produto.

## O que acontece na nota

- **Produto com grupo** → a nota usa a regra do grupo (CST e alíquota).
- **Produto sem grupo** → usa o **padrão da organização** (Padrões fiscais), se
  definido.
- **Sem grupo e sem padrão** → a nota continua saindo (CST 01, valores zerados) —
  ninguém deixa de emitir por não ter configurado.
- **Empresas do Simples Nacional**: PIS/COFINS saem no DAS; a nota apenas declara
  (CST 49). Para o Simples, o grupo **não** muda a nota.
