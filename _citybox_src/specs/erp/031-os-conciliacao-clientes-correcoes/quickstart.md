# Quickstart: Correções OS, Conciliação e Clientes

**Feature**: [spec.md](./spec.md) | **Contracts**: [contracts/](./contracts/)

## Pré-requisitos

```bash
pnpm infra:up
pnpm db:migrate:platform:dev   # após a migração de sale_order_lines (D1) existir
pnpm dev:varejo                # admin-api + erp-web + erp-api (comercio)
```

Login no ERP web (`erp-web`, :3107) com um usuário com acesso ao vertical
`comercio` (role `vertical.comercio.view`), organização/loja de teste.

## Cenário 1 — Gerar venda de OS com linha de serviço (US1)

1. `Vendas → Ordens de serviço → Nova OS`.
2. Adicionar equipamento e **uma linha de serviço** (sem vincular produto do
   catálogo), com quantidade e valor preenchidos. Salvar a OS.
3. Abrir a OS salva → **Gerar venda**.
4. **Esperado**: venda criada com sucesso (sem o erro
   "A OS precisa de ao menos uma linha..."); `generatedSaleId` gravado na OS;
   a linha de serviço aparece na venda gerada com sua descrição e valor.
5. Repetir com uma OS mista (1 linha de produto + 1 de serviço) → ambas devem
   entrar na venda.
6. Repetir clicando "Gerar venda" de novo na mesma OS → deve devolver a
   mesma venda, sem duplicar (idempotência preservada).
7. OS sem nenhuma linha → "Gerar venda" deve ser bloqueado no cliente, com
   mensagem clara, sem round-trip ao servidor.

## Cenário 2 — Cliente/fornecedor por lista na Conciliação bancária (US2)

1. `Finanças → Conciliação bancária` → abrir um extrato com transações
   pendentes.
2. Numa transação pendente, clicar **Novo Registro**.
3. No campo "Cliente ou fornecedor", digitar parte do nome de um cliente (ou
   fornecedor) já cadastrado.
4. **Esperado**: sugestões aparecem com rótulo indicando o tipo (cliente vs
   fornecedor); ao selecionar e salvar, o lançamento fica vinculado ao
   cadastro (visível depois em `Finanças → Lançamentos financeiros`, filtro
   por cliente/fornecedor).
5. Repetir deixando o campo vazio → deve salvar normalmente, sem vínculo.
6. Verificar mensagem "Nenhum cliente ou fornecedor encontrado" quando não
   há resultado para o termo digitado.

## Cenário 3 — Editar cliente (US3)

1. `Clientes` → listagem.
2. **Esperado**: cada linha tem uma ação visível de "Editar" (não só o clique
   implícito na linha).
3. Acionar a edição de um cliente existente → formulário abre pré-preenchido.
4. Alterar um campo (ex.: telefone) e salvar → volta para a listagem com o
   dado atualizado.
5. Acessar `/clientes/{id-inexistente}` diretamente → mensagem
   "Cliente não encontrado", sem tela quebrada.

## Verificação (todas as correções)

```bash
pnpm --filter @citybox/erp-api test
pnpm --filter @citybox/erp-web test
pnpm --filter @citybox/erp-api build && pnpm --filter @citybox/erp-web build
pnpm lint && pnpm typecheck
```
