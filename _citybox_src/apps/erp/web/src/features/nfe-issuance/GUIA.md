# Emitir NF-e

## O que é

Esta tela emite uma **NF-e** (nota fiscal eletrônica de venda) a partir de um
**pedido de venda já fechado** — o XML resultante usa os dados fiscais reais
cadastrados nos produtos (ICMS, PIS/COFINS, IPI), não valores digitados à mão.

## Onde fica

Menu **Vendas** → grupo **FISCAL** → **NF-e**.

## Antes de emitir (pré-requisitos)

- O **Emitente fiscal** precisa estar configurado (certificado digital em
  Configurações → Fiscal). Se não estiver, a tela avisa e leva você para lá.
- O **pedido de venda** precisa estar **fechado** e ter um **cliente
  identificado com CPF/CNPJ** — pedidos sem cliente cadastrado não podem
  gerar NF-e por esta tela.
- O **cliente do pedido precisa ter endereço completo cadastrado** (rua,
  número, bairro, cidade, UF e CEP), e a cidade precisa ser reconhecida pelo
  sistema. Sem isso, a nota fiscal é recusada pela Receita — a tela avisa e
  bloqueia a emissão antes de tentar, com um atalho para completar o
  cadastro em Clientes.
- O pedido **não pode já ter uma NF-e emitida** — a tela impede reemitir
  para o mesmo pedido.
- **A forma de pagamento do pedido precisa ter o código fiscal configurado**
  (Configurações → Formas de pagamento → "Código do método de pagamento na
  nota fiscal"). Se o pedido tiver um pagamento numa forma sem esse código
  configurado, a emissão é bloqueada com uma mensagem dizendo qual forma
  está sem código e onde configurar — em vez de sair uma nota com o meio de
  pagamento errado.

## Como emitir

1. Escolha o **Pedido de venda** na lista (mostra número, cliente e valor).
2. A tela mostra os **itens do pedido** com o valor de cada um.
3. Se algum item usar **valor de fallback** (o produto não tem um grupo
   fiscal de ICMS, PIS/COFINS ou IPI cadastrado), aparece um aviso
   destacando qual tributo está usando o valor padrão em vez do cadastro
   real. **Isso não impede a emissão** — é só um aviso para você revisar
   antes de confirmar.
4. Clique em **Emitir NF-e**. Uma confirmação aparece lembrando que a
   emissão é **irreversível dentro do prazo legal**, mostrando o ambiente
   real do Emitente.
5. Confirme. Se a nota for **autorizada**, uma mensagem verde de sucesso
   mostra o status e o protocolo. Se a nota for **recusada pelo órgão**,
   uma mensagem de aviso (não de sucesso) mostra o código e a explicação da
   recusa, em português.

## Ambiente

Um selo no topo da tela mostra o **ambiente real configurado no Emitente**
(Configurações → Fiscal → Configurações gerais → Ambiente de geração).

⚠️ **Hoje esta plataforma só emite de verdade em Homologação.** Se o
Emitente estiver configurado para Produção, a tela mostra um aviso e
**desabilita o botão Emitir**, com um atalho para ajustar o ambiente.

## Sobre a parametrização fiscal

Diferente de uma emissão manual, esta tela usa a cadeia de resolução fiscal
que já existe no cadastro do produto: **produto → grupo fiscal do produto →
padrão fiscal da organização → valor padrão**. Isso significa que, para um
produto sem grupo próprio, a nota ainda sai — usando o padrão da empresa, se
houver, ou o valor de fallback (com o aviso citado acima).

## Baixar XML e DANFE

Depois que a nota é **autorizada**, o XML e o DANFE (PDF) ficam disponíveis
para download nas telas de **Vendas** e **Pedidos de venda** (menu ⋯ da
linha do pedido) e também em **Finanças → Facilita NF-e**.

## Se der erro

O órgão fiscal pode recusar a emissão — é diferente de a nota não sair por
falha técnica. Quando o órgão avalia e recusa (por exemplo, cadastro
incompleto da empresa emissora), a tela mostra um aviso com o código e a
mensagem exata do órgão, em português — não uma confirmação de sucesso.
Para acompanhar o histórico completo de notas emitidas (autorizadas e
recusadas), veja **Finanças → Facilita NF-e**.

Se a emissão falhar antes mesmo de chegar ao órgão (problema técnico), a
tela mostra uma mensagem de erro diferente, pedindo para tentar de novo.
