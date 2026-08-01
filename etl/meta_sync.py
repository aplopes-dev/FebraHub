"""
FebraHub · meta_sync.py
Puxa gasto/alcance por anúncio da Marketing API e grava em fato_meta_insights.

Variáveis de ambiente:
  META_TOKEN        token de longa duração (60 dias)
  META_ACCOUNT_ID   act_426283099062813
  FEBRAHUB_API_URL
  FEBRAHUB_ETL_TOKEN

Uso:
  python meta_sync.py                # últimos 2 meses (rotina diária)
  python meta_sync.py --desde 2024-01-01   # carga histórica
"""
import os, time, json, argparse, urllib.request, urllib.parse, urllib.error
from datetime import date, datetime, timedelta

import febrahub_cliente as fc

fc.carregar_env()

TOKEN   = os.environ['META_TOKEN']
ACCOUNT = os.environ['META_ACCOUNT_ID']
API     = 'https://graph.facebook.com/v25.0'

# anuncio_key é coluna GERADA no banco (faz parte da PK junto com data e
# campanha_id). O ETL não a envia — o Postgres não aceita valor em coluna
# GENERATED — e a API sabe disso: ela só exige nos dados as colunas de
# conflito que dá para escrever.
CONFLITO = 'data,campanha_id,anuncio_key'

def get(path, params, tentativa=0):
    params['access_token'] = TOKEN
    url = f"{API}/{path}?{urllib.parse.urlencode(params)}"
    try:
        with urllib.request.urlopen(url, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        corpo = e.read().decode(errors='replace')
        # 403/429 = rate limit da Meta. Espera progressiva e tenta de novo.
        if e.code in (403, 429) and tentativa < 5:
            espera = 60 * (tentativa + 1)
            print(f"  rate limit ({e.code}) — aguardando {espera}s")
            time.sleep(espera)
            return get(path, params, tentativa + 1)
        # 400 costuma ser token expirado/inválido ou parâmetro errado —
        # mostrar o motivo em vez de estourar sem explicação
        raise RuntimeError(f"Meta {e.code}: {corpo[:500]}")

def insights_mes(desde, ate):
    """Puxa insights por anúncio no intervalo, paginando."""
    linhas = []
    params = {
        'level': 'ad',
        'fields': 'campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,'
                  'spend,impressions,reach,clicks',
        'time_range': json.dumps({'since': desde, 'until': ate}),
        'time_increment': 1,          # 1 linha por dia
        'limit': 200,
    }
    path = f"{ACCOUNT}/insights"
    while True:
        data = get(path, params)
        linhas.extend(data.get('data', []))
        nxt = data.get('paging', {}).get('cursors', {}).get('after')
        if not nxt or not data.get('data'):
            break
        params['after'] = nxt
        time.sleep(1)
    return linhas

def montar(r):
    # `or 0`: o helper comum devolve None em campo vazio, mas impressão e
    # gasto que a Meta não mandou são zero, não desconhecido.
    return {
        'data': r.get('date_start'),
        'conta_id': ACCOUNT,
        'campanha_id': r.get('campaign_id'),
        'campanha_nome': r.get('campaign_name'),
        'adset_id': r.get('adset_id'),
        'adset_nome': r.get('adset_name'),
        'anuncio_id': r.get('ad_id'),
        'anuncio_nome': r.get('ad_name'),
        'impressoes': int(fc.num(r.get('impressions')) or 0),
        'alcance': int(fc.num(r.get('reach')) or 0),
        'cliques': int(fc.num(r.get('clicks')) or 0),
        'gasto': round(fc.num(r.get('spend')) or 0, 2),
    }

def meses(desde, ate):
    d = datetime.strptime(desde, '%Y-%m-%d').date()
    fim = datetime.strptime(ate, '%Y-%m-%d').date()
    while d <= fim:
        prox = (d.replace(day=28) + timedelta(days=4)).replace(day=1)
        yield d.isoformat(), min(prox - timedelta(days=1), fim).isoformat()
        d = prox

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--desde', default=(date.today().replace(day=1) - timedelta(days=31)).isoformat())
    ap.add_argument('--ate', default=date.today().isoformat())
    a = ap.parse_args()

    total = 0
    for ini, fim in meses(a.desde, a.ate):
        linhas = [montar(r) for r in insights_mes(ini, fim)]
        if linhas:
            fc.upsert('fato_meta_insights', linhas, CONFLITO)
            total += len(linhas)
            print(f"  {ini[:7]}: {len(linhas)} linhas")
        time.sleep(3)
    print(f"total: {total} linhas de {a.desde} a {a.ate}")

    # registra status
    try:
        fc.registrar_status('meta_ads', 'Meta Ads', 'ok', registros=total)
    except Exception as e:
        print(f"[aviso] status não registrado: {e}")

if __name__ == '__main__':
    main()
