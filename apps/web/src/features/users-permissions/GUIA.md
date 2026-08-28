# Usuários e Permissões — guia de uso

Aqui você cadastra quem pode entrar no sistema (cada pessoa da sua equipe) e
decide o que cada uma pode ver e fazer — desde o administrador, que vê tudo,
até o consultor comercial, que trabalha só sobre os dados do setor dele.

**Onde fica:** menu **Configurações → Usuários e Permissões**.

Os dados ficam salvos na empresa (não somem ao atualizar a página).

---

## Como funciona, em resumo

O acesso de cada pessoa tem **dois eixos independentes**:

1. **Perfil de acesso** — *o QUE* a pessoa pode fazer: as telas e as ações
2. **Setor** — *sobre QUAIS DADOS* ela faz: comercial, financeiro, pedagógico…

Os dois aparecem lado a lado no cadastro de propósito. Um gestor do financeiro
e um gestor do comercial têm o **mesmo** perfil de acesso e enxergam números
diferentes — é o setor que separa.

Fluxo típico:

1. Você cria **perfis de acesso** — modelos de permissão com nome, como
   "Consultor comercial" ou "Coordenação acadêmica". Cada perfil marca quais
   módulos ficam liberados (Comercial, CRM, Acadêmico, Eventos, Mentoria…).
2. Você cadastra **usuários** — escolhe o **papel funcional**, o **perfil**, o
   **papel na plataforma** e os **setores** da pessoa.
3. No cadastro, o sistema gera uma **senha provisória**. Mostre essa senha
   para a pessoa; no primeiro login ela será pedida a troca.
4. Se o trabalho de alguém mudar, é só trocar o perfil dela na lista, sem
   precisar montar as permissões de novo.

---

## Papel na plataforma

O peso da conta, independente do que a pessoa faz no dia a dia:

| Papel | O que muda |
|---|---|
| **Administrador** | Atravessa o catálogo inteiro: vê e faz tudo, em todo setor. |
| **Gestor** | Responde pelo próprio setor — define metas e indicadores dele. |
| **Membro** | Faz o que o perfil de acesso liberar, dentro dos setores dele. |

**Proprietário** é o dono da conta. Ele aparece no campo quando você edita a
própria conta dele, mas não pode ser atribuído nem removido por aqui.

## Setores

| Setor | Cobre |
|---|---|
| **Geral (diretoria)** | Direção e áreas transversais, sem recorte de setor. |
| **Comercial** | Matrículas, funil de vendas e metas da equipe. |
| **Financeiro** | Recebimentos, inadimplência e conciliação. |
| **Marketing** | Campanhas, origem de leads e conteúdo. |
| **Pedagógico** | Turmas, presença e jornada do aluno. |
| **Eventos** | Imersões e eventos: ingressos e credenciamento. |
| **Loja** | Balcão, pedidos e fechamento do caixa. |
| **Estoque e suprimentos** | Saldos, movimentações e compras. |
| **CRM** | Clientes, negócios e tarefas do relacionamento. |

Cada pessoa tem **um setor principal** e, opcionalmente, **setores
adicionais** — para quem atua em mais de uma área. O principal nunca se repete
na lista de adicionais.

---

## A lista de usuários

A tela abre com todas as pessoas cadastradas. Para cada uma você vê:

- **Usuário** — nome e e-mail.
- **Papel** — função na escola (ex.: Consultor comercial). Abaixo dela aparece
  o papel na plataforma quando ele não é o comum (Administrador, Gestor,
  Proprietário).
- **Setor** — o setor principal, com os adicionais resumidos abaixo.
- **Perfil de acesso** — menu na linha para trocar o perfil imediatamente.

**Filtros:** papel funcional e busca por nome/e-mail.

**Abas Ativos / Excluídos:** usuários removidos vão para a aba Excluídos e
podem ser restaurados pelo menu de três pontos.

---

## Cadastrar um novo usuário

Clique em **Novo usuário**, no topo direito. O cadastro abre num drawer
lateral, sobre a listagem — não há página de criação.

### Geral

| Campo | O que preencher |
|---|---|
| Nome | Nome da pessoa. |
| E-mail | E-mail usado para entrar no sistema. |
| Papel funcional | Função na escola (consultor comercial, facilitador, secretaria…). |
| Perfil de acesso | Template de permissões — sugerido automaticamente ao escolher o papel. |
| Papel na plataforma | Administrador, Gestor ou Membro — também sugerido pelo papel funcional. |
| Setor principal | Sobre quais dados a pessoa trabalha. Sugerido pelo papel funcional. |
| Setores adicionais | Opcional — para quem atua em mais de uma área. |

Escolher o **papel funcional** refaz as três sugestões (perfil, papel na
plataforma e setor principal). Todas continuam editáveis: a sugestão é atalho,
não regra.

### Senha

Ao salvar, aparece uma janela com a **senha provisória** gerada pelo sistema.

---

## Perfis de Acesso

Clique em **Gerenciar perfis e permissões** para abrir a tela de perfis.

O catálogo de permissões cobre os módulos do sistema: Comercial, CRM,
Acadêmico, Eventos e imersões, Mentoria e consultoria, Conteúdo e EAD,
Secretaria, Financeiro, Relatórios, Configurações e Transversal (auditoria,
arquivos, LGPD).

O perfil **Administrador** tem etiqueta **Sistema** — acesso total e não pode
ser editado nem excluído.

Perfis seed de demonstração: Gerente de unidade, Consultor comercial, SDR /
pré-vendas, Sucesso do aluno, Coordenação acadêmica, Facilitador, Produção de
eventos, Secretaria acadêmica, Financeiro, Marketing, Contador e Somente
leitura.

Cada um recorta o catálogo pelo trabalho de quem o usa: o facilitador vê a
turma e registra presença, mas não edita o programa; o consultor comercial
aplica desconto dentro da alçada e só o gerente aprova acima dela; o contador
lê o financeiro sem enxergar receita e custo por turma.

---

## Sessões ativas

O botão **Sessões ativas** ainda mostra **Em breve**.

---

## O que ainda não existe nesta tela

- **Enforcement real** — perfis cadastrados ainda não bloqueiam todas as telas
  do app; a aplicação fina das permissões continua evoluindo.
- **Convites por e-mail** e fluxo de aceite.
- **Filtro por setor** na listagem — hoje o setor aparece na coluna, mas não
  recorta a lista.
- **Alçada de desconto** por perfil (módulo Comercial).
- **Configurações de e-mail** do usuário (avisos financeiros, PIN de suporte).
