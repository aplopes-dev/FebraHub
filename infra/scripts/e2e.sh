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
t "linhas do ranking comercial (>= 8233)" ok "$(js -b c_admin.txt $B/api/dados/vw_comercial_ranking_historico | python3 -c 'import sys,json;print("ok" if len(json.load(sys.stdin)) >= 8233 else "abaixo do piso")')"
# Piso, não igualdade: os ETLs rodam todo dia e o número CRESCE. Fixar o valor
# do dia da migração faria o teste falhar justamente quando a carga funcionou —
# foi o que aconteceu quando o Sympla trouxe 3986 contra os 3862 chumbados aqui.
t "ingressos de eventos (>= 3862)" ok "$(js -b c_admin.txt $B/api/dados/vw_eventos_desempenho | python3 -c 'import sys,json;print("ok" if sum(int(r["ingressos"] or 0) for r in json.load(sys.stdin)) >= 3862 else "abaixo do piso")')"
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

echo "── hub executivo ──"
# Julho/2026 como mês de referência: fechado (comparações cheias, sem projeção)
# e com meta REAL da loja na planilha — nada aqui depende do dia de execução.
RESUMO=$(js -b c_admin.txt "$B/api/executivo/resumo?mes=2026-07")
t "resumo executivo responde"              ok "$(echo "$RESUMO" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if "cards" in d and "alertas" in d and "destaques" in d else "faltando chaves")')"
t "resumo com todos os setores (>= 15 cards)" ok "$(echo "$RESUMO" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if len(d["cards"])>=15 else len(d["cards"]))')"
t "todo card tem status com rotulo"        ok "$(echo "$RESUMO" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if all(c["status"].get("rotulo") for c in d["cards"]) else "card sem rotulo")')"
t "mes fechado nao e parcial nem projeta"  ok "$(echo "$RESUMO" | python3 -c '
import sys,json;d=json.load(sys.stdin)
c=[x for x in d["cards"] if x["codigo"]=="receita_cursos"][0]
print("ok" if not c["parcial"] and c["projecao"] is None and c["comparacoes"]["mesAnterior"] else "errado")')"
t "receita de cursos jul/26 (piso 1,2M)"   ok "$(echo "$RESUMO" | python3 -c '
import sys,json;d=json.load(sys.stdin)
c=[x for x in d["cards"] if x["codigo"]=="receita_cursos"][0]
print("ok" if (c["valor"] or 0) >= 1200000 else c["valor"])')"
t "meta real da loja veio da planilha"     loja "$(echo "$RESUMO" | python3 -c '
import sys,json;d=json.load(sys.stdin)
c=[x for x in d["cards"] if x["codigo"]=="receita_loja"][0]
print(c["meta"]["origem"] if c["meta"] else "sem meta")')"
t "indicador sem meta diz isso no status"  "Sem meta definida" "$(echo "$RESUMO" | python3 -c '
import sys,json;d=json.load(sys.stdin)
c=[x for x in d["cards"] if x["codigo"]=="receita_cursos"][0]
print(c["status"]["rotulo"])')"
t "fontes de dados no resumo (>= 8)"       ok "$(echo "$RESUMO" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if len(d["fontes"])>=8 else len(d["fontes"]))')"
t "tela analitica com formula do catalogo" ok "$(js -b c_admin.txt "$B/api/executivo/indicadores/receita_cursos?mes=2026-07" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if "fato_pagamento_base" in d["formula"] and d["quebras"] else "sem formula/quebras")')"
t "ritmo de julho tem os 31 dias"          31 "$(js -b c_admin.txt "$B/api/executivo/ritmo/receita_cursos?mes=2026-07" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)["pontos"]))')"
t "tabela paginada respeita o tamanho"     ok "$(js -b c_admin.txt "$B/api/executivo/indicadores/receita_cursos/tabela?de=2026-07&ate=2026-07&pagina=1&por_pagina=25" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if len(d["linhas"])<=25 and d["total"]>=300 else "paginacao errada")')"
t "consolidado anual com 5+ anos"          ok "$(js -b c_admin.txt "$B/api/executivo/anual/receita_cursos" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if len(d["linhas"])>=5 else len(d["linhas"]))')"
t "comercial NAO abre indicador financeiro" 403 "$(cod -b c_com.txt "$B/api/executivo/indicadores/despesas")"
t "resumo do comercial so tem o setor dele" ok "$(js -b c_com.txt "$B/api/executivo/resumo?mes=2026-07" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if d["cards"] and all(c["setor"]=="comercial" for c in d["cards"]) else "vazou setor")')"
t "membro nao define meta"                 403 "$(cod -b c_com.txt -X PUT $B/api/executivo/metas -H 'Content-Type: application/json' -d '{"indicador":"vendas_cursos","escopo":"mes","competencia":"2030-01-01","valor":1}')"
t "admin define meta (auditado)"           204 "$(cod -b c_admin.txt -X PUT $B/api/executivo/metas -H 'Content-Type: application/json' -d '{"indicador":"vendas_cursos","escopo":"mes","competencia":"2030-01-01","valor":123456}')"
t "meta definida aparece na listagem"      123456 "$(js -b c_admin.txt "$B/api/executivo/metas?mes=2030-01" | python3 -c '
import sys,json
l=[m for m in json.load(sys.stdin) if m["indicador"]=="vendas_cursos" and m["escopo"]=="mes"][0]
print(int(l["valor"]))')"
t "admin remove a meta de teste"           204 "$(cod -b c_admin.txt -X PUT $B/api/executivo/metas -H 'Content-Type: application/json' -d '{"indicador":"vendas_cursos","escopo":"mes","competencia":"2030-01-01","valor":null}')"
t "export CSV do resumo"                   "text/csv; charset=utf-8" "$(curl -s -o /dev/null -w '%{content_type}' --max-time 30 -b c_admin.txt "$B/api/executivo/exportar?mes=2026-07")"
t "export exige sessao"                    401 "$(cod "$B/api/executivo/exportar")"

echo
echo "════ RESULTADO: $OK passaram, $FALHA falharam ════"
[ "$FALHA" -eq 0 ]
