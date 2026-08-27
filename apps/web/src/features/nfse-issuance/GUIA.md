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
  Padrões fiscais → Grupos de ISSQN).

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
   **irreversível dentro do prazo legal** e que o ambiente é **HOMOLOGAÇÃO**.
7. Confirme. Se a nota for autorizada, uma mensagem mostra o status e o protocolo.

## Ambiente

A tela opera em **HOMOLOGAÇÃO** (ambiente de testes). Um selo no topo deixa isso
claro. A produção não está habilitada nesta entrega.

## Se der erro

O órgão fiscal pode recusar a emissão. A tela mostra a mensagem em linguagem de
negócio, não o código cru. Os casos mais comuns:

- **Inscrição Municipal não registrada no CNC** — a IM da empresa precisa estar
  registrada junto à prefeitura (não se resolve trocando o certificado).
- **Código nacional (cTribNac) ausente ou inválido** — revise o Grupo de ISSQN.
- **Alíquota sem retenção** — a alíquota só vai à nota com retenção marcada.
