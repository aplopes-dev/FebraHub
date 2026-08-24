# Roteiro manual — Pedidos delivery (PDV)

Foco: quadro **Pedidos delivery** (Pacote A + sheet) e os dois caminhos de
cobrança: **pagar agora** ou **salvar → Kanban → cobrar depois (COD)**.

**Pré-requisitos** (já feitos no [pdv-teste-manual.md](./pdv-teste-manual.md)):

- `erp-api` (:3114) no ar, migration de delivery aplicada
- PDV pareado, operador logado, **turno aberto**
- Módulo **Delivery** / **Pedidos delivery** ligados no terminal (perfil Loja ou Personalizado)
- Pelo menos 1 produto no catálogo POS e 1 meio de pagamento (ex.: Dinheiro)
- Ideal: 1 cliente CRM com endereço de entrega e 1 entregador cadastrado no ERP (Equipe / couriers POS)

Marque cada linha ao passar. Anote falhas no fim.

---

## A — Quadro (Pacote A)

| # | Ação | Esperado | Ok? |
|---|---|---|---|
| A.1 | Home → **Pedidos delivery** | Abre Kanban com 4 colunas: **Novo · Em preparo · Despachado · Concluído** | |
| A.2 | Conferir filtro (botão Filtros) | Situação **Abertos** já marcada; coluna Concluído vazia se só houver pedidos fechados antigos | |
| A.3 | App bar | Botões **Novo delivery**, **Atualizar**, Filtros, Legenda, Configurações | |
| A.4 | Configurações → modo **Tabela** → Salvar → fechar app → reabrir → Pedidos delivery | Continua em Tabela (persistência `pdv.delivery_view_mode.v1`) | |
| A.5 | Voltar modo **Kanban** e salvar | Quadro de colunas de novo | |

---

## B — Criar pedido e valor no cartão

| # | Ação | Esperado | Ok? |
|---|---|---|---|
| B.1 | Em Pedidos delivery → **Novo delivery** | Form: cliente CRM (ou nome avulso), entrega/retirada, endereço/taxa/entregador se for entrega | |
| B.2 | Selecionar cliente CRM + endereço + taxa (ex. R$ 5,00) → Continuar no Balcão | Balcão abre com o **nome do cliente** (não “Consumidor Final”) | |
| B.2b | Sem lançar itens → **Voltar** → Pedidos delivery | **Nenhum** cartão novo no Kanban (rascunho descartado; não criou no ERP) | |
| B.3 | Lançar 2 itens com total conhecido (anotar subtotal) | Painel: **SALVAR E VOLTAR** em destaque (verde, primário) e **PAGAR AGORA** secundário — sem o botão único PAGAMENTO | |
| B.4 | **SALVAR E VOLTAR** | Volta a Pedidos delivery; cartão na coluna **Novo**; valor = **itens + taxa** | |
| B.5 | Conferir valor no cartão (e na Tabela, se trocar) | Ex.: itens R$ 40 + taxa R$ 5 → **R$ 45,00** | |
| B.6 | Criar outro pedido como **Retirada** | Sem endereço/taxa/entregador; taxa 0; ícone/label Retirada no cartão | |

---

## C — Sheet de detalhe

| # | Ação | Esperado | Ok? |
|---|---|---|---|
| C.1 | Tocar um cartão (não o botão →) | Folha lateral: nº, status, fulfillment, cliente, endereço, horário, itens, subtotal/taxa/total | |
| C.2 | **Abrir balcão** | Vai ao Balcão com a mesma conta; cliente permanece; dual CTA de novo | |
| C.3 | Voltar ao quadro → abrir sheet → **Iniciar preparo** | Pedido some de Novo e aparece em **Em preparo**; sheet fecha | |
| C.4 | Atalho **→** no cartão (Em preparo) com entregador já definido | Avança para **Despachado** sem abrir o sheet | |
| C.5 | (Só entrega) Sheet → escolher **Entregador** | Nome grava; após Atualizar/poll o entregador permanece | |
| C.6 | Pedido com itens, não pago → sheet | Botão **Registrar pagamento** visível | |
| C.7 | Pedido ainda aberto → Sheet → **Cancelar pedido** → confirmar | Some dos Abertos; com filtro Cancelados, aparece cancelado | |
| C.8 | Pedido **pago** (ainda em preparo/despacho) → sheet | Sem Abrir balcão; sem Cancelar; sem Registrar pagamento; tom **Pago**; **Ver recibo** se venda no turno; **pode avançar** status | |
| C.9 | Pedido **Concluído** (`delivered`) → sheet | Sem Abrir balcão; sem Cancelar; sem Avançar; sem Registrar pagamento; Ver recibo se pago | |

---

## D — Caminho COD (salvar → despachar → pagar)

| # | Ação | Esperado | Ok? |
|---|---|---|---|
| D.1 | Novo delivery → itens no Balcão → **SALVAR E VOLTAR** | Kanban; pedido em Novo; **não** passou por Pagamento | |
| D.2 | Avançar até **Despachado** (com entregador se for entrega) | Coluna Despachado; tom/rótulo **Aguardando Pagamento** | |
| D.3 | Sheet → **Registrar pagamento** → finalizar venda | Venda ok; pedido **permanece** na coluna atual (não vai para Concluído); tom **Pago** | |
| D.4 | Filtro **Abertos** | Pedido pago **ainda aparece** (status operacional aberto) | |
| D.5 | Avançar até **Marcar como concluído** | Só então entra na coluna **Concluído** / filtro Fechados | |

---

## E — Caminho pagar agora

| # | Ação | Esperado | Ok? |
|---|---|---|---|
| E.1 | Novo delivery → itens → **PAGAR AGORA** → finalizar | Venda ok; pedido em **Novo** (ou coluna em que estava) com tom **Pago** — **não** Concluído | |
| E.2 | Pedidos delivery com filtro **Abertos** | Pedido pago **aparece** até marcar concluído operacionalmente | |
| E.3 | Avançar status até Concluído → Filtros **Fechados** | Pedido aparece como Fechado / coluna Concluído | |
| E.4 | ERP → Pedidos de venda / Sale orders → filtrar canal **delivery** (se disponível) | Venda aparece; detalhe com vínculo / nº delivery quando houver | |

---

## F — Atualizar e poll

| # | Ação | Esperado | Ok? |
|---|---|---|---|
| F.1 | Com Pedidos delivery aberto, criar um delivery em **outra** janela/fluxo e voltar ao quadro | Em até **~15 s** (ou ao clicar **Atualizar**) o pedido aparece em Novo | |
| F.1b | Sair e **entrar de novo** em Pedidos delivery | Refresh imediato (não espera o poll) | |
| F.2 | Clicar **Atualizar** com API ok | Label “Atualizando…” breve; lista refresca sem erro | |
| F.3 | (Opcional) Parar `erp-api` → Atualizar | SnackBar de erro; tela não fecha. Poll continua sem spam de SnackBar | |

---

## G — Regressões rápidas

| # | Ação | Esperado | Ok? |
|---|---|---|---|
| G.1 | Despachar **entrega** sem entregador (avançar Em preparo → Despachado) | API deve **recusar** (entregador obrigatório no despacho de delivery) — SnackBar; status não muda | |
| G.2 | Despachar **retirada** sem entregador | Deve **permitir** (retirada não exige courier) | |
| G.3 | Busca na barra (nome do cliente / endereço) | Recorta o quadro; limpar busca volta | |
| G.4 | Filtro só **Retirada** | Some entregas; só pickups | |
| G.5 | Balcão **sem** conta delivery (venda normal) | Um botão só: **PAGAMENTO (F2)** — sem Salvar e voltar | |
| G.6 | Dois toques rápidos em **SALVAR E VOLTAR** | Só **um** cartão no Kanban (lock anti-duplo) | |
| G.7 | Rascunho com itens → **Voltar** | Diálogo “Descartar pedido?”; Continuar editando mantém o Balcão | |
| G.8 | Mudar cliente/endereço no Balcão → Salvar (pedido **não** pago) | Pedido no ERP com o **novo** nome/endereço | |
| G.8b | Pedido **pago** → tentar trocar cliente no Balcão | Bloqueado (snack / sem efeito no ERP) | |
| G.9 | ERP **Pedidos de venda** — venda canal Delivery | Canal mostra **Delivery · Entrega** ou **Delivery · Retirada** | |
| G.10 | Cancelar venda delivery no PDV | Some o vínculo **Pago**; status operacional **permanece**; Kanban refresca na hora; dá para cobrar de novo | |
| G.11 | ERP Pedidos de venda → drawer Filtros | Limpar/Aplicar ficam fixos no rodapé ao rolar os filtros | |
---

## Registro

| Data | Quem | Ambiente | Falhas |
|---|---|---|---|
| | | | |

### Anotações

_
