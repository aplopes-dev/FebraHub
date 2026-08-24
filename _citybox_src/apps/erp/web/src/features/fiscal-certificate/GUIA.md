# Guia — Certificado Digital (tela Fiscal)

Este guia explica, em linguagem simples, como usar a tela **Fiscal** para cadastrar
e acompanhar o **certificado digital** da sua empresa.

## O que é

O certificado digital A1 é o "documento eletrônico" que assina as suas notas fiscais.
Sem ele, a empresa não consegue emitir notas. É um arquivo que termina em **.pfx** ou
**.p12**, protegido por uma **senha**, que você recebe da entidade certificadora.

## Onde fica

No menu, vá em **Configurações → Fiscal**.

## Enviar o primeiro certificado

1. Na tela Fiscal, clique em **Inserir certificado**.
2. Arraste o arquivo `.pfx`/`.p12` para a área indicada (ou clique para escolher no
   computador).
3. Digite a **senha** do certificado.
4. Se quiser, dê um **apelido** para identificá-lo (opcional).
5. Clique em **Enviar certificado**.

Pronto: assim que o envio termina, o certificado aparece na tela como **vigente**, sem
precisar recarregar a página. Na primeira vez, a empresa é preparada automaticamente para
a parte fiscal — você não precisa preencher nenhum cadastro à parte.

## Acompanhar o certificado

- O **certificado vigente** aparece em destaque, com o CNPJ do titular, a validade (de/até)
  e quantos dias faltam para vencer.
- Quando falta **pouco para vencer** (30 dias ou menos), aparece um aviso **"vence em breve"**.
- Se já passou da validade, aparece **"vencido"**.
- Os certificados antigos ficam em uma **lista de histórico**, apenas para consulta.

## Trocar / renovar o certificado

Quando o certificado estiver perto de vencer (ou já vencido), clique em **Enviar novo
certificado** e repita o envio. O novo passa a valer automaticamente, e o anterior vai para
o histórico. Não é preciso "ativar" nada: vale sempre o certificado válido mais recente.

## Mensagens que podem aparecer

A tela avisa de forma clara quando algo impede o envio, por exemplo:

- **Arquivo ou senha faltando** — selecione o arquivo e informe a senha.
- **Arquivo no formato errado, vazio ou grande demais** — envie um `.pfx`/`.p12` de até 10 MB.
- **Senha incorreta ou certificado inválido/vencido** — confira a senha e a validade.
- **CNPJ diferente** — o CNPJ do certificado não é o mesmo da empresa; compare os dois documentos.
- **Faltam dados da empresa** — a tela diz qual informação completar (por exemplo, o
  endereço da filial matriz) e onde.
- **Loja não habilitada** — a loja ainda não está pronta para a parte fiscal; fale com o suporte.

## Observações

- A **senha** do certificado é usada só para o envio e **não** fica guardada em lugar nenhum.
- Nesta versão, o envio é feito para o **ambiente de homologação** (testes).
