# Grupos de ICMS — Guia de uso

> **A lista de grupos mudou de lugar (spec erp/022).** Cadastrar e editar continuam aqui; a lista agora fica em **Configurações → Fiscal → Grupos fiscais**, aba ICMS, junto com os outros impostos — veja o guia da tela unificada em `features/fiscal-groups/GUIA.md`. Links antigos (ex.: `/grupos-icms`) continuam funcionando e te levam pra lá.

## O que é

Um **Grupo de ICMS** é uma regra de tributação reutilizável. Em vez de configurar
o ICMS produto por produto, você cria um grupo (ex.: "ICMS 18%") e aplica esse
grupo aos produtos.

Fica em **Configurações → Fiscal → Padrões fiscais → "Gerenciar grupos de ICMS"**.

## Para que serve

Esta é a peça que faz a nota fiscal sair com o **ICMS calculado** de verdade
(antes, a nota de Regime Normal saía com ICMS zerado). O grupo define:

- a **situação tributária** do ICMS (a "situação"): no Regime Normal é o CST;
  no Simples Nacional é o CSOSN;
- as **alíquotas por estado (UF)** — uma para vendas **dentro** do seu estado
  (interna) e outra para vendas para **outros estados** (interestadual).

## Como usar

1. Abra **Configurações → Fiscal → Padrões fiscais** e clique em **Gerenciar
   grupos de ICMS**.
2. Clique em **Novo grupo ICMS**.
3. Dê um **nome** ao grupo.
4. Escolha a **Situação do ICMS**. As opções mudam conforme o regime da sua
   empresa (Regime Normal mostra CST; Simples mostra CSOSN). As situações que o
   sistema ainda não sabe emitir aparecem **desabilitadas, com o motivo**.
5. Preencha as duas matrizes de alíquota (**ICMS interno** e **ICMS
   interestadual**). Em cada uma você escolhe:
   - **Valor único**: um número aplicado a todos os 27 estados;
   - **Valores personalizados**: um número por estado.
   A matriz interna já vem preenchida com as alíquotas vigentes de cada estado;
   a interestadual começa em 0.
6. Clique em **Salvar**.

## Limite do Simples Nacional

Se a sua empresa é do **Simples Nacional**, a nota sai com CSOSN, que **não
carrega alíquota de ICMS** — então as matrizes por estado **não têm efeito** na
nota. Para o Simples, o grupo serve apenas para fixar o CSOSN. A tela avisa isso.

## Aba "Produtos"

Depois de salvar, a aba **Produtos** mostra (somente leitura) quais produtos usam
esse grupo. O vínculo é feito na tela de **Parâmetros fiscais** de cada produto.

## O que acontece na nota

- **Produto com grupo** (Regime Normal) → a nota sai com a base, a alíquota do
  estado de destino e o valor do ICMS calculados.
- **Produto sem grupo** → usa o padrão da organização (Padrões fiscais), se
  definido; sem padrão, a nota continua saindo com ICMS zerado (ninguém deixa de
  emitir por não ter configurado).
- **Simples Nacional** → a nota declara o CSOSN, sem alíquota (o ICMS é recolhido
  no DAS).
