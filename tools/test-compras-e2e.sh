#!/usr/bin/env bash
set -euo pipefail
base="https://febracis-hom.aplopes.com/api"
id=$(jq -r .id /tmp/compra-criada.json)
adm=/tmp/febrahub_admin.cookies
senha=$(awk '$1=="dulcemariano@febracis.com.br"{print $2}' CREDENCIAIS_SEED.txt)
curl -fsS -o /tmp/login-admin.json -c "$adm" -H 'content-type: application/json' -d "{\"email\":\"dulcemariano@febracis.com.br\",\"senha\":\"$senha\"}" "$base/auth/entrar"
post(){ local nome=$1 path=$2 body=$3 code; code=$(curl -sS -o /tmp/e2e.json -w '%{http_code}' -b "$adm" -H 'content-type: application/json' -d "$body" "$base$path"); echo "$nome|$code"; test "$code" -ge 200 -a "$code" -lt 300; }
post analisar "/compras/$id/acoes" '{"acao":"analisar"}'
while read -r item; do code=$(curl -sS -o /tmp/e2e.json -w '%{http_code}' -X PATCH -b "$adm" -H 'content-type: application/json' -d '{"quantidadeReservada":0}' "$base/compras/$id/itens/$item/estoque"); echo "estoque|$code"; test "$code" = 200; done < <(jq -r '.itens[].id' /tmp/compra-criada.json)
post iniciar_cotacao "/compras/$id/acoes" '{"acao":"iniciar_cotacao"}'
post proposta_1 "/compras/$id/cotacoes" '{"fornecedor":"[DEMO] Alfa Suprimentos","cnpj":"00.000.000/0001-01","contato":"compras@alfa.demo","valorUnitario":20,"valorTotal":460,"frete":0,"desconto":0,"prazoDias":7,"condicaoPagamento":"28 dias","validadeProposta":"2026-08-30","garantia":"90 dias"}'
post proposta_2 "/compras/$id/cotacoes" '{"fornecedor":"[DEMO] Beta Comercial","cnpj":"00.000.000/0002-02","contato":"vendas@beta.demo","valorUnitario":19,"valorTotal":450,"frete":20,"desconto":10,"prazoDias":5,"condicaoPagamento":"21 dias","validadeProposta":"2026-08-28","garantia":"60 dias"}'
post proposta_3 "/compras/$id/cotacoes" '{"fornecedor":"[DEMO] Gama Distribuidora","cnpj":"00.000.000/0003-03","contato":"atendimento@gama.demo","valorUnitario":18,"valorTotal":440,"frete":30,"desconto":0,"prazoDias":10,"condicaoPagamento":"30 dias","validadeProposta":"2026-08-29","garantia":"120 dias"}'
c3=$(jq -r .id /tmp/e2e.json)
post escolher "/compras/$id/cotacoes/$c3/escolher" '{"criterio":"Menor preço total e garantia"}'
post submeter "/compras/$id/acoes" '{"acao":"submeter_aprovacao"}'
post aprovar "/compras/$id/acoes" '{"acao":"aprovar"}'
post pedido "/compras/$id/pedidos" '{"previsaoEntrega":"2026-08-22"}'
post enviar_pedido "/compras/$id/acoes" '{"acao":"enviar_pedido"}'
i1=$(jq -r '.itens[0].id' /tmp/compra-criada.json); i2=$(jq -r '.itens[1].id' /tmp/compra-criada.json)
post recebimento_parcial "/compras/$id/recebimentos" "{\"itens\":[{\"itemId\":\"$i1\",\"quantidade\":4},{\"itemId\":\"$i2\",\"quantidade\":5}],\"notaFiscal\":\"NF-DEMO-001\",\"observacoes\":\"Primeira entrega conferida\"}"
post recebimento_total "/compras/$id/recebimentos" "{\"itens\":[{\"itemId\":\"$i1\",\"quantidade\":6},{\"itemId\":\"$i2\",\"quantidade\":15}],\"notaFiscal\":\"NF-DEMO-002\",\"observacoes\":\"Saldo entregue e conferido\"}"
post preparar "/compras/$id/acoes" '{"acao":"preparar_entrega"}'
post entregar "/compras/$id/acoes" '{"acao":"entregar"}'
curl -fsS -b "$adm" "$base/compras/$id" -o /tmp/e2e-final-admin.json
jq -r '"antes_confirmacao|\(.protocolo)|\(.situacao)|cotacoes=\(.cotacoes|length)|recebimentos=\(.recebimentos|length)|historico=\(.historico|length)"' /tmp/e2e-final-admin.json
