#!/usr/bin/env bash
set -euo pipefail
base=https://febracis-hom.aplopes.com/api
jar=/tmp/loja.ctx.cookies
unidade=$(jq -r .unidadePrincipalId /tmp/ctx-loja.json); setor=$(jq -r .setorPrincipalId /tmp/ctx-loja.json); rec=$(jq -r '.unidades[]|select(.codigo=="REC")|.id' /tmp/ctx-admin.json)
produto=$(curl -fsS -b "$jar" "$base/compras/produtos/estoque" | jq '.[0]')
pid=$(jq -r .produtoId <<<"$produto"); pnome=$(jq -r .descricao <<<"$produto")
criar(){ nome=$1; arquivo=$2; code=$(curl -sS -o "/tmp/$nome.json" -w '%{http_code}' -b "$jar" -H 'content-type: application/json' -d @"$arquivo" "$base/compras"); echo "$nome|$code"; test "$code" = 201; }
jq -n --arg u "$unidade" --arg s "$setor" --arg p "$pid" --arg n "$pnome" '{titulo:("Aquisição de "+$n),tipo:"item",unidadeId:$u,setorId:$s,justificativa:"[TESTE FORMULARIO] Item cadastrado",prioridade:"normal",itens:[{produtoId:$p,descricao:$n,quantidade:1,unidade:"un",especificacao:"Teste de disponibilidade"}]}' >/tmp/item-cadastrado.payload.json
criar item_cadastrado /tmp/item-cadastrado.payload.json
jq -n --arg u "$unidade" --arg s "$setor" '{titulo:"Aquisição de item ainda não cadastrado",tipo:"item",unidadeId:$u,setorId:$s,justificativa:"[TESTE FORMULARIO] Item livre",prioridade:"normal",itens:[{descricao:"[TESTE] Item livre controlado",quantidade:2,unidade:"un",especificacao:"Não criar produto automaticamente"}]}' >/tmp/item-livre.payload.json
criar item_livre /tmp/item-livre.payload.json
jq -n --arg u "$unidade" --arg s "$setor" '{titulo:"Contratação de manutenção preventiva",tipo:"servico",unidadeId:$u,setorId:$s,justificativa:"[TESTE FORMULARIO] Serviço",prioridade:"normal",itens:[{descricao:"[TESTE] Manutenção preventiva",quantidade:1,unidade:"serviço",especificacao:"Escopo de validação"}]}' >/tmp/servico.payload.json
criar servico /tmp/servico.payload.json
jq -n --arg u "$rec" --arg s "$setor" '{titulo:"Tentativa não autorizada",tipo:"item",unidadeId:$u,setorId:$s,justificativa:"Teste",itens:[{descricao:"Teste",quantidade:1,unidade:"un"}]}' >/tmp/nao-autorizado.payload.json
code=$(curl -sS -o /tmp/nao-autorizado.json -w '%{http_code}' -b "$jar" -H 'content-type: application/json' -d @/tmp/nao-autorizado.payload.json "$base/compras"); echo "unidade_nao_autorizada|$code"; test "$code" = 403
jq -r '"item_cadastrado|\(.protocolo)|produto_id=\(.itens[0].produtoId)|setor_id=\(.setorId)|unidade_id=\(.unidadeId)"' /tmp/item_cadastrado.json
jq -r '"item_livre|\(.protocolo)|produto_id=\(.itens[0].produtoId)|situacao_item=\(.itens[0].situacao)"' /tmp/item_livre.json
jq -r '"servico|\(.protocolo)|tipo=\(.tipo)"' /tmp/servico.json
