# Emitir NFS-e

## O que é

Esta tela emite uma **NFS-e** (nota fiscal de serviço) diretamente pelo ERP. É a
primeira tela do sistema que fala com o serviço fiscal para **transmitir** uma
nota de serviço ao órgão (Padrão Nacional).

## Onde fica

Menu **Vendas** → grupo **FISCAL** → **NFS-e**.

## Antes de emitir (pré-requisitos)

- O **Emitente fiscal** precisa estar configurado (certificado digital em
  Configurações → Fiscal). Se não estiver, a tela avisa e leva você para lá.
- O **cliente (tomador)** precisa ter **CPF ou CNPJ** cadastrado. Se faltar, a
  tela avisa.
- Você precisa de um **Grupo de ISSQN** cadastrado (Configurações → Fiscal →
  Padrões fiscais → Grupos de ISSQN). Se não houver nenhum ainda, a tela mostra
  um aviso com um botão para cadastrar o primeiro, no lugar da lista de grupos.

## Como emitir

1. Escolha o **Tomador** (cliente) na lista.
2. Escolha o **Grupo de ISSQN**. A tela mostra automaticamente o código
   municipal, o cTribNac, a exigibilidade e a alíquota que virão do grupo.
3. Escreva a **Descrição do serviço**.
4. Informe o **Valor do serviço**.
5. Marque **"Há retenção de ISS"** se for o caso. ⚠️ A alíquota do grupo **só é
   enviada para a nota quando há retenção** — sem retenção, quem define a
   alíquota é a prefeitura.
6. Clique em **Emitir NFS-e**. Uma confirmação aparece lembrando que a emissão é
   **irreversível dentro do prazo legal**, mostrando o ambiente real do Emitente
   (ver seção Ambiente abaixo).
7. Confirme. Se a nota for **autorizada**, uma mensagem verde de sucesso mostra
   o status e o protocolo. Se a nota for **recusada pelo órgão**, uma mensagem
   de aviso (não de sucesso) mostra o código e a explicação da recusa, em
   português.

## Ambiente

Um selo no topo da tela mostra o **ambiente real configurado no Emitente**
(Configurações → Fiscal → Configurações gerais → Ambiente de geração) —
**Homologação** ou **Produção**.

⚠️ **Hoje esta plataforma só emite de verdade em Homologação.** Se o Emitente
estiver configurado para Produção, a tela mostra um aviso e **desabilita o
botão Emitir**, com um atalho "Ajustar ambiente" que leva direto para a
Configuração geral do Emitente — assim você descobre o problema antes de
tentar emitir, não depois de um erro.

## Se der erro

O órgão fiscal pode recusar a emissão — é diferente de a nota não sair por
falha técnica. Quando o órgão avalia e recusa, a tela mostra um aviso com o
código e a mensagem exata do órgão, em português — não uma confirmação de
sucesso. Os casos mais comuns:

- **Inscrição Municipal não registrada no CNC** — a IM da empresa precisa estar
  registrada junto à prefeitura (não se resolve trocando o certificado).
- **Código nacional (cTribNac) ausente ou inválido** — revise o Grupo de ISSQN.
- **Alíquota sem retenção** — a alíquota só vai à nota com retenção marcada.

Para acompanhar o histórico completo de notas emitidas (autorizadas e
recusadas), veja **Finanças → Facilita NF-e**.

Se a emissão falhar antes mesmo de chegar ao órgão (problema técnico), a tela
mostra uma mensagem de erro diferente, pedindo para tentar de novo.
