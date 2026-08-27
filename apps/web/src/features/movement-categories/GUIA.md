# Guia — Categorias de movimentação

## O que é

Categorias de movimentação classificam as entradas e saídas manuais de estoque
(ajustes, quebra, entrada avulsa, consumo interno, etc.). Cada categoria tem um
**código**, um **nome**, um **tipo** (entrada ou saída) e as **unidades**
(lojas) onde ela aparece.

## Para que serve

- Padronizar o motivo da movimentação no registro de estoque.
- Filtrar e entender o histórico (ex.: só saídas por quebra).
- Controlar em quais lojas cada categoria fica disponível.

## Como usar

### Lista

Em **Estoque → Categorias de Movimentação** você vê Código · Nome · Tipo.
Use a **busca** (código ou nome), o **filtro de tipo** e o botão
**Nova categoria**.

### Nova / Editar

O drawer pede:

1. **Nome** (até 60 caracteres) e **Tipo** (Entrada ou Saída).
2. **Seleção de unidades** — em quais lojas a categoria aparece.

O **código** (`CM-001`, …) é gerado automaticamente ao salvar uma categoria
nova.

### Excluir

Pelo menu da linha. Categorias já usadas em movimentações mock continuam
referenciadas pelo id; remova com cuidado no uso diário.

## Relação com outras telas

Ao **Registrar movimentação**, o select de categoria lê este mesmo cadastro.
