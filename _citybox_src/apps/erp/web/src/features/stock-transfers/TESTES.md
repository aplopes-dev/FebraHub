# Transferências entre depósitos — roteiro de testes manuais

Pré-requisitos: API + web no ar; ≥2 depósitos com unidades; produtos com saldo no depósito origem.

## Listagem (`/estoque/transferencias`)

1. Abrir a lista — dados da API, busca debounce ~400ms, paginação server-side.
2. Abrir detalhe/drawer se houver — origem, destino e linhas.

## Nova transferência (`/estoque/transferencias/novo`)

1. Selecionar depósito origem e destino (distintos).
2. Adicionar produtos com quantidade ≤ saldo origem.
3. Salvar — loading no botão; toast de sucesso.
4. Conferir balanços: origem diminui, destino aumenta (mesma quantidade).

## Regressão rápida

- Transferência inválida (mesmo depósito / qty > saldo) retorna erro amigável da API.
- Lista de produtos no form restringe a `trackStock`.
