# Grupos Fiscais — Guia de uso

## O que é

A tela **Grupos fiscais** fica em **Configurações → Fiscal → Grupos fiscais**
(também acessível pelos botões "Gerenciar grupos de X" da tela **Padrões
fiscais**). Reúne, num só lugar, os grupos dos quatro impostos que o sistema
organiza por grupo: **ICMS**, **IPI**, **PIS/COFINS** e **ISSQN**.

Um "grupo fiscal" é uma regra de tributação pronta (ex.: "ICMS 18%", "PIS/COFINS
isento") que você cria uma vez e depois aplica a vários produtos ou serviços, sem
precisar preencher a mesma regra campo por campo em cada um.

## Como usar

1. Abra **Configurações → Fiscal → Grupos fiscais**.
2. Escolha a **aba do imposto** (ICMS, IPI, PIS/COFINS ou ISSQN) que você quer
   ver ou gerenciar.
3. A lista mostra, por grupo: **nome**, **situação tributária** (o código do
   imposto que caracteriza a regra), **alíquota** (quando aquele imposto tiver
   uma alíquota única — o ICMS não mostra, porque a alíquota dele varia por
   estado, numa matriz própria) e **quantos produtos usam aquele grupo**.
4. Clique em **"Novo grupo [imposto]"** para cadastrar; clique no **nome** do
   grupo, ou em **Editar** no menu ⋯ da linha, para alterar um já existente.
5. Para excluir, use **Excluir** no menu ⋯. A exclusão é bloqueada quando o
   grupo está **em uso**:
   - vinculado a um ou mais produtos (o número na coluna "Produtos" é maior que
     zero) — desvincule os produtos primeiro;
   - definido como o **padrão fiscal** daquele imposto na tela Padrões fiscais —
     escolha outro padrão (ou "Nenhum padrão definido") primeiro.

   Em ambos os casos, a mensagem de erro explica qual dos dois motivos está
   bloqueando.

## De onde veio

Até esta atualização, cada imposto tinha sua própria tela de lista
(`/grupos-icms`, `/grupos-ipi`, `/grupos-pis-cofins`, `/grupos-issqn`). Os links
antigos continuam funcionando — eles agora só te redirecionam para a aba certa
desta tela única. Os formulários de cadastro/edição não mudaram.
