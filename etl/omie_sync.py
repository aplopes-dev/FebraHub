"""
FebraHub · omie_sync.py
Puxa vendas da loja (cupons fiscais) e posição de estoque do Omie.

Variáveis de ambiente:
  OMIE_APP_KEY
  OMIE_APP_SECRET
  FEBRAHUB_API_URL
  FEBRAHUB_ETL_TOKEN

Uso:
  python omie_sync.py                      # vendas do último ano + estoque hoje
  python omie_sync.py --desde 01/01/2024   # histórico de vendas
"""
import os, json, time, argparse, urllib.request, urllib.error
from datetime import date, timedelta

import febrahub_cliente as fc

fc.carregar_env()


APP_KEY    = os.environ['OMIE_APP_KEY']
APP_SECRET = os.environ['OMIE_APP_SECRET']

# URLs dos serviços Omie (RPC: POST com app_key/app_secret/call/param)
URL_CUPOM      = 'https://app.omie.com.br/api/v1/produtos/cupomfiscalconsultar/'
URL_ESTOQUE    = 'https://app.omie.com.br/api/v1/estoque/consulta/'
URL_CONTAPAGAR = 'https://app.omie.com.br/api/v1/financas/contapagar/'
URL_PRODUTOS   = 'https://app.omie.com.br/api/v1/geral/produtos/'
URL_CATEGORIAS = 'https://app.omie.com.br/api/v1/geral/categorias/'
URL_CLIENTES   = 'https://app.omie.com.br/api/v1/geral/clientes/'

def omie(url, call, param, tentativa=0):
    """Chamada RPC padrão do Omie, com retry para instabilidade (5xx/425)."""
    body = json.dumps({
        'call': call,
        'app_key': APP_KEY,
        'app_secret': APP_SECRET,
        'param': [param],
    }).encode()
    req = urllib.request.Request(url, data=body,
        headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        corpo = e.read().decode(errors='replace')
        if e.code in (425, 502, 503) and tentativa < 6:
            espera = 20 * (tentativa + 1)
            print(f"  Omie {e.code} — aguardando {espera}s")
            time.sleep(espera)
            return omie(url, call, param, tentativa + 1)
        raise RuntimeError(f"Omie {e.code}: {corpo[:500]}")
    except (urllib.error.URLError, ConnectionError, TimeoutError) as e:
        # queda de conexão / socket -> esperar e tentar de novo
        if tentativa < 6:
            espera = 15 * (tentativa + 1)
            print(f"  conexão caiu ({e}) — aguardando {espera}s e tentando de novo")
            time.sleep(espera)
            return omie(url, call, param, tentativa + 1)
        raise


# Códigos de forma de pagamento do Omie (cIndPag)
FORMAS = {
    '01': 'Dinheiro', '02': 'Cheque', '03': 'Cartão de Crédito',
    '04': 'Cartão de Débito', '05': 'Crédito Loja', '10': 'Vale Alimentação',
    '11': 'Vale Refeição', '12': 'Vale Presente', '13': 'Vale Combustível',
    '15': 'Boleto', '16': 'Depósito', '17': 'PIX', '18': 'Transferência',
    '19': 'Cashback', '90': 'Sem pagamento', '99': 'Outros',
}

def sn(v):  # 'S'/'N' -> bool
    return str(v or '').upper() == 'S'

def num(v):
    """Wrapper do helper comum: aqui vazio é ZERO, não desconhecido —
       cupom sem valor informado vale 0, e a coluna não aceita NULL."""
    return fc.num(v) or 0

# dt_iso ('DD/MM/AAAA' -> ISO) e upsert moraram aqui até a migração;
# hoje vêm de febrahub_cliente, iguais para todos os ETLs.
dt_iso = fc.dt_iso
upsert = fc.upsert

# ---------------- VENDAS (cupons + itens) ----------------
def sync_vendas(desde, ate):
    pagina = 1
    total_cupom = total_item = 0
    while True:
        resp = omie(URL_CUPOM, 'CuponsFiscais', {
            'nPagina': pagina, 'nRegPorPagina': 100,
            'dDtEmissaoDe': desde, 'dDtEmissaoAte': ate,
        })
        cupons = resp.get('cupons', []) or []
        cab, itens = [], []
        for c in cupons:
            h = c.get('cabecalhoCupom', {})
            info = c.get('cabecalhoCupom', {}).get('info', {}) or {}
            # o cancelamento vem no info dos itens/cupom
            it_list = c.get('itensCupom', []) or []
            cancelado = any(sn(i.get('cCupomCancelado')) for i in it_list) if it_list else False
            devolvido = any(sn(i.get('cCupomDevolvido')) for i in it_list) if it_list else False
            cab.append({
                'cupom_id': h.get('nIdCupom'),
                'numero_cupom': h.get('nNumCupom'),
                'serie': h.get('nSerieCupom'),
                'chave': h.get('cChaveCupom'),
                'data_emissao': dt_iso(h.get('dDtEmissaoCupom')),
                'valor': num(h.get('nValorCupom')),
                'cliente_id': h.get('idCliente'),
                'vendedor_id': h.get('idVendedor'),
                'cancelado': cancelado,
                'devolvido': devolvido,
            })
            for i in it_list:
                itens.append({
                    'cupom_id': h.get('nIdCupom'),
                    'seq_item': i.get('nSequencia') or i.get('seqItem'),
                    'produto_id': i.get('idProduto'),
                    'descricao': i.get('xProd'),
                    'quantidade': num(i.get('nQuant')),
                    'valor_unitario': num(i.get('vUnit')),
                    'valor_item': num(i.get('vItem')),
                    'quantidade_dev': num(i.get('nQuantDev')),
                    'cancelado': sn(i.get('cItemCancelado')),
                })
        upsert('fato_loja_cupom', cab, 'cupom_id')
        upsert('fato_loja_item', [i for i in itens if i['seq_item'] is not None], 'cupom_id,seq_item')
        total_cupom += len(cab); total_item += len(itens)
        tot_pag = resp.get('nTotPaginas', 1)
        print(f"  cupons página {pagina}/{tot_pag}: {len(cab)} cupons, {len(itens)} itens")
        if pagina >= tot_pag: break
        pagina += 1
        time.sleep(1)
    print(f"vendas: {total_cupom} cupons, {total_item} itens")


# ---------------- PAGAMENTOS (formas de pagamento dos cupons) ----------------
def sync_pagamentos(desde, ate):
    pagina = 1
    total = 0
    while True:
        resp = omie(URL_CUPOM, 'CuponsPagamentos', {
            'nPagina': pagina, 'nRegPorPagina': 100,
            'dDtEmisDe': desde, 'dDtEmisAte': ate,
        })
        pgs = resp.get('pagamentos', []) or []
        linhas = []
        vistos = {}
        for p in pgs:
            # o Omie devolve o código em cMeioPag; cIndPag costuma vir vazio
            cod = str(p.get('cMeioPag') or p.get('cIndPag') or '').strip()
            cod = cod.zfill(2) if cod else ''
            cid = p.get('nIdCupom')
            # seqItem repete no mesmo cupom -> gerar sequência própria
            vistos[cid] = vistos.get(cid, 0) + 1
            linhas.append({
                'cupom_id': cid,
                'seq_item': vistos[cid],
                'forma_codigo': cod,
                'forma': FORMAS.get(cod, 'Outros'),
                'meio_codigo': p.get('cMeioPag'),
                'bandeira': p.get('cBandeira') or p.get('cTpBandeira'),
                'parcelas': p.get('nParcelaTEF') or p.get('nParcelaPOS'),
                'valor': num(p.get('nValorItem') or p.get('nValorDocumento')),
                'data_transacao': dt_iso(p.get('dTransacao') or p.get('dDtEmissaoCupom')),
                'nsu': p.get('NSU'),
            })
        linhas = [l for l in linhas if l['cupom_id'] is not None]
        upsert('fato_loja_pagamento', linhas, 'cupom_id,seq_item')
        total += len(linhas)
        tot_pag = resp.get('nTotPaginas', 1)
        print(f"  pagamentos página {pagina}/{tot_pag}: {len(linhas)} registros")
        if pagina >= tot_pag: break
        pagina += 1
        time.sleep(1)
    print(f"pagamentos: {total} registros")

# ---------------- ESTOQUE (posição) ----------------
def sync_estoque():
    hoje = date.today().strftime('%d/%m/%Y')
    pagina = 1
    total = 0
    while True:
        resp = omie(URL_ESTOQUE, 'ListarPosEstoque', {
            'nPagina': pagina, 'nRegPorPagina': 100,
            'dDataPosicao': hoje, 'cExibeTodos': 'S',
            'codigo_local_estoque': 0,
        })
        prods = resp.get('produtos', []) or []
        linhas = [{
            'produto_id': p.get('nCodProd'),
            'codigo': p.get('cCodigo'),
            'codigo_interno': p.get('cCodInt'),
            'descricao': p.get('cDescricao'),
            'preco_unitario': num(p.get('nPrecoUnitario')),
            'custo_medio': num(p.get('nCMC')),      # custo médio contábil
            'saldo': num(p.get('nSaldo')),
            'fisico': num(p.get('fisico')),
            'reservado': num(p.get('reservado')),
            'pendente': num(p.get('nPendente')),
            'local_estoque_id': p.get('codigo_local_estoque'),
            'estoque_minimo': num(p.get('estoque_minimo')),
            'data_posicao': dt_iso(hoje),
        } for p in prods if p.get('nCodProd')]
        upsert('fato_loja_estoque', linhas, 'produto_id')
        total += len(linhas)
        tot_pag = resp.get('nTotPaginas', 1)
        print(f"  estoque página {pagina}/{tot_pag}: {len(linhas)} produtos")
        if pagina >= tot_pag: break
        pagina += 1
        time.sleep(1)
    print(f"estoque: {total} produtos")

# ---------------- CADASTROS AUXILIARES (para resolver códigos) ----------------
def _paginar(url, call, chave_lista, param_extra=None, tam=100, campo_pag='pagina',
             campo_reg='registros_por_pagina', campo_totpag='total_de_paginas'):
    """Percorre um serviço paginado do Omie e devolve TODOS os itens da lista."""
    pagina, itens = 1, []
    while True:
        param = {campo_pag: pagina, campo_reg: tam}
        if param_extra:
            param.update(param_extra)
        resp = omie(url, call, param)
        lote = resp.get(chave_lista, []) or []
        itens.extend(lote)
        tot = resp.get(campo_totpag, 1) or 1
        if pagina >= tot or not lote:
            break
        pagina += 1
        time.sleep(0.4)
    return itens

def _mapa_categorias():
    """codigo_categoria -> descrição. Resolve o nome legível da despesa."""
    try:
        cats = _paginar(URL_CATEGORIAS, 'ListarCategorias', 'categoria_cadastro')
        return {c.get('codigo'): (c.get('descricao') or c.get('descricao_padrao'))
                for c in cats if c.get('codigo')}
    except Exception as e:
        print(f"  [aviso] categorias não carregadas ({e}); seguindo só com o código")
        return {}

def _mapa_fornecedores():
    """codigo_cliente -> (nome, documento). Resolve o nome do fornecedor."""
    try:
        cli = _paginar(URL_CLIENTES, 'ListarClientesResumido', 'clientes_cadastro_resumido')
        return {c.get('codigo_cliente'):
                (c.get('nome_fantasia') or c.get('razao_social'), c.get('cnpj_cpf'))
                for c in cli if c.get('codigo_cliente')}
    except Exception as e:
        print(f"  [aviso] fornecedores não carregados ({e}); seguindo só com o código")
        return {}

# ---------------- CONTAS A PAGAR (títulos/despesas) ----------------
STATUS_PAGO = {'PAGO', 'LIQUIDADO', 'RECEBIDO', 'CONCILIADO'}
STATUS_PT = {
    'ATRASADO': 'Vencido', 'A VENCER': 'A vencer', 'AVENCER': 'A vencer',
    'VENCEHOJE': 'Vence hoje', 'VENCE HOJE': 'Vence hoje', 'PAGO': 'Pago',
    'LIQUIDADO': 'Pago', 'CANCELADO': 'Cancelado', 'PENDENTE': 'A vencer',
}

def sync_contas_pagar(desde, ate):
    cats = _mapa_categorias()
    forn = _mapa_fornecedores()
    pagina = 1
    total = 0
    while True:
        resp = omie(URL_CONTAPAGAR, 'ListarContasPagar', {
            'pagina': pagina, 'registros_por_pagina': 100,
            'filtrar_por_data_de': desde, 'filtrar_por_data_ate': ate,
        })
        titulos = resp.get('conta_pagar_cadastro', []) or []
        linhas = []
        for t in titulos:
            info = t.get('info', {}) or {}
            cnab = t.get('cnab_integracao_bancaria', {}) or {}
            cat_cod = t.get('codigo_categoria') or (
                (t.get('categorias') or [{}])[0].get('codigo_categoria'))
            f_id = t.get('codigo_cliente_fornecedor')
            f_nome, f_doc = forn.get(f_id, (None, None))
            status_cru = str(t.get('status_titulo') or '').upper().strip()
            pago = status_cru in STATUS_PAGO
            linhas.append({
                'lancamento_id': t.get('codigo_lancamento_omie'),
                'codigo_integracao': t.get('codigo_lancamento_integracao'),
                'fornecedor_id': f_id,
                'fornecedor': f_nome,
                'fornecedor_documento': f_doc,
                'categoria_codigo': cat_cod,
                'categoria': cats.get(cat_cod),
                'numero_documento': t.get('numero_documento'),
                'numero_doc_fiscal': t.get('numero_documento_fiscal'),
                'tipo_documento': t.get('codigo_tipo_documento'),
                'numero_parcela': t.get('numero_parcela'),
                'forma_pagamento': cnab.get('codigo_forma_pagamento'),
                'conta_corrente_id': t.get('id_conta_corrente'),
                'data_emissao': dt_iso(t.get('data_emissao')),
                'data_entrada': dt_iso(t.get('data_entrada')),
                'data_vencimento': dt_iso(t.get('data_vencimento')),
                'data_previsao': dt_iso(t.get('data_previsao')),
                'data_pagamento': dt_iso(info.get('dAlt')) if pago else None,
                'status': STATUS_PT.get(status_cru, status_cru.title() or None),
                'status_titulo': t.get('status_titulo'),
                'valor': num(t.get('valor_documento')),
                'valor_pago': num(t.get('valor_documento')) if pago else None,
                'observacao': t.get('observacao'),
                'data_alteracao': dt_iso(info.get('dAlt')),
            })
        linhas = [l for l in linhas if l['lancamento_id'] is not None]
        upsert('fato_omie_contas_pagar', linhas, 'lancamento_id')
        total += len(linhas)
        tot_pag = resp.get('total_de_paginas', 1)
        print(f"  contas a pagar página {pagina}/{tot_pag}: {len(linhas)} títulos")
        if pagina >= tot_pag: break
        pagina += 1
        time.sleep(1)
    print(f"contas a pagar: {total} títulos")
    return total

# ---------------- CADASTRO DE PRODUTOS ----------------
def sync_produtos():
    pagina = 1
    total = 0
    while True:
        resp = omie(URL_PRODUTOS, 'ListarProdutos', {
            'pagina': pagina, 'registros_por_pagina': 100,
            'apenas_importado_api': 'N', 'filtrar_apenas_omiepdv': 'N',
        })
        prods = resp.get('produto_servico_cadastro', []) or []
        linhas = []
        for p in prods:
            info = p.get('info', {}) or {}
            linhas.append({
                'produto_id': p.get('codigo_produto'),
                'codigo': p.get('codigo'),
                'codigo_integracao': p.get('codigo_produto_integracao'),
                'descricao': p.get('descricao'),
                'descricao_detalhada': p.get('descr_detalhada'),
                'unidade': p.get('unidade'),
                'ncm': p.get('ncm'),
                'ean': p.get('ean'),
                'cest': p.get('cest'),
                'familia_id': p.get('codigo_familia'),
                'familia': p.get('descricao_familia'),
                'marca': p.get('marca'),
                'modelo': p.get('modelo'),
                'tipo_item': p.get('tipoItem'),
                'valor_unitario': num(p.get('valor_unitario')),
                'quantidade_estoque': num(p.get('quantidade_estoque')),
                'estoque_minimo': num(p.get('estoque_minimo')),
                'peso_liquido': num(p.get('peso_liq')),
                'peso_bruto': num(p.get('peso_bruto')),
                'inativo': sn(p.get('inativo')),
                'bloqueado': sn(p.get('bloqueado')),
                'data_inclusao': dt_iso(info.get('dInc')),
                'data_alteracao': dt_iso(info.get('dAlt')),
            })
        linhas = [l for l in linhas if l['produto_id'] is not None]
        upsert('fato_omie_produto', linhas, 'produto_id')
        total += len(linhas)
        tot_pag = resp.get('total_de_paginas', 1)
        print(f"  produtos página {pagina}/{tot_pag}: {len(linhas)} produtos")
        if pagina >= tot_pag: break
        pagina += 1
        time.sleep(1)
    print(f"produtos: {total} cadastros")
    return total

def registrar_status(ok, total):
    try:
        fc.registrar_status('omie', 'Loja (Omie)', 'ok' if ok else 'erro', registros=total)
    except Exception as e:
        print(f"[aviso] status não registrado: {e}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--desde', default=(date.today()-timedelta(days=365)).strftime('%d/%m/%Y'))
    ap.add_argument('--ate', default=date.today().strftime('%d/%m/%Y'))
    a = ap.parse_args()
    ok = True
    try:
        sync_vendas(a.desde, a.ate)
        sync_pagamentos(a.desde, a.ate)
        sync_estoque()
        sync_contas_pagar(a.desde, a.ate)
        sync_produtos()
    except Exception as e:
        ok = False
        print(f"ERRO: {e}")
    registrar_status(ok, 0)
    if not ok:
        raise SystemExit(1)

if __name__ == '__main__':
    main()
