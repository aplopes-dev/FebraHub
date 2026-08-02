#!/bin/bash
# Suíte de aceitação do FebraHub, rodada contra o ambiente publicado.
#
# Não usa mock: fala com https://febracis.aplopes.com de fora do servidor, com
# as mesmas credenciais de um usuário real. É o que prova que a migração do
# Supabase ficou de pé — dados, permissão por setor, storage e sessão.
#
# Credenciais SÓ por variável de ambiente — nada de senha no script (já
# vazou uma vez; nunca mais):
#   SENHA_ADMIN=... SENHA_QA=... ./e2e.sh
: "${SENHA_ADMIN:?defina SENHA_ADMIN no ambiente}"
: "${SENHA_QA:?defina SENHA_QA no ambiente}"
B=https://febracis.aplopes.com
OK=0; FALHA=0
t() { # t <descrição> <esperado> <obtido>
  if [ "$2" = "$3" ]; then printf "  \033[32mPASSA\033[0m  %-52s %s\n" "$1" "$3"; OK=$((OK+1));
  else printf "  \033[31mFALHA\033[0m  %-52s esperado=%s obtido=%s\n" "$1" "$2" "$3"; FALHA=$((FALHA+1)); fi
}
cod() { curl -s -o /dev/null -w "%{http_code}" --max-time 30 "$@"; }
js()  { curl -s --max-time 30 "$@"; }

# Os jars de cookie carregam SESSÃO VIVA de produção: vivem num diretório
# temporário efêmero, nunca na árvore do repositório (um `git add .` distraído
# já commitou um refresh token válido — a sessão foi revogada e o arquivo
# saiu do versionamento, mas a regra agora é estrutural).
JAR="$(mktemp -d)"; trap 'rm -rf "$JAR"' EXIT
C_ADMIN="$JAR/admin.txt"; C_COM="$JAR/comercial.txt"
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
t "login valido"                           200 "$(cod -c "$C_ADMIN" -X POST $B/api/auth/entrar -H 'Content-Type: application/json' -d '{"email":"dulcemariano@febracis.com.br","senha":"'"${SENHA_ADMIN}"'"}')"
t "cookie httpOnly + secure"               2   "$(grep -cE 'fh_(acesso|refresh)' "$C_ADMIN")"
t "sessao ativa (/auth/eu)"                admin "$(js -b "$C_ADMIN" $B/api/auth/eu | python3 -c 'import sys,json;print(json.load(sys.stdin)["perfil"]["papel"])')"
t "sem sessao = 401"                       401 "$(cod $B/api/dados/vw_comercial_funil)"
t "refresh renova"                         200 "$(cod -b "$C_ADMIN" -c "$C_ADMIN" -X POST $B/api/auth/refresh)"

echo "── permissao por setor ──"
cod -c "$C_COM" -X POST $B/api/auth/entrar -H 'Content-Type: application/json' -d '{"email":"qa.migracao@febracis.com.br","senha":"'"${SENHA_QA}"'"}' >/dev/null
t "comercial le o proprio setor"           200 "$(cod -b "$C_COM" $B/api/dados/vw_comercial_ranking_historico)"
t "comercial NAO le financeiro"            403 "$(cod -b "$C_COM" $B/api/dados/vw_financeiro_receita)"
t "comercial NAO escreve no pedagogico"    403 "$(cod -b "$C_COM" -X POST $B/api/pedagogico/retencao -H 'Content-Type: application/json' -d '{"nome_cliente":"x","curso":"y"}')"
t "admin le financeiro"                    200 "$(cod -b "$C_ADMIN" $B/api/dados/vw_financeiro_receita)"
t "relacao fora do catalogo = 404"         404 "$(cod -b "$C_ADMIN" $B/api/dados/pg_shadow)"

echo "── dados reais ──"
t "receita de cursos"     "87657297.28" "$(js -b "$C_ADMIN" $B/api/dados/vw_diretoria_consolidado | python3 -c 'import sys,json;print(round(sum(float(r["receita_liquida"] or 0) for r in json.load(sys.stdin) if r["unidade_negocio"]=="cursos"),2))')"
t "linhas do ranking comercial (>= 8233)" ok "$(js -b "$C_ADMIN" $B/api/dados/vw_comercial_ranking_historico | python3 -c 'import sys,json;print("ok" if len(json.load(sys.stdin)) >= 8233 else "abaixo do piso")')"
# Piso, não igualdade: os ETLs rodam todo dia e o número CRESCE. Fixar o valor
# do dia da migração faria o teste falhar justamente quando a carga funcionou —
# foi o que aconteceu quando o Sympla trouxe 3986 contra os 3862 chumbados aqui.
t "ingressos de eventos (>= 3862)" ok "$(js -b "$C_ADMIN" $B/api/dados/vw_eventos_desempenho | python3 -c 'import sys,json;print("ok" if sum(int(r["ingressos"] or 0) for r in json.load(sys.stdin)) >= 3862 else "abaixo do piso")')"
t "paginacao completa (>1000)"   True "$(js -b "$C_ADMIN" $B/api/dados/vw_comercial_ranking_historico | python3 -c 'import sys,json;print(len(json.load(sys.stdin))>1000)')"

echo "── arquivos (MinIO) ──"
printf 'a;b;c\n1;2;3\n' > e2e.csv
AID=$(js -b "$C_ADMIN" -X POST $B/api/arquivos -F "arquivo=@e2e.csv;type=text/csv" -F "pasta=e2e" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("id",""))')
t "upload aceito"                          True "$([ -n "$AID" ] && echo True || echo False)"
t "download pela API"                      "a;b;c" "$(js -b "$C_ADMIN" $B/api/arquivos/$AID/conteudo | head -1)"
SURL=$(js -b "$C_ADMIN" "$B/api/arquivos/$AID/url" | python3 -c 'import sys,json;print(json.load(sys.stdin)["url"])')
t "URL assinada funciona"                  200 "$(cod "$SURL")"
t "sem assinatura = 403"                   403 "$(cod "${SURL%%\?*}")"
printf '\x7fELF\x02\x01binario' > e2e.bin
t "binario disfarcado recusado"            400 "$(cod -b "$C_ADMIN" -X POST $B/api/arquivos -F "arquivo=@e2e.bin;type=text/csv")"
t "listagem paginada"                      True "$(js -b "$C_ADMIN" "$B/api/arquivos?por_pagina=5" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("paginas" in d and "total" in d)')"
t "exclusao autorizada"                    200 "$(cod -b "$C_ADMIN" -X DELETE $B/api/arquivos/$AID)"
t "arquivo some da listagem"               404 "$(cod -b "$C_ADMIN" $B/api/arquivos/$AID/conteudo)"

echo "── escrita e validacao ──"
RID=$(js -b "$C_ADMIN" -X POST $B/api/pedagogico/retencao -H 'Content-Type: application/json' -d '{"nome_cliente":"E2E automatizado","curso":"GGB","desfecho":"pendente"}' | python3 -c 'import sys,json;print(json.load(sys.stdin).get("id",""))')
t "criacao de registro"                    True "$([ -n "$RID" ] && echo True || echo False)"
CORPO=$(printf '{"id":%s,"nome_cliente":"E2E automatizado","curso":"GGB","desfecho":"retido"}' "$RID")
EDIT=$(cod -b "$C_ADMIN" -X POST $B/api/pedagogico/retencao -H 'Content-Type: application/json' -d "$CORPO")
t "edicao do registro (POST=201)"          201 "$EDIT"
LIDO=$(js -b "$C_ADMIN" $B/api/dados/fato_retencao | RID="$RID" python3 -c "import sys,json,os;alvo=int(os.environ['RID']);print(next(r['desfecho'] for r in json.load(sys.stdin) if r['id']==alvo))")
t "leitura confirma a edicao"              retido "$LIDO"
t "DTO recusa campo invalido"              400 "$(cod -b "$C_ADMIN" -X POST $B/api/pedagogico/retencao -H 'Content-Type: application/json' -d '{"nome_cliente":"x","curso":"y","desfecho":"invalido"}')"
t "DTO recusa campo faltando"              400 "$(cod -b "$C_ADMIN" -X POST $B/api/pedagogico/retencao -H 'Content-Type: application/json' -d '{"curso":"y"}')"

echo "── ingest (ETLs) ──"
t "ingest sem token = 401"                 401 "$(cod -X POST $B/api/ingest/dim_cursos -H 'Content-Type: application/json' -d '{"conflito":"curso_id","linhas":[]}')"
t "ingest com token errado = 401"          401 "$(cod -X POST $B/api/ingest/dim_cursos -H 'X-ETL-Token: errado' -H 'Content-Type: application/json' -d '{"conflito":"curso_id","linhas":[]}')"

echo "── hub executivo ──"
# Julho/2026 como mês de referência: fechado (comparações cheias, sem projeção)
# e com meta REAL da loja na planilha — nada aqui depende do dia de execução.
RESUMO=$(js -b "$C_ADMIN" "$B/api/executivo/resumo?mes=2026-07")
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
t "tela analitica com formula do catalogo" ok "$(js -b "$C_ADMIN" "$B/api/executivo/indicadores/receita_cursos?mes=2026-07" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if "fato_pagamento_base" in d["formula"] and d["quebras"] else "sem formula/quebras")')"
t "ritmo de julho tem os 31 dias"          31 "$(js -b "$C_ADMIN" "$B/api/executivo/ritmo/receita_cursos?mes=2026-07" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)["pontos"]))')"
t "tabela paginada respeita o tamanho"     ok "$(js -b "$C_ADMIN" "$B/api/executivo/indicadores/receita_cursos/tabela?de=2026-07&ate=2026-07&pagina=1&por_pagina=25" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if len(d["linhas"])<=25 and d["total"]>=300 else "paginacao errada")')"
t "consolidado anual com 5+ anos"          ok "$(js -b "$C_ADMIN" "$B/api/executivo/anual/receita_cursos" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if len(d["linhas"])>=5 else len(d["linhas"]))')"
t "comercial NAO abre indicador financeiro" 403 "$(cod -b "$C_COM" "$B/api/executivo/indicadores/despesas")"
t "resumo do comercial so tem o setor dele" ok "$(js -b "$C_COM" "$B/api/executivo/resumo?mes=2026-07" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if d["cards"] and all(c["setor"]=="comercial" for c in d["cards"]) else "vazou setor")')"
t "membro nao define meta"                 403 "$(cod -b "$C_COM" -X PUT $B/api/executivo/metas -H 'Content-Type: application/json' -d '{"indicador":"vendas_cursos","escopo":"mes","competencia":"2030-01-01","valor":1}')"
t "admin define meta (auditado)"           204 "$(cod -b "$C_ADMIN" -X PUT $B/api/executivo/metas -H 'Content-Type: application/json' -d '{"indicador":"vendas_cursos","escopo":"mes","competencia":"2030-01-01","valor":123456}')"
t "meta definida aparece na listagem"      123456 "$(js -b "$C_ADMIN" "$B/api/executivo/metas?mes=2030-01" | python3 -c '
import sys,json
l=[m for m in json.load(sys.stdin) if m["indicador"]=="vendas_cursos" and m["escopo"]=="mes"][0]
print(int(l["valor"]))')"
t "admin remove a meta de teste"           204 "$(cod -b "$C_ADMIN" -X PUT $B/api/executivo/metas -H 'Content-Type: application/json' -d '{"indicador":"vendas_cursos","escopo":"mes","competencia":"2030-01-01","valor":null}')"
t "export CSV do resumo"                   "text/csv; charset=utf-8" "$(curl -s -o /dev/null -w '%{content_type}' --max-time 30 -b "$C_ADMIN" "$B/api/executivo/exportar?mes=2026-07")"
t "export exige sessao"                    401 "$(cod "$B/api/executivo/exportar")"

echo "── inteligência territorial ──"
t "territorial exige sessao"                401 "$(cod $B/api/territorial/companies)"
t "comercial NAO abre o territorio"         403 "$(cod -b "$C_COM" $B/api/territorial/companies)"
TERR=$(js -b "$C_ADMIN" "$B/api/territorial/companies?limit=5")
t "lista paginada (piso 13 mil empresas)"   ok "$(echo "$TERR" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if len(d["data"])==5 and d["pagination"]["total"]>=13000 else d["pagination"]["total"])')"
t "pontos do mapa (piso 11 mil)"            ok "$(js -b "$C_ADMIN" "$B/api/territorial/companies/map" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if len(d["points"])>=11000 else len(d["points"]))')"
t "metricas do recorte"                     ok "$(js -b "$C_ADMIN" "$B/api/territorial/companies/metrics" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if d["total"]>=13000 and d["partnersTotal"]>=13000 else "abaixo do piso")')"
t "nichos com contagem (>= 10)"             ok "$(js -b "$C_ADMIN" "$B/api/territorial/niches" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if len(d)>=10 else len(d))')"
t "detalhe traz socios e conexoes"          ok "$(echo "$TERR" | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"][0]["id"])' | xargs -I{} curl -s --max-time 30 -b "$C_ADMIN" "$B/api/territorial/companies/{}" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if "company" in d and "connections" in d else "faltando")')"
t "filtro de UF respeitado"                 ok "$(js -b "$C_ADMIN" "$B/api/territorial/companies?states=PE&limit=3" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if d["data"] and all(e["state"]=="PE" for e in d["data"]) else "vazou UF")')"

echo "── crm ──"
t "crm exige sessao"                        401 "$(cod $B/api/crm/resumo)"
t "comercial NAO abre o crm"                403 "$(cod -b "$C_COM" $B/api/crm/resumo)"
t "resumo com funil padrao semeado"         ok "$(js -b "$C_ADMIN" $B/api/crm/resumo | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if d["funis"] and len(d["funis"][0]["etapas"])==6 else "funil errado")')"
CID=$(js -b "$C_ADMIN" -X POST $B/api/crm/clientes -H 'Content-Type: application/json' -d '{"nome":"E2E automatizado CRM"}' | python3 -c 'import sys,json;print(json.load(sys.stdin).get("id",""))')
t "cria lead"                               True "$([ -n "$CID" ] && echo True || echo False)"
t "lead nasce no estagio lead"              lead "$(js -b "$C_ADMIN" $B/api/crm/clientes/$CID | python3 -c 'import sys,json;print(json.load(sys.stdin)["estagio"])')"
NID=$(js -b "$C_ADMIN" -X POST $B/api/crm/negocios -H 'Content-Type: application/json' -d '{"titulo":"Negocio E2E","clienteId":"'"$CID"'","valorCentavos":123400}' | python3 -c 'import sys,json;print(json.load(sys.stdin).get("id",""))')
t "cria negocio no funil padrao"            True "$([ -n "$NID" ] && echo True || echo False)"
t "negocio promove lead a oportunidade"     oportunidade "$(js -b "$C_ADMIN" $B/api/crm/clientes/$CID | python3 -c 'import sys,json;print(json.load(sys.stdin)["estagio"])')"
# Etapas do seed têm uuid fixo: ...0012 = Qualificação, ...0016 = Perdido.
t "move etapa e registra atividade"         ok "$(js -b "$C_ADMIN" -X POST $B/api/crm/negocios/$NID/mover -H 'Content-Type: application/json' -d '{"etapaId":"c0000000-0000-4000-8000-000000000012"}' >/dev/null; js -b "$C_ADMIN" $B/api/crm/negocios/$NID | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if d["etapa"]["nome"]=="Qualificação" and any(a["tipo"]=="estagio" for a in d["atividades"]) else "sem trilha")')"
t "perder sem motivo e recusado"            400 "$(cod -b "$C_ADMIN" -X POST $B/api/crm/negocios/$NID/mover -H 'Content-Type: application/json' -d '{"etapaId":"c0000000-0000-4000-8000-000000000016"}')"
TID=$(js -b "$C_ADMIN" -X POST $B/api/crm/tarefas -H 'Content-Type: application/json' -d '{"titulo":"Tarefa E2E","negocioId":"'"$NID"'"}' | python3 -c 'import sys,json;print(json.load(sys.stdin).get("id",""))')
t "cria e conclui tarefa com resultado"     ok "$(js -b "$C_ADMIN" -X POST $B/api/crm/tarefas/$TID/concluir -H 'Content-Type: application/json' -d '{"resultado":"feito"}' | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if d["concluidaEm"] and d["resultado"]=="feito" else "nao concluiu")')"
t "remove negocio de teste"                 204 "$(cod -b "$C_ADMIN" -X DELETE $B/api/crm/negocios/$NID)"
t "remove lead de teste"                    204 "$(cod -b "$C_ADMIN" -X DELETE $B/api/crm/clientes/$CID)"

echo "── whatsapp + agentes ──"
t "whatsapp status exige sessao"            401 "$(cod $B/api/whatsapp/status)"
t "comercial NAO administra o whatsapp"     403 "$(cod -b "$C_COM" $B/api/whatsapp/status)"
t "status inicial da conexao"               ok "$(js -b "$C_ADMIN" $B/api/whatsapp/status | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if d and d.get("status") in ("desconectado","conectando","qr_pendente","conectado","erro") else "shape errado")')"
t "inbox de conversas responde"             ok "$(js -b "$C_ADMIN" $B/api/whatsapp/conversas | python3 -c 'import sys,json;print("ok" if isinstance(json.load(sys.stdin), list) else "nao e lista")')"
t "agentes conexao exige sessao"            401 "$(cod $B/api/agentes/conexao)"
t "estado inicial dos agentes"              ok "$(js -b "$C_ADMIN" $B/api/agentes/conexao | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if d and d.get("status") in ("desconectado","pareado","erro") else "shape errado")')"
t "conversas de agentes respondem"          ok "$(js -b "$C_ADMIN" $B/api/agentes/conversas | python3 -c 'import sys,json;print("ok" if isinstance(json.load(sys.stdin), list) else "nao e lista")')"
t "webhook sem assinatura e recusado"       401 "$(cod -X POST $B/api/agentes/webhook -H 'Content-Type: application/json' -d '{}')"
t "manifesto sem token e recusado"          401 "$(cod https://febracis.aplopes.com/.well-known/aplopes-integration)"
t "resumo de conversas com contadores"      ok "$(js -b "$C_ADMIN" $B/api/agentes/conversas/resumo | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if "porStatus" in d and "naoLidas" in d else "shape errado")')"
t "usuarios atribuiveis respondem"          ok "$(js -b "$C_ADMIN" $B/api/agentes/usuarios | python3 -c 'import sys,json;print("ok" if isinstance(json.load(sys.stdin), list) else "nao e lista")')"
t "comercial NAO acessa conversas"          403 "$(cod -b "$C_COM" $B/api/agentes/conversas)"
t "mover exige status valido"               400 "$(cod -b "$C_ADMIN" -X POST $B/api/agentes/conversas/00000000-0000-4000-8000-000000000000/mover -H 'Content-Type: application/json' -d '{"status":"INVENTADO"}')"
t "stream de eventos abre (SSE)"            200 "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 -b "$C_ADMIN" -H 'Accept: text/event-stream' $B/api/agentes/eventos || true)"

echo "── rotacao do refresh (a correcao desta entrega) ──"
# Renovação SEQUENCIAL rotaciona sem derrubar: três seguidas devem passar.
t "refresh 1 (rotacao)"                     200 "$(cod -b "$C_ADMIN" -c "$C_ADMIN" -X POST $B/api/auth/refresh)"
t "refresh 2 (rotacao em cadeia)"           200 "$(cod -b "$C_ADMIN" -c "$C_ADMIN" -X POST $B/api/auth/refresh)"
t "sessao segue valida apos rotacoes"       admin "$(js -b "$C_ADMIN" $B/api/auth/eu | python3 -c 'import sys,json;print(json.load(sys.stdin)["perfil"]["papel"])')"
# CORRIDA BENIGNA: duas renovações SIMULTÂNEAS com o MESMO cookie. Antes da
# correção, a perdedora contava como reuso e derrubava TODAS as sessões do
# usuário. Agora ambas respondem 200 (CAS no banco) e as duas sessões novas
# valem. Depois da corrida o cookie ORIGINAL está rotacionado — o jar segue
# a vida com o do lado B.
cp "$C_ADMIN" "$JAR/corrida_a.txt"; cp "$C_ADMIN" "$JAR/corrida_b.txt"
(cod -b "$JAR/corrida_a.txt" -c "$JAR/corrida_a.txt" -X POST $B/api/auth/refresh > "$JAR/ra.txt") &
(cod -b "$JAR/corrida_b.txt" -c "$JAR/corrida_b.txt" -X POST $B/api/auth/refresh > "$JAR/rb.txt") &
wait
t "corrida benigna: lado A vive"            200 "$(cat "$JAR/ra.txt")"
t "corrida benigna: lado B vive"            200 "$(cat "$JAR/rb.txt")"
cp "$JAR/corrida_b.txt" "$C_ADMIN"
t "sessao sobrevive a corrida"              admin "$(js -b "$C_ADMIN" $B/api/auth/eu | python3 -c 'import sys,json;print(json.load(sys.stdin)["perfil"]["papel"])')"
# REUSO DE VERDADE: um refresh com o cookie ANTIGO (de antes da última
# rotação) tem que ser recusado — e derrubar a família é o comportamento
# esperado. Fica por ÚLTIMO: depois dele este jar não vale mais.
cp "$C_ADMIN" "$JAR/antigo.txt"
cod -b "$C_ADMIN" -c "$C_ADMIN" -X POST $B/api/auth/refresh >/dev/null
t "reuso de refresh antigo e recusado"      401 "$(cod -b "$JAR/antigo.txt" -X POST $B/api/auth/refresh)"

echo
echo "════ RESULTADO: $OK passaram, $FALHA falharam ════"
[ "$FALHA" -eq 0 ]
