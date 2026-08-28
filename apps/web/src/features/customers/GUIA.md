# Guia — Clientes

## O que é

Clientes é o cadastro das pessoas e empresas que compram (ou podem comprar) na
sua loja. Cada contato passa por um estágio — da primeira conversa até se tornar
cliente que compra de forma recorrente.

## Para que serve

A lista de clientes ajuda você a:

- Acompanhar quem ainda é só um contato inicial (**Lead**).
- Ver quem está perto de fechar a primeira compra (**Oportunidade**).
- Gerenciar quem já compra com frequência (**Cliente ativo**).
- Identificar quem parou de comprar (**Inativo**).
- Buscar rapidamente por nome, e-mail ou telefone.
- Ver o total de vendas e a data em que o cadastro foi criado.
- Cadastrar novos contatos com dados pessoais e endereços.

Esses estágios preparam o caminho para um funil de vendas (CRM) mais completo no
futuro.

## Como usar

### A tela de lista

Ao abrir Clientes, você vê a lista organizada por estágio. Nela você pode:

- Usar as abas: **Todos** (lista completa), **Lead**, **Oportunidade**,
  **Cliente ativo** ou **Inativo**. Cada aba mostra quantos cadastros existem
  naquele estágio.
- **Buscar** por nome, e-mail ou telefone.
- **Selecionar** um ou mais clientes na página atual (útil para ações em lote
  quando estiverem disponíveis).
- Clicar em **Novo cliente** para abrir o cadastro.

### O que significa cada estágio

| Estágio | Significado |
| ------- | ----------- |
| **Lead** | Contato novo, ainda sem compra ou negociação avançada. |
| **Oportunidade** | Há interesse concreto; a venda está em andamento. |
| **Cliente ativo** | Já comprou e mantém relacionamento comercial. |
| **Inativo** | Cadastro existente, mas sem compras recentes. |

### Colunas da lista

- **Nome** — como o cliente aparece no sistema.
- **E-mail** e **Telefone** — dados de contato.
- **Vendas** — total já faturado com aquele cliente.
- **Data da criação** — quando o cadastro entrou no sistema.

### Cadastrar um novo cliente

Ao clicar em **Novo cliente**, você preenche:

1. **Dados pessoais** — nome, **categoria** (com busca e opção de criar
   nova categoria na hora), tipo (pessoa física ou jurídica), documento
   (CPF/CNPJ), RG e data de nascimento (quando for pessoa física), e-mail,
   celular e telefone. Dá para incluir telefones extras. Também escolhe em
   quais unidades o cliente aparece e pode deixar observações.
2. **Endereços** — um ou mais endereços (CEP, rua, número, bairro, cidade,
   estado e complemento). Cada endereço pode ser marcado como **Principal**,
   **Entrega** ou **Outro**. Só pode haver um endereço principal.

Enquanto você edita, o sistema avisa que há **alterações não salvas**. Ao
terminar, clique em **Salvar**. Use **Descartar alterações** se quiser voltar
como estava. Novos cadastros entram como **Lead**.

## Papéis e jornada (Febracis)

A ficha é **uma só** para lead, participante de evento, aluno, ex-aluno e
indicador — os papéis acumulam e aparecem na coluna **Papéis**. As abas usam o
vocabulário da unidade: Leads, Em negociação, Alunos, Ex-alunos.

Clicar numa linha abre a **jornada**: o que a pessoa já comprou (a escada de
valor), os eventos em que esteve e quem ela indicou. É onde a recompra — que é
o motor do negócio — fica visível.

Os dados vêm de `src/lib/mock/mock-customers.ts`, que serve `/v1/customers` a
partir do `src/lib/mock-db`. A tela não sabe disso: continua falando `apiFetch`.

## Em resumo

Use as abas para acompanhar o estágio de cada contato, a busca para achar alguém
rápido e o botão **Novo cliente** para registrar dados pessoais e endereços.
