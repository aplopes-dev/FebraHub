# Naturezas de Operação — Guia

## O que é

É onde você ensina o sistema a **transformar automaticamente uma entrada em uma
saída**. O exemplo mais comum: você comprou uma mercadoria de um fornecedor e
agora precisa **devolver** — a Natureza de Operação diz qual nota de saída
(CFOP e impostos) o sistema deve montar a partir da nota de entrada original.

## Onde encontrar

Menu **Configurações → Fiscal → Padrões fiscais**, no link "Gerenciar
naturezas de operação →". Também acessível direto em
`/configuracoes/fiscal/naturezas-operacao`.

## Como cadastrar uma natureza de operação

1. Clique em **Nova natureza de operações**.
2. Preencha o **Nome** (ex.: "Devolução de Mercadoria para Fornecedor") e,
   se quiser, uma **Descrição** de até 300 caracteres.
3. O campo **Manter Código de Benefício Fiscal na UF** aparece desabilitado —
   esse recurso ainda não está disponível no sistema.
4. Na seção **De-para de CFOP**, clique em **Adicionar campo** para criar uma
   linha. Escolha o CFOP **De (entrada)**, o CFOP **Para (saída)** e a
   condição **ICMS Livre**:
   - **Ambos**: a regra vale tanto para itens com ICMS livre quanto para itens
     tributados.
   - **Só ICMS livre**: a regra só vale se o item não paga ICMS (isento,
     imune ou não tributado).
   - **Só ICMS tributado**: a regra só vale se o item paga ICMS normalmente.

   Você pode ter duas linhas com o mesmo CFOP de entrada — uma geral ("Ambos")
   e uma exceção ("Só ICMS livre", por exemplo) — desde que não sejam duas
   linhas idênticas.

5. Nas seções **De-para de Grupo de ICMS** e **De-para de Grupo de
   PIS/COFINS**, adicione linhas para dizer qual grupo fiscal de saída
   substitui o grupo de entrada do produto. Se um tributo não tiver grupos
   cadastrados ainda, cadastre-os primeiro (telas "Grupos de ICMS" e "Grupos
   de PIS/COFINS", também em Padrões fiscais).
6. Clique em **Salvar**.

## Como a regra é usada

Quando uma operação de entrada casa com um CFOP cadastrado, o sistema resolve
automaticamente o CFOP de saída e, se houver regra para o grupo de ICMS ou de
PIS/COFINS do item, também troca o grupo. Se **nenhuma** linha casar com a
entrada, o item mantém seus valores originais — a operação nunca é bloqueada
por falta de regra.

## Como excluir uma natureza de operação

1. Na listagem, clique no menu de ações (⋮) da linha da natureza que quer
   remover e escolha **Excluir**.
2. Confirme no diálogo — ele avisa que a exclusão pode afetar a resolução de
   emissões futuras que usariam essa natureza.
3. A natureza some da lista e a contagem em Padrões fiscais é atualizada.

Excluir não afeta notas já emitidas — só muda o que o sistema faz da próxima
vez que tentar resolver uma entrada que casaria com essa natureza.

## O que ainda não faz parte desta tela

- A **aplicação automática** da regra dentro de uma emissão de nota de entrada
  ou devolução ainda não existe no sistema — esta tela cadastra e testa a
  regra, mas o disparo automático fica para uma etapa futura.
- O campo de benefício fiscal por UF (cBenef) ainda não tem cadastro.
