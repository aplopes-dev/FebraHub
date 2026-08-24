# Padrões Fiscais — Guia de uso

## O que é

A tela **Padrões fiscais** fica em **Configurações → Fiscal → Padrões fiscais**.
Aqui você define os valores fiscais **padrão da sua empresa**: qual grupo de cada
imposto e qual CFOP devem ser usados como referência.

Pense nela como o "valor de fábrica" dos impostos: os produtos que ainda **não têm
parâmetro fiscal próprio preenchido** passam a mostrar esse padrão como referência,
para você não precisar preencher tudo produto por produto.

## Para que serve

- Centralizar num só lugar o grupo fiscal padrão de **ICMS**, **IPI**,
  **PIS/COFINS** e **ISSQN**, além do **CFOP** padrão.
- Servir de referência (valor "herdado") na tela de **Parâmetros fiscais** de cada
  produto: quando um campo do produto está em branco, a tela mostra qual é o padrão
  da empresa para aquele imposto.

## Como usar

1. Abra **Configurações → Fiscal** e clique na aba **Padrões fiscais**.
2. A tela mostra um **cartão por imposto** (ICMS, IPI, PIS/COFINS, ISSQN), com
   quantos grupos você já cadastrou daquele imposto. Em cada cartão, escolha o
   **grupo padrão** na lista. Se ainda não houver nenhum grupo cadastrado, o
   cartão avisa "Nenhum padrão definido" e o campo de escolha some — use o botão
   **"Gerenciar grupos de X"** do próprio cartão para cadastrar o primeiro.
3. O botão **"Gerenciar grupos de X"** leva direto para a tela de Grupos fiscais
   já na aba daquele imposto — de lá você cadastra, edita e exclui grupos.
4. Depois dos 4 cartões de imposto, há mais dois cartões no mesmo estilo:
   **Informações adicionais** (mostra quantos textos você já cadastrou, somando
   NF-e/NFC-e/NFS-e) e **Naturezas de operação** (mostra quantas regras
   de-para você já cadastrou). Cada um tem seu botão de gerenciar.
5. Abaixo dos cartões, escolha o **CFOP padrão** na lista de CFOPs.
6. Clique em **Salvar**. Enquanto houver mudança não salva, a tela avisa "Há
   alterações não salvas".

## Grupos fiscais (ICMS, IPI, PIS/COFINS, ISSQN)

O cadastro dos grupos fiscais em si mudou de lugar: antes cada imposto tinha sua
própria tela de lista; agora há **uma única tela**, em
**Configurações → Fiscal → Padrões fiscais → "Gerenciar grupos de X"** (ou
diretamente pelo menu, em "Grupos fiscais"), com uma **aba por imposto**.

Em cada aba você vê, por grupo: **nome**, **situação tributária** (o código do
imposto), **alíquota** (quando o imposto tiver uma única alíquota — ICMS não tem,
porque varia por estado) e **quantos produtos usam aquele grupo**. No menu de
ações de cada linha:

- **Editar** abre o mesmo formulário de sempre daquele imposto.
- **Excluir** remove o grupo — mas só se ele **não estiver em uso**: nem
  vinculado a nenhum produto, nem escolhido como padrão fiscal (cartão acima).
  Se estiver em uso, a tela explica o motivo e não deixa excluir — desvincule os
  produtos ou troque o padrão primeiro.

Links salvos das telas antigas (`/grupos-icms`, `/grupos-ipi`, etc.) continuam
funcionando — eles só te levam automaticamente para a aba certa da tela nova.

## Onde o padrão aparece

Na tela **Produtos → Parâmetros fiscais**, ao abrir um produto: para cada imposto
que o produto **não tem preenchido**, aparece embaixo do campo a legenda
**"Herdado do padrão: …"** com o grupo/CFOP escolhido aqui. É apenas uma indicação
visual — para valer para aquele produto, preencha o campo do próprio produto.

## Limitação importante

Nesta entrega, o padrão é **exibição/referência**. A emissão da nota fiscal em si
ainda **não** usa automaticamente esses padrões — quem determina o imposto de cada
produto continua sendo o parâmetro fiscal do próprio produto. O consumo automático
na emissão é evolução futura.
