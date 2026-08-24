# Quickstart — validação manual (spec erp/030)

Pré-requisito: `erp-api`, `erp-web` e `fiscal-api` publicados com o código desta feature (deploy
é separado, feito ao final).

## B1 — Facilita NF-e e downloads

1. Login como usuário da organização RR EMPREENDIMENTOS → Finanças → Facilita NF-e.
2. **Esperado**: a lista de documentos carrega (sem "Não foi possível carregar os documentos
   emitidos").
3. Na linha da NFS-e `188c3ec0-e828-4937-9c42-4303290ee15c` (ou outra nota autorizada), clicar
   em baixar XML → arquivo baixa. Clicar em baixar PDF (DANFSE) → arquivo baixa.
4. Repetir o download de NF-e pelas telas de Vendas e Pedidos de venda para uma nota autorizada.

## B2 — NF-e do pedido #8

1. Vendas → Pedidos de venda → abrir o pedido #8 (ou qualquer pedido antigo com pagamento em
   Dinheiro/Boleto/Cartão/PIX).
2. Vendas → Fiscal → NF-e → escolher esse pedido → Emitir.
3. **Esperado**: a nota sai com `tPag=01` (Dinheiro) — sem a rejeição "forma de pagamento
   desconhecida".
4. Criar um pedido novo, escolher a forma de pagamento no formulário → **esperado**: o seletor
   lista as formas reais cadastradas em Configurações → Formas de pagamento (não mais um
   catálogo fixo separado).

## B3 — Alíquota de ISSQN

1. Configurações → Fiscal → Grupos de ISSQN → corrigir manualmente o grupo "Principal" para
   `issqnRate = 5` (se ainda estiver `0.05`) — correção de dado, não de código.
2. Emitir uma NFS-e com esse grupo e a opção de retenção marcada.
3. **Esperado**: o `pAliq` no XML/DPS gerado reflete `5.00`, não `500.00` nem `0.05`.
