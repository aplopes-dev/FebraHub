# Guia — Pontos de venda (Cadastros)

## O que é

Cada **ponto de venda (PDV)** é um terminal da loja — caixa do balcão,
self-checkout, tablet do salão, etc. Nesta tela você vê os PDVs cadastrados,
quais equipamentos (impressora e balança) estão ligados a cada um e se estão
ativos ou inativos.

## Para que serve

- **Encontrar rapidamente** um PDV pelo nome.
- **Conferir** impressora e balança vinculadas.
- **Editar** um cadastro já existente.
- **Ativar** ou **inativar** um PDV.
- **Excluir** um cadastro que não faz mais sentido na lista.
- **Gerar o código de pareamento** que ativa o aplicativo do PDV.

## Como usar

### A tela de lista

Ao abrir **Cadastros** no menu Pontos de venda, você vê a lista com:

- **Nome** do PDV
- **Impressora** vinculada (ou traço se não houver)
- **Balança** vinculada (ou traço se não houver)
- **Status** — Ativo ou Inativo

No topo há a **busca por nome** e o botão **Novo PDV**, que abre um formulário
para cadastrar o terminal.

### Novo PDV

No formulário informe:

- **Nome** do ponto de venda
- **Status** (Ativo ou Inativo)
- **NFC-e em contingência** (Habilitado ou Desabilitado)
- **Ponto de impressão** (ou Nenhum)
- **Balança** (ou Nenhuma)
- **Aplicativo offline** — escolha o **servidor** que o PDV usará offline

Ao **Salvar**, o PDV entra na lista. **Cancelar** fecha sem gravar. O terminal
é cadastrado na **unidade ativa** escolhida no topo da tela — se a empresa
tiver mais de uma unidade, selecione a unidade certa antes de cadastrar.

### Editar

Abra pelo menu ⋯ da linha. O mesmo formulário do cadastro abre já preenchido;
altere o que precisar e clique em **Salvar**.

### Gerar código de pareamento

É o código que o aplicativo do PDV pede na tela de ativação, para "conversar"
com esta loja pela primeira vez. Pelo menu ⋯, escolha **Gerar código de
pareamento** — aparece um código de 8 caracteres, válido por **15 minutos**.
Copie e informe no aplicativo do PDV antes que expire; gerar de novo invalida
o código anterior.

### Ações do menu ⋯

Em cada linha:

- **Editar** — abre o formulário preenchido para alterar o cadastro.
- **Gerar código de pareamento** — mostra o código de ativação do PDV.
- **Marcar como inativo/ativo** — alterna o status do terminal.
- **Excluir** — pede confirmação e remove o PDV da listagem.

### Dicas

- Use a busca se a loja tiver muitos terminais.
- Prefira **inativar** quando o equipamento pode voltar a ser usado; use
  **Excluir** só quando o cadastro não for mais necessário.
- O código de pareamento expira rápido — só gere quando for ativar o
  aplicativo na hora.
