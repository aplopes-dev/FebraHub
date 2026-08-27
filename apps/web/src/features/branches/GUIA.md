# Matrizes e Filiais — guia de uso

A estrutura segue a hierarquia **Grupo → Empresa matriz → Filial**:

- **Grupo** — quem contrata o sistema (cadastro em **Configurações → Dados da empresa**).
- **Empresa matriz** — pessoa jurídica com CNPJ próprio, regime tributário e logotipo.
- **Filial** — unidade operacional vinculada a uma matriz; também tem cadastro fiscal completo e logotipo.

**Onde fica:** menu **Configurações → Matrizes e Filiais** (`/settings/units`).

---

## A listagem

A tela usa **acordeões**: cada matriz é um painel expansível e as filiais aparecem dentro dele.

- Contador no topo: quantas matrizes e filiais existem.
- **Buscar** filtra matrizes e filiais por nome, código ou CNPJ (painéis com resultado abrem automaticamente).
- **Nova matriz** — botão secundário no topo, quando já existe ao menos uma matriz.
- **+** no cabeçalho de cada matriz — atalho para adicionar filial.
- Menu **⋯** — editar ou excluir matriz/filial.

---

## Cadastrar empresa matriz

1. Clique em **Adicionar primeira matriz** (estado vazio) ou **Nova matriz**.
2. Preencha o cadastro fiscal e o logotipo.
3. Salve.

Rota: `/settings/units/matrices/new`

---

## Cadastrar filial

1. No painel da matriz, use **+** ou **Adicionar filial**.
2. O formulário herda dados da matriz (documento, regime, contato).
3. Ajuste código, fantasia, endereço e CNPJ se necessário.
4. Salve.

Rota: `/settings/units/matrices/[matrixId]/stores/new`

---

## Editar

- Matriz: `/settings/units/matrices/[id]`
- Filial: `/settings/units/stores/[id]`

---

## Seletor de unidade no header

Lista apenas **filiais** ativas (unidades operacionais), não as matrizes.
