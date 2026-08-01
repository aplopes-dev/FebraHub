"""
FebraHub · sheets_sync.py
Lê a aba FATURAMENTO da planilha da loja e grava em fato_loja_curso.

Registra quanto a LOJA vendeu durante cada curso/turma — serve para
ranquear os cursos que mais fazem a loja vender. NÃO é fonte de receita
(essa é o Omie); é o mesmo dinheiro visto por curso.

Variáveis de ambiente (ou .env na mesma pasta):
  GOOGLE_SERVICE_ACCOUNT       conteúdo do JSON da conta de serviço
  GOOGLE_SERVICE_ACCOUNT_FILE  (alternativa: caminho do arquivo)
  FEBRAHUB_API_URL
  FEBRAHUB_ETL_TOKEN

Uso:
  python sheets_sync.py
"""
import os, json

import febrahub_cliente as fc

fc.carregar_env()

from google.oauth2 import service_account
from googleapiclient.discovery import build

PLANILHA = '10lm_7AQQbrjWlUH65sWr2WcfJ312Rlnv3YGSBgTAOm0'
ABA      = 'FATURAMENTO'

MESES = {
    'JANEIRO':1,'FEVEREIRO':2,'MARCO':3,'MARÇO':3,'ABRIL':4,'MAIO':5,'JUNHO':6,
    'JULHO':7,'AGOSTO':8,'SETEMBRO':9,'OUTUBRO':10,'NOVEMBRO':11,'DEZEMBRO':12,
}

def credencial():
    escopo = ['https://www.googleapis.com/auth/spreadsheets.readonly']
    if os.environ.get('GOOGLE_SERVICE_ACCOUNT'):
        return service_account.Credentials.from_service_account_info(
            json.loads(os.environ['GOOGLE_SERVICE_ACCOUNT']), scopes=escopo)
    caminho = os.environ.get('GOOGLE_SERVICE_ACCOUNT_FILE', 'service_account.json')
    return service_account.Credentials.from_service_account_file(caminho, scopes=escopo)

# val ('R$ 1.234,56' -> 1234.56), inteiro e txt vinham copiados em cada
# script de planilha; agora são um só, em febrahub_cliente.
val, inteiro, txt = fc.val, fc.inteiro, fc.txt

def mes_ref(mes_nome, ano):
    """'FEVEREIRO/MARÇO' + 2023 -> 2023-02-01 (usa o primeiro mês)."""
    if not mes_nome or not ano: return None
    primeiro = str(mes_nome).upper().split('/')[0].strip()
    m = MESES.get(primeiro)
    if not m: return None
    try: return f"{int(ano)}-{m:02d}-01"
    except: return None

def main():
    svc = build('sheets', 'v4', credentials=credencial()).spreadsheets()
    r = svc.values().get(spreadsheetId=PLANILHA, range=f"'{ABA}'!A1:P2000").execute()
    linhas = r.get('values', [])
    if not linhas:
        print("aba vazia"); return

    cab = linhas[0]
    print(f"colunas: {cab}")

    registros, ignoradas, vistos = [], 0, set()
    for linha in linhas[1:]:
        # completa a linha até 16 colunas
        linha = list(linha) + [''] * (16 - len(linha))
        periodo, mes_nome, ano, curso, turma, treinador = linha[0:6]
        dinheiro, debito, credito, pix, total, meta, alunos, ticket = linha[6:14]

        mref = mes_ref(mes_nome, ano)
        curso_l = txt(curso)
        if not mref or not curso_l:
            ignoradas += 1
            continue

        chave = (mref, curso_l, txt(turma) or '', txt(treinador) or '')
        if chave in vistos:      # evita ON CONFLICT em duplicata do mesmo lote
            ignoradas += 1
            continue
        vistos.add(chave)

        registros.append({
            'mes_ref': mref,
            'ano': inteiro(ano),
            'mes_nome': txt(mes_nome),
            'periodo': txt(periodo),
            'curso': curso_l,
            'turma': txt(turma) or '',
            'treinador': txt(treinador) or '',
            'dinheiro': val(dinheiro),
            'debito': val(debito),
            'credito': val(credito),
            'pix': val(pix),
            'total': val(total),
            'meta': val(meta),
            'alunos': inteiro(alunos),
            'ticket_medio': val(ticket),
        })

    # grava em lotes (o cliente comum já quebra em lotes e imprime progresso)
    fc.upsert('fato_loja_curso', registros, 'mes_ref,curso,turma,treinador')

    print(f"total: {len(registros)} linhas | ignoradas: {ignoradas}")
    anos = sorted({r['ano'] for r in registros if r['ano']})
    print(f"anos: {anos}")

    # status
    try:
        fc.registrar_status('sheets', 'Planilha da Loja', 'ok', registros=len(registros))
    except Exception as e:
        print(f"[aviso] status não registrado: {e}")

if __name__ == '__main__':
    main()