# Usuários e Permissões — guia de uso

Aqui você cadastra quem pode entrar no sistema (cada pessoa da sua equipe) e
decide o que cada uma pode ver e fazer — desde o dono do negócio, que vê tudo,
até o operador de caixa, que só precisa abrir o PDV e registrar vendas.

**Onde fica:** menu **Configurações → Usuários e Permissões**.

Os dados ficam salvos na empresa (não somem ao atualizar a página).

---

## Como funciona, em resumo

1. Você cria **perfis de acesso** — modelos de permissão com nome, como
   "Gerente" ou "Caixa". Cada perfil marca quais telas e ações ficam
   liberadas.
2. Você cadastra **usuários** — as pessoas da equipe — escolhe o perfil e,
   quando for o caso, as **unidades** em que a pessoa pode trabalhar.
3. No cadastro, o sistema gera uma **senha provisória**. Mostre essa senha
   para a pessoa; no primeiro login ela será pedida a troca.
4. Se o trabalho de alguém mudar, é só trocar o perfil dela na lista, sem
   precisar montar as permissões de novo.

---

## A lista de usuários

A tela abre com todas as pessoas cadastradas. Para cada uma você vê:

- **Usuário** — nome e e-mail.
- **Perfil de acesso** — um menu já na própria linha. Escolher outro perfil
  ali muda o acesso da pessoa imediatamente, sem abrir mais nada.

**Filtrar por perfil:** use o menu **Perfil acesso** no topo para ver só quem
usa um determinado perfil.

**Buscar:** o campo de busca filtra por nome ou e-mail.

**Abas Ativos / Excluídos:** usuários removidos vão para a aba Excluídos e
podem ser restaurados a qualquer momento pelo menu de três pontos (o acesso
é desativado, não apagado de vez).

**Ações (menu de três pontos):**

- **Editar** — abre o cadastro completo da pessoa.
- **Excluir** — desativa o acesso da pessoa ao sistema. Você não consegue
  excluir a própria conta enquanto estiver logado com ela.

---

## Cadastrar um novo usuário

Clique em **Novo usuário**, no topo direito.

### Geral

| Campo | O que preencher |
|---|---|
| Selecionar perfil | O perfil de acesso desta pessoa (ex.: Gerente, Caixa). Obrigatório. |
| Nome | Nome da pessoa. |
| E-mail | E-mail usado para entrar no sistema. |

### Unidades

Se o perfil **não** for o de administrador, escolha em quais unidades a
pessoa poderá operar. Perfis de administrador acessam todas automaticamente.

### Senha

Você **não** define a senha no cadastro. Ao salvar, aparece uma janela com a
**senha provisória** gerada pelo sistema — copie e envie para a pessoa. Essa
senha só é mostrada nessa hora; no primeiro login ela será trocada.

Ao terminar, clique em **Salvar**.

---

## Editar um usuário

Na edição, nome e e-mail ficam travados (não mudam depois do cadastro). Você
pode:

- Trocar o **perfil de acesso** e as **unidades**.
- **Resetar senha** — gera uma nova senha provisória (a anterior deixa de
  valer) e mostra na mesma janela de cópia.

---

## Perfis de Acesso

Clique em **Gerenciar perfis e permissões**, no topo da lista de usuários,
para abrir a tela de perfis.

A lista mostra o nome e a descrição de cada perfil. O perfil **Administrador**
tem a etiqueta **Sistema** — ele já vem com acesso total e não pode ser
editado nem excluído, para garantir que sempre exista alguém com acesso
completo à conta.

**Ações (menu de três pontos):** Editar e Excluir — bloqueadas para o perfil
Administrador. Se ainda houver usuários usando o perfil, a exclusão é
recusada (troque o perfil desses usuários primeiro).

### Criar ou editar um perfil

Clique em **Novo perfil**, ou em **Editar** num perfil existente.

**Informações gerais:** dê um nome e, se quiser, uma descrição contando para
que serve esse perfil.

**Permissões:** é aqui que você decide o que o perfil libera. As permissões
estão organizadas em duas abas:

- **Acessos ERP** — telas do painel administrativo (Vendas, Produtos,
  Estoque, Clientes, Finanças, Relatórios, Configurações, Dispositivos).
- **Acessos PDV** — ações dentro do ponto de venda (abrir/fechar caixa,
  registrar venda, aplicar desconto, cancelar venda, cadastros de PDV).

Cada aba mostra grupos por assunto (por exemplo, "Estoque"). Clique no nome
de um grupo para abri-lo e ver as permissões de cada cadastro dentro dele
(por exemplo, "Fornecedores": pode visualizar, criar, atualizar, excluir).

- Marque a caixinha de um grupo inteiro para liberar tudo daquele assunto de
  uma vez.
- Marque só as caixinhas específicas se quiser liberar apenas algumas ações.
- **Selecionar todos os acessos**, no topo, libera a aba inteira.
- Use a busca para encontrar uma permissão pelo nome, sem precisar abrir
  grupo por grupo.

O contador ao lado de cada grupo (ex.: "3/29") mostra quantas permissões
daquele grupo já estão marcadas.

Ao terminar, clique em **Salvar**.

---

## Sessões ativas

O botão **Sessões ativas** ainda mostra **Em breve** — o gerenciamento de
logins abertos da equipe entra numa próxima versão.

---

## O que ainda não existe nesta tela

- **Configurações de e-mail** do usuário (receber avisos financeiros,
  senha de mesa, PIN de suporte) — ficam para uma próxima etapa.
  **“Usuário vendedor”** (`isSeller`) já persiste no membro e alimenta as
  listas de vendedor no ERP (pedidos/OS) e no PDV (`GET /v1/pos/sellers`).
- **Desconto por perfil** (limite de desconto que cada perfil pode aplicar
  numa venda) é uma configuração de Vendas, não deste módulo — ainda não foi
  implementada.
- Perfis e permissões cadastrados aqui ainda não bloqueiam tudo de verdade
  em todas as telas — a aplicação fina das permissões continua evoluindo.
