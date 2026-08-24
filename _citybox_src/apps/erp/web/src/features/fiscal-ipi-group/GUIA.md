# Grupos do IPI

> **A lista de grupos mudou de lugar (spec erp/022).** Cadastrar e editar continuam aqui; a lista agora fica em **Configurações → Fiscal → Grupos fiscais**, aba IPI, junto com os outros impostos — veja o guia da tela unificada em `features/fiscal-groups/GUIA.md`. Links antigos (ex.: `/grupos-icms`) continuam funcionando e te levam pra lá.

## O que é

Um **grupo do IPI** é uma regra de imposto que você cadastra uma vez e reaproveita
em vários produtos. Em vez de escolher a situação do IPI e o percentual a cada
nota, você monta o grupo aqui e aplica no produto — a nota fiscal já sai com o IPI
certo.

O IPI (Imposto sobre Produtos Industrializados) só incide sobre quem é indústria
ou equiparado a indústria. Se a sua loja é comércio comum, provavelmente você não
usa IPI — e nesse caso é só não vincular grupo nenhum ao produto: a nota continua
saindo normalmente, sem o bloco de IPI.

## Onde fica

Configurações → Fiscal → aba **Padrões fiscais** → botão **Gerenciar grupos de IPI**.
Você chega na lista "Grupos IPI".

## Como criar um grupo

1. Clique em **Novo Grupo IPI**.
2. Preencha:
   - **Nome** — um apelido para você reconhecer o grupo (ex.: "IPI 10% saída").
   - **Grupo tributário de IPI** — a situação da operação. Só aparecem as situações
     de **saída** (venda):
     - **50 - Saída tributada** e **99 - Outras saídas**: têm imposto → aparece o
       campo **Percentual**.
     - **51 a 55** (alíquota zero, isenta, não-tributada, imune, com suspensão): não
       têm valor → o campo Percentual **some**, porque não se aplica.
   - **Grupo de Enquadramento Legal do IPI** — o código legal que justifica a
     situação. Se não tiver um específico, use **999 - Tributação normal do IPI**.
   - **Percentual (%)** — só aparece quando a situação é tributada (50 ou 99). É a
     alíquota do IPI (ex.: 10).
3. Clique em **Salvar**.

Se você mudar algo e tentar sair sem salvar, o sistema avisa que há **alterações não
salvas**.

## Como usar no produto

Depois de criar o grupo, vincule-o ao produto na tela de **Parâmetros fiscais** do
produto (campo de grupo de IPI). A partir daí, toda nota daquele produto sai com o
IPI do grupo.

## O que aparece na lista

Cada grupo mostra o nome, a situação tributária, o enquadramento legal e o
percentual (ou "—" quando a situação não tem percentual).

## Importante

- Só situações de **saída** são oferecidas — a emissão atual cobre venda.
- Produto **sem** grupo de IPI continua saindo sem IPI na nota — nada muda para quem
  não é contribuinte de IPI.
