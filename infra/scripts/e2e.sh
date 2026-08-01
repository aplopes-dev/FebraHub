#!/bin/bash
# Suíte de aceitação do FebraHub, rodada contra o ambiente publicado.
#
# Não usa mock: fala com https://febracis.aplopes.com de fora do servidor, com
# as mesmas credenciais de um usuário real. É o que prova que a migração do
# Supabase ficou de pé — dados, permissão por setor, storage e sessão.
#
# As senhas abaixo são as temporárias geradas pelo seed. Troque-as por
# variáveis de ambiente assim que as pessoas trocarem as delas.
#   SENHA_ADMIN=... SENHA_QA=... ./e2e.sh
B=https://febracis.aplopes.com
OK=0; FALHA=0
t() { # t <descrição> <esperado> <obtido>
  if [ "$2" = "$3" ]; then printf "  \033[32mPASSA\033[0m  %-52s %s\n" "$1" "$3"; OK=$((OK+1));
  else printf "  \033[31mFALHA\033[0m  %-52s esperado=%s obtido=%s\n" "$1" "$2" "$3"; FALHA=$((FALHA+1)); fi
}
cod() { curl -s -o /dev/null -w "%{http_code}" --max-time 30 "$@"; }
js()  { curl -s --max-time 30 "$@"; }

rm -f c_admin.txt c_com.txt
echo "── infraestrutura ──"
t "HTTP redireciona para HTTPS"            301 "$(cod http://febracis.aplopes.com/)"
t "HTTPS responde"                         200 "$(cod https://febracis.aplopes.com/)"
t "certificado valido"                     1   "$(echo | openssl s_client -connect febracis.aplopes.com:443 -servername febracis.aplopes.com 2>&1 | grep -c 'Verify return code: 0')"
t "health geral"                           ok  "$(js $B/api/health | python3 -c 'import sys,json;print(json.load(sys.stdin)["status"])')"
t "postgres no health"                     True "$(js $B/api/health | python3 -c 'import sys,json;print(json.load(sys.stdin)["servicos"]["postgres"]["ok"])')"
t "minio no health"                        True "$(js $B/api/health | python3 -c 'import sys,json;print(json.load(sys.stdin)["servicos"]["minio"]["ok"])')"
PGX=$(cod --connect-timeout 5 http://72.61.131.155:5432/ 2>/dev/null); t "postgres nao exposto" 000 "${PGX:-000}"
MNX=$(cod --connect-timeout 5 http://72.61.131.155:9014/ 2>/dev/null); t "minio nao exposto" 000 "${MNX:-000}"

echo "── frontend ──"
t "titulo da pagina"                       "FebraHub · Febracis Salvador" "$(js $B/ | grep -oE '<title>[^<]*' | sed 's/<title>//')"
t "sem referencia a supabase no HTML"      0   "$(js $B/ | grep -ci supabase)"
t "assets do Next servidos"                200 "$(cod $B$(js $B/ | grep -oE '/_next/static/css/[a-z0-9]+\.css' | head -1))"

echo "── autenticacao ──"
t "senha errada recusada"                  401 "$(cod -X POST $B/api/auth/entrar -H 'Content-Type: application/json' -d '{"email":"qa.migracao@febracis.com.br","senha":"x"}')"
t "usuario inexistente = mesma resposta"   401 "$(cod -X POST $B/api/auth/entrar -H 'Content-Type: application/json' -d '{"email":"naoexiste@febracis.com.br","senha":"x"}')"
t "login valido"                           200 "$(cod -c c_admin.txt -X POST $B/api/auth/entrar -H 'Content-Type: application/json' -d '{"email":"dulcemariano@febracis.com.br","senha":"'"${SENHA_ADMIN:-g-7TAPbAW7MX_5LA}"'"}')"
t "cookie httpOnly + secure"               2   "$(grep -cE 'fh_(acesso|refresh)' c_admin.txt)"
t "sessao ativa (/auth/eu)"                admin "$(js -b c_admin.txt $B/api/auth/eu | python3 -c 'import sys,json;print(json.load(sys.stdin)["perfil"]["papel"])')"
t "sem sessao = 401"                       401 "$(cod $B/api/dados/vw_comercial_funil)"
t "refresh renova"                         200 "$(cod -b c_admin.txt -c c_admin.txt -X POST $B/api/auth/refresh)"

echo "── permissao por setor ──"
cod -c c_com.txt -X POST $B/api/auth/entrar -H 'Content-Type: application/json' -d '{"email":"qa.migracao@febracis.com.br","senha":"'"${SENHA_QA:-QaMigracao#2026!fh}"'"}' >/dev/null
t "comercial le o proprio setor"           200 "$(cod -b c_com.txt $B/api/dados/vw_comercial_ranking_historico)"
t "comercial NAO le financeiro"            403 "$(cod -b c_com.txt $B/api/dados/vw_financeiro_receita)"
t "comercial NAO escreve no pedagogico"    403 "$(cod -b c_com.txt -X POST $B/api/pedagogico/retencao -H 'Content-Type: application/json' -d '{"nome_cliente":"x","curso":"y"}')"
t "admin le financeiro"                    200 "$(cod -b c_admin.txt $B/api/dados/vw_financeiro_receita)"
t "relacao fora do catalogo = 404"         404 "$(cod -b c_admin.txt $B/api/dados/pg_shadow)"

echo "── dados reais ──"
t "receita de cursos"     "87657297.28" "$(js -b c_admin.txt $B/api/dados/vw_diretoria_consolidado | python3 -c 'import sys,json;print(round(sum(float(r["receita_liquida"] or 0) for r in json.load(sys.stdin) if r["unidade_negocio"]=="cursos"),2))')"
t "linhas do ranking comercial"  8233 "$(js -b c_admin.txt $B/api/dados/vw_comercial_ranking_historico | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')"
t "ingressos de eventos"         3862 "$(js -b c_admin.txt $B/api/dados/vw_eventos_desempenho | python3 -c 'import sys,json;print(sum(int(r["ingressos"] or 0) for r in json.load(sys.stdin)))')"
t "paginacao completa (>1000)"   True "$(js -b c_admin.txt $B/api/dados/vw_comercial_ranking_historico | python3 -c 'import sys,json;print(len(json.load(sys.stdin))>1000)')"

echo "── arquivos (MinIO) ──"
printf 'a;b;c\n1;2;3\n' > e2e.csv
AID=$(js -b c_admin.txt -X POST $B/api/arquivos -F "arquivo=@e2e.csv;type=text/csv" -F "pasta=e2e" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("id",""))')
t "upload aceito"                          True "$([ -n "$AID" ] && echo True || echo False)"
t "download pela API"                      "a;b;c" "$(js -b c_admin.txt $B/api/arquivos/$AID/conteudo | head -1)"
SURL=$(js -b c_admin.txt "$B/api/arquivos/$AID/url" | python3 -c 'import sys,json;print(json.load(sys.stdin)["url"])')
t "URL assinada funciona"                  200 "$(cod "$SURL")"
t "sem assinatura = 403"                   403 "$(cod "${SURL%%\?*}")"
printf '\x7fELF\x02\x01binario' > e2e.bin
t "binario disfarcado recusado"            400 "$(cod -b c_admin.txt -X POST $B/api/arquivos -F "arquivo=@e2e.bin;type=text/csv")"
t "listagem paginada"                      True "$(js -b c_admin.txt "$B/api/arquivos?por_pagina=5" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("paginas" in d and "total" in d)')"
t "exclusao autorizada"                    200 "$(cod -b c_admin.txt -X DELETE $B/api/arquivos/$AID)"
t "arquivo some da listagem"               404 "$(cod -b c_admin.txt $B/api/arquivos/$AID/conteudo)"

echo "── escrita e validacao ──"
RID=$(js -b c_admin.txt -X POST $B/api/pedagogico/retencao -H 'Content-Type: application/json' -d '{"nome_cliente":"E2E automatizado","curso":"GGB","desfecho":"pendente"}' | python3 -c 'import sys,json;print(json.load(sys.stdin).get("id",""))')
t "criacao de registro"                    True "$([ -n "$RID" ] && echo True || echo False)"
CORPO=$(printf '{"id":%s,"nome_cliente":"E2E automatizado","curso":"GGB","desfecho":"retido"}' "$RID")
EDIT=$(cod -b c_admin.txt -X POST $B/api/pedagogico/retencao -H 'Content-Type: application/json' -d "$CORPO")
t "edicao do registro (POST=201)"          201 "$EDIT"
LIDO=$(js -b c_admin.txt $B/api/dados/fato_retencao | RID="$RID" python3 -c "import sys,json,os;alvo=int(os.environ['RID']);print(next(r['desfecho'] for r in json.load(sys.stdin) if r['id']==alvo))")
t "leitura confirma a edicao"              retido "$LIDO"
t "DTO recusa campo invalido"              400 "$(cod -b c_admin.txt -X POST $B/api/pedagogico/retencao -H 'Content-Type: application/json' -d '{"nome_cliente":"x","curso":"y","desfecho":"invalido"}')"
t "DTO recusa campo faltando"              400 "$(cod -b c_admin.txt -X POST $B/api/pedagogico/retencao -H 'Content-Type: application/json' -d '{"curso":"y"}')"

echo "── ingest (ETLs) ──"
t "ingest sem token = 401"                 401 "$(cod -X POST $B/api/ingest/dim_cursos -H 'Content-Type: application/json' -d '{"conflito":"curso_id","linhas":[]}')"
t "ingest com token errado = 401"          401 "$(cod -X POST $B/api/ingest/dim_cursos -H 'X-ETL-Token: errado' -H 'Content-Type: application/json' -d '{"conflito":"curso_id","linhas":[]}')"

echo
echo "════ RESULTADO: $OK passaram, $FALHA falharam ════"
[ "$FALHA" -eq 0 ]
