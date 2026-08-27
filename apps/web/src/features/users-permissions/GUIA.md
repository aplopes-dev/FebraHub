# Usuários e Permissões — guia de uso

Aqui você cadastra quem pode entrar no sistema (cada pessoa da sua equipe) e
decide o que cada uma pode ver e fazer — desde o administrador do grupo, que vê
tudo, até o consultor de vendas de uma filial específica.

**Onde fica:** menu **Configurações → Usuários e Permissões**.

Os dados ficam salvos na empresa (não somem ao atualizar a página).

---

## Como funciona, em resumo

O acesso de cada pessoa tem **dois eixos independentes**:

1. **Escopo geográfico** — *onde* a pessoa atua na hierarquia **Grupo → Matriz → Filial**
2. **Papel funcional + perfil** — *o que* a pessoa faz (vendedor, consultor de serviços, despachante…)

Fluxo típico:

1. Você cria **perfis de acesso** — modelos de permissão com nome, como
   "Gerente de vendas" ou "Consultor de serviços". Cada perfil marca quais
   módulos do DMS ficam liberados (Vendas, Oficina, Peças, Documentação…).
2. Você cadastra **usuários** — escolhe o **papel funcional**, o **perfil** e o
   **escopo** (grupo inteiro, uma matriz ou filiais específicas).
3. No cadastro, o sistema gera uma **senha provisória**. Mostre essa senha
   para a pessoa; no primeiro login ela será pedida a troca.
4. Se o trabalho de alguém mudar, é só trocar o perfil dela na lista, sem
   precisar montar as permissões de novo.

---

## Hierarquia e regras de escopo

| Nível | Significado | Quem enxerga |
|---|---|---|
| **Grupo** | Todo o grupo econômico | Todas as matrizes e filiais |
| **Matriz** | Uma empresa (CNPJ) | A matriz e suas filiais |
| **Filial** | Unidade operacional | Só as filiais selecionadas |

**Quem pode criar usuários:**

| Ator | Pode atribuir escopo |
|---|---|
| Admin do grupo | Grupo, qualquer matriz, qualquer filial |
| Gerente de matriz | Só sua matriz e filiais dela |
| Operador de filial | Só a própria filial |

---

## A lista de usuários

A tela abre com todas as pessoas cadastradas (filtradas pelo escopo do ator).
Para cada uma você vê:

- **Usuário** — nome e e-mail.
- **Escopo** — Grupo, Matriz ou Filial.
- **Papel** — função na empresa (ex.: Consultor de vendas).
- **Unidades** — resumo das filiais vinculadas.
- **Perfil de acesso** — menu na linha para trocar o perfil imediatamente.

**Filtros:** matriz, filial, papel funcional e busca por nome/e-mail.

**Abas Ativos / Excluídos:** usuários removidos vão para a aba Excluídos e
podem ser restaurados pelo menu de três pontos.

---

## Cadastrar um novo usuário

Clique em **Novo usuário**, no topo direito.

### Geral

| Campo | O que preencher |
|---|---|
| Nome | Nome da pessoa. |
| E-mail | E-mail usado para entrar no sistema. |
| Papel funcional | Função na empresa (vendedor, consultor de serviços, despachante…). |
| Perfil de acesso | Template de permissões — sugerido automaticamente ao escolher o papel. |

### Escopo de atuação

| Opção | Quando usar |
|---|---|
| Todo o grupo | Administradores e funções centralizadas (ex.: contador do grupo). |
| Empresa (matriz) | Gerentes e equipes que atuam em todas as filiais de uma empresa. |
| Unidade(s) — filial | Operadores de loja — selecione uma ou mais filiais da matriz. |

Opções indisponíveis ficam desabilitadas conforme o escopo de quem está
cadastrando.

### Senha

Ao salvar, aparece uma janela com a **senha provisória** gerada pelo sistema.

---

## Perfis de Acesso

Clique em **Gerenciar perfis e permissões** para abrir a tela de perfis.

O catálogo de permissões cobre os módulos do **DMS**: Vendas, CRM, Oficina,
Peças, Documentação, Pátio/PDI, Financeiro, Relatórios, Configurações e
Transversal (auditoria, arquivos, LGPD).

O perfil **Administrador** tem etiqueta **Sistema** — acesso total e não pode
ser editado nem excluído.

Perfis seed de demonstração: Gerente de vendas, Consultor de vendas, Consultor
de serviços, Avaliador, Despachante, Contador e Caixa.

---

## Sessões ativas

O botão **Sessões ativas** ainda mostra **Em breve**.

---

## O que ainda não existe nesta tela

- **Enforcement real** — perfis cadastrados ainda não bloqueiam todas as telas
  do app; a aplicação fina das permissões continua evoluindo.
- **Convites por e-mail** e fluxo de aceite.
- **Múltiplas memberships** — consultor em duas filiais com escopos distintos.
- **Alçada de desconto** por perfil (módulo de Vendas).
- **Configurações de e-mail** do usuário (avisos financeiros, PIN de suporte).
