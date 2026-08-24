# Guia — Configurações Gerais Fiscais (aba Configurações gerais)

Explica, em linguagem simples, a aba **Configurações gerais** da tela Fiscal.

## Onde fica

**Configurações → Fiscal → aba Configurações gerais**.

## O que dá para configurar hoje

- **Regime tributário**: escolha o regime da empresa (o código CRT aparece em cada opção).
- **Ambiente de geração**: **Homologação** (testes) ou **Produção** (valendo de verdade).
- **Inscrição Estadual** e **Inscrição Municipal**.
- **Autorizado a acessar XML**: o CPF/CNPJ do contador/escritório (a Bahia recusa a nota sem ele).
- **NFS-e nacional**: ligue para poder emitir NFS-e.
- **Justificativas padrão** (novo): dois textos de referência — um para quando você **inutilizar**
  uma numeração não usada, outro para quando **cancelar** um documento fiscal. Cada um precisa ter
  entre 15 e 255 caracteres (é uma exigência da Receita) — abaixo do mínimo, o campo fica marcado
  em vermelho e o Salvar não funciona até corrigir. Deixar em branco também é válido: significa
  "ainda não defini um texto padrão".

Clique em **Salvar** para gravar tudo isso de uma vez.

> Ao mudar de **Homologação** para **Produção**, o sistema pede uma confirmação — a partir daí as
> notas valem de verdade.

> ⚠️ As justificativas padrão ficam salvas, mas hoje ainda não há uma tela para inutilizar ou
> cancelar notas dentro deste sistema — isso é feito por outros meios. Quando essa tela existir
> aqui, ela vai sugerir automaticamente o texto que você cadastrou.

## Autenticação e QR Code (CSC)

O **CSC** é um código de segurança usado no QR Code da NFC-e. Por segurança, o sistema **nunca
mostra** o código já salvo — apenas informa se está **configurado** ou **não configurado**. Para
cadastrar ou trocar, clique em **Configurar/Substituir CSC**, informe o **ID** (como aparece no
portal da SEFAZ) e o **token**, e salve. Esse bloco tem um botão próprio.

Quando já existe um CSC salvo, aparece também o botão **Remover CSC** — use se cadastrou um código
errado, de teste, ou de homologação por engano. Depois de confirmar, o Emitente volta a "não
configurado". Se o PDV da sua loja estiver configurado para emitir **NFC-e (Modelo 65)**, a
remoção é **bloqueada** — troque o modelo do PDV em Configurações do PDV antes de remover o CSC,
senão o caixa fica sem conseguir emitir a próxima venda.

## Campos "em breve"

Vários campos aparecem na tela mas estão **desabilitados**, marcados como **"em breve"**. Eles fazem
parte do que ainda será liberado e por enquanto não podem ser editados.

## Avisos

- Se você mexeu em algo e tenta sair da aba sem salvar, o sistema avisa.
- É preciso ter o certificado digital configurado (aba Certificado) para o emitente existir.
