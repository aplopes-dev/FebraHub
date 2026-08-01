"""
FebraHub · sheets_metas_sync.py
Lê as abas METAS MENSAIS 2025 e 2026 e grava as metas da loja.

Formato de origem: blocos visuais lado a lado. Cada mês ocupa um
conjunto de colunas, com cabeçalho "METAS <MÊS> <PRAÇA>" na linha 0,
os três níveis (Máster/Básica/Mínima) nas linhas 1-3, e a lista de
cursos a partir da linha 5.

Só Salvador — blocos de RECIFE são ignorados.

Variáveis de ambiente (ou .env):
  GOOGLE_SERVICE_ACCOUNT ou GOOGLE_SERVICE_ACCOUNT_FILE
  FEBRAHUB_API_URL, FEBRAHUB_ETL_TOKEN
"""
import os, json

import febrahub_cliente as fc

fc.carregar_env()

from google.oauth2 import service_account
from googleapiclient.discovery import build

PLANILHA = '10lm_7AQQbrjWlUH65sWr2WcfJ312Rlnv3YGSBgTAOm0'
ABAS = {2025: 'METAS MENSAIS 2025', 2026: 'METAS MENSAIS 2026'}

MESES = {'JANEIRO':1,'FEVEREIRO':2,'MARCO':3,'MARÇO':3,'ABRIL':4,'MAIO':5,
         'JUNHO':6,'JULHO':7,'AGOSTO':8,'SETEMBRO':9,'OUTUBRO':10,
         'NOVEMBRO':11,'DEZEMBRO':12}

def credencial():
    escopo = ['https://www.googleapis.com/auth/spreadsheets.readonly']
    if os.environ.get('GOOGLE_SERVICE_ACCOUNT'):
        return service_account.Credentials.from_service_account_info(
            json.loads(os.environ['GOOGLE_SERVICE_ACCOUNT']), scopes=escopo)
    return service_account.Credentials.from_service_account_file(
        os.environ.get('GOOGLE_SERVICE_ACCOUNT_FILE', 'service_account.json'), scopes=escopo)

# zero_nulo: célula de meta com 0 é meta não preenchida, não meta de zero.
def val(s):
    return fc.val(s, zero_nulo=True)

inteiro = fc.inteiro

def cel(linhas, i, j):
    if i >= len(linhas): return ''
    linha = linhas[i]
    return linha[j] if j < len(linha) else ''

def processar_aba(svc, ano, aba):
    r = svc.values().get(spreadsheetId=PLANILHA, range=f"'{aba}'!A1:DZ200").execute()
    linhas = r.get('values', [])
    if not linhas:
        print(f"  {aba}: vazia"); return [], []

    # localiza os blocos pelo cabeçalho "METAS <MÊS> ..."
    cab = linhas[0]
    blocos = []
    for j, c in enumerate(cab):
        t = str(c or '').upper().strip()
        if not t.startswith('METAS'): continue
        if 'RECIFE' in t:            # só Salvador
            print(f"    ignorando bloco Recife: {t[:30]}")
            continue
        mes = next((m for nome, m in MESES.items() if nome in t), None)
        if mes:
            blocos.append((j, mes, t))

    metas_mes, metas_curso = [], []
    for idx, (col, mes, titulo) in enumerate(blocos):
        fim = blocos[idx+1][0] if idx+1 < len(blocos) else col + 8
        mref = f"{ano}-{mes:02d}-01"

        # linhas 1-3: MASTER / BÁSICA / MÍNIMA (rótulo em col, valor em col+1)
        niveis = {}
        for i in (1, 2, 3):
            rot = str(cel(linhas, i, col) or '').upper().strip()
            v = val(cel(linhas, i, col+1))
            if 'MASTER' in rot or 'MÁSTER' in rot: niveis['master'] = v
            elif 'BASICA' in rot or 'BÁSICA' in rot: niveis['basica'] = v
            elif 'MINIMA' in rot or 'MINÍMA' in rot or 'MÍNIMA' in rot: niveis['minima'] = v

        if any(niveis.values()):
            metas_mes.append({
                'mes_ref': mref, 'ano': ano,
                'mes_nome': next((n for n, m in MESES.items() if m == mes), None),
                'master': niveis.get('master'),
                'basica': niveis.get('basica'),
                'minima': niveis.get('minima'),
            })

        # linha 4 é o cabeçalho dos cursos; a partir da 5, os cursos
        vistos = set()
        for i in range(5, len(linhas)):
            curso = str(cel(linhas, i, col) or '').strip()
            if not curso or curso.upper() in ('TOTAL', 'CURSO', 'CURSOS'): continue
            if curso.upper().startswith('METAS'): break
            mp = val(cel(linhas, i, col+1))
            mc = val(cel(linhas, i, col+2))
            mt = val(cel(linhas, i, col+3))
            al = inteiro(cel(linhas, i, col+4))
            if mp is None and mt is None: continue
            chave = (mref, curso.upper())
            if chave in vistos: continue
            vistos.add(chave)
            metas_curso.append({
                'mes_ref': mref, 'curso': curso,
                'meta_produtos': mp, 'meta_curso': mc,
                'meta_total': mt, 'alunos': al,
            })

    print(f"  {aba}: {len(metas_mes)} meses, {len(metas_curso)} cursos")
    return metas_mes, metas_curso

def main():
    svc = build('sheets', 'v4', credentials=credencial()).spreadsheets()
    todas_mes, todas_curso = [], []
    for ano, aba in ABAS.items():
        print(f"\n=== {aba} ===")
        try:
            m, c = processar_aba(svc, ano, aba)
            todas_mes += m; todas_curso += c
        except Exception as e:
            print(f"  ERRO: {e}")

    # dedup: o mesmo mês pode aparecer em mais de um bloco na planilha.
    # mantém a última ocorrência (a mais à direita, normalmente a atualizada).
    dm = {}
    for r in todas_mes:
        dm[r['mes_ref']] = r
    todas_mes = list(dm.values())

    dc = {}
    for r in todas_curso:
        dc[(r['mes_ref'], r['curso'].upper().strip())] = r
    todas_curso = list(dc.values())

    fc.upsert('fato_loja_meta_mes', todas_mes, 'mes_ref')
    fc.upsert('fato_loja_meta_curso', todas_curso, 'mes_ref,curso')

    print(f"\ntotal: {len(todas_mes)} metas mensais, {len(todas_curso)} metas por curso")
    print("meses:", sorted(r['mes_ref'] for r in todas_mes))

if __name__ == '__main__':
    main()