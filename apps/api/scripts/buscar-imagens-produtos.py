#!/usr/bin/env python3
"""
buscar-imagens-produtos.py
Pesquisa e atualiza imagens dos produtos da Loja que vieram do Omie (sem imagem).

Estratégia em cascata (livros):
  1. Open Library Covers por ISBN/EAN  (gratuita, sem key)
  2. Google Books por ISBN             (gratuita, sem key)
  3. Google Books por título           (gratuita, sem key)
  4. Open Library por título (search)  (gratuita, sem key)
  5. Imagem genérica por categoria     (fallback)

Não-livros: imagem genérica de alta qualidade (Unsplash/Pexels CDN público).

Uso:
  python buscar-imagens-produtos.py --dry-run
  python buscar-imagens-produtos.py
  python buscar-imagens-produtos.py --limite 50
  python buscar-imagens-produtos.py --apenas-genericos   # rápido, sem API
"""
import os, sys, time, json, argparse, urllib.request, urllib.parse, urllib.error

DATABASE_URL = os.environ.get(
    'DATABASE_URL',
    'postgresql://febrahub:fc5340f835f0fb6a2150fa2f04e8486de65424ce3007afb407152bed8cd8c4e1@172.19.0.6:5432/febrahub'
)

try:
    import psycopg2, psycopg2.extras
except ImportError:
    sys.exit("Instale psycopg2: pip install psycopg2-binary --break-system-packages")

UA = 'FebraHub-ImageBot/1.0'
HEADERS = {'User-Agent': UA, 'Accept': 'application/json'}

# ── HTTP helpers ──────────────────────────────────────────────────────────────
def http_get(url, timeout=12):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read()
    except Exception:
        return None

def http_head_img(url, timeout=8):
    """True se a URL retorna 200 com Content-Type image/*."""
    try:
        req = urllib.request.Request(url, method='HEAD', headers={**HEADERS, 'Accept': '*/*'})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            ct = r.headers.get('Content-Type', '')
            return r.status == 200 and 'image' in ct
    except Exception:
        return False

# ── 1. Open Library por ISBN ──────────────────────────────────────────────────
def _ol_cover_url(isbn):
    isbn = (isbn or '').strip().replace('-', '')
    if len(isbn) < 10:
        return None
    return f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg"

def capa_open_library_isbn(isbn):
    url = _ol_cover_url(isbn)
    if not url:
        return None
    # A API devolve 200 + imagem real, ou 404
    try:
        req = urllib.request.Request(url + '?default=false', headers={**HEADERS, 'Accept': 'image/*'})
        with urllib.request.urlopen(req, timeout=12) as r:
            ct = r.headers.get('Content-Type', '')
            if r.status == 200 and 'image' in ct:
                # Descarta imagens de 1×1 px (placeholder)
                length = r.headers.get('Content-Length')
                if length and int(length) < 1000:
                    return None
                return url
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
    except Exception:
        pass
    return None

# ── 2 + 3. Google Books ───────────────────────────────────────────────────────
def capa_google_books(titulo, isbn=None):
    """Tenta ISBN, depois título limpo. Retorna URL de thumbnail ou None."""
    def _buscar(q):
        body = http_get(f"https://www.googleapis.com/books/v1/volumes?q={urllib.parse.quote(q)}&maxResults=5")
        if not body:
            return None
        data = json.loads(body)
        for item in (data.get('items') or []):
            info = item.get('volumeInfo', {})
            imgs = info.get('imageLinks', {})
            url = (imgs.get('extraLarge') or imgs.get('large') or
                   imgs.get('medium')     or imgs.get('thumbnail'))
            if url:
                url = url.replace('http://', 'https://').replace('&edge=curl', '')
                # Tenta zoom maior
                for zoom in ('zoom=1', 'zoom=0'):
                    if zoom in url:
                        url = url.replace(zoom, 'zoom=3')
                        break
                return url
        return None

    if isbn and isbn.strip():
        url = _buscar(f"isbn:{isbn.strip()}")
        if url:
            return url
        time.sleep(0.2)

    # Título limpo: remove " - EDITORA" e partes desnecessárias
    titulo_limpo = titulo.split(' - ')[0].strip()
    # Remove prefixos como "LIVRO - "
    if titulo_limpo.startswith('LIVRO - ') or titulo_limpo.startswith('LIVRO- '):
        titulo_limpo = titulo_limpo[7:].strip()
    url = _buscar(titulo_limpo)
    return url

# ── 4. Open Library por título (search) ──────────────────────────────────────
def capa_open_library_titulo(titulo):
    """Busca no Open Library por título, pega o primeiro com capa."""
    titulo_limpo = titulo.split(' - ')[0].strip()
    if titulo_limpo.upper().startswith('LIVRO'):
        titulo_limpo = titulo_limpo[5:].strip(' -')
    q = urllib.parse.quote(titulo_limpo)
    body = http_get(f"https://openlibrary.org/search.json?title={q}&limit=5&fields=cover_i")
    if not body:
        return None
    data = json.loads(body)
    for doc in (data.get('docs') or []):
        cid = doc.get('cover_i')
        if cid:
            url = f"https://covers.openlibrary.org/b/id/{cid}-L.jpg"
            return url
    return None

# ── Imagens genéricas de boa qualidade ───────────────────────────────────────
GENERICAS_POR_CATEGORIA = {
    'Livros':     'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
    'Apostilas':  'https://images.unsplash.com/photo-1531346680769-a1d79b57de5c?w=400&q=80',
    'Bolsas':     'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80',
    'Camisas':    'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=400&q=80',
    'Bebidas':    'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80',
    'Alimentos':  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
    'Kits':       'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80',
    'Acessórios': 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&q=80',
    'Outros':     'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&q=80',
}

# Imagens específicas por palavra-chave (sobrescreve categoria)
GENERICAS_POR_KEYWORD = [
    # (regex_pattern, url)  — ordem importa, primeiro match ganha
    ('CAFÉ$|^CAFÉ$',                         'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80'),
    ('CHÁ$|^CHÁ$',                           'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80'),
    ('ÁGUA$|ÁGUA COM GÁS',                   'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80'),
    ('ENERGETIC',                             'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=400&q=80'),
    ('CAPPUCCINO|CAPSULA|CÁPSULA',           'https://images.unsplash.com/photo-1512568400610-62da28bc8a13?w=400&q=80'),
    ('ACUCAR|AÇÚCAR|ADOCANTE|ADOÇANTE',     'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80'),
    ('MOCHILA',                               'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80'),
    ('BOLSA',                                 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80'),
    ('CAMISAS DIVERSAS',                      'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=400&q=80'),
    ('CAMISA INFANTIL',                       'https://images.unsplash.com/photo-1519278409-1f56fdda7fe5?w=400&q=80'),
    ('CAMISA POLO',                           'https://images.unsplash.com/photo-1598965402089-897ce52e8355?w=400&q=80'),
    ('CAMISA',                                'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80'),
    ('JAQUETA',                               'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80'),
    ('BONE|BONÉ',                             'https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=400&q=80'),
    ('COLAR',                                 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80'),
    ('PULSEIRA',                              'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&q=80'),
    ('GARRAFA TÉRM',                          'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80'),
    ('GARRAFA',                               'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80'),
    ('COPO',                                  'https://images.unsplash.com/photo-1610824352934-c10d87b700cc?w=400&q=80'),
    ('CADERNO',                               'https://images.unsplash.com/photo-1531346680769-a1d79b57de5c?w=400&q=80'),
    ('PLANNER|AGENDA',                        'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&q=80'),
    ('CARDS',                                 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80'),
    ('BOX|CAIXA KIT',                         'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80'),
    ('CARTÃO DE PRESENTE',                    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80'),
    ('FLOR',                                  'https://images.unsplash.com/photo-1490750967868-88df5691cc44?w=400&q=80'),
    ('CANECA',                                'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80'),
    ('BIBLIA|BÍBLIA',                         'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=400&q=80'),
]

import re as _re

def imagem_generica(nome, categoria):
    n = nome.upper()
    for pattern, url in GENERICAS_POR_KEYWORD:
        if _re.search(pattern, n):
            return url
    return GENERICAS_POR_CATEGORIA.get(categoria, GENERICAS_POR_CATEGORIA['Outros'])

# ── Busca principal ───────────────────────────────────────────────────────────
def buscar_imagem(nome, ean, categoria, apenas_genericos=False):
    """Retorna (url, fonte)."""
    if apenas_genericos:
        return imagem_generica(nome, categoria), 'generica'

    eh_livro = categoria in ('Livros', 'Apostilas') or any(
        w in nome.upper() for w in ('LIVRO', 'HABITOS', 'HÁBITOS', 'PRINCIPIOS', 'PRINCÍPIOS',
                                     'CARDS', 'PLANNER', 'AGENDA', 'BIBLIA', 'BÍBLIA')
    )

    if eh_livro:
        # 1. Open Library por ISBN
        if ean and ean.strip():
            url = capa_open_library_isbn(ean)
            if url:
                return url, 'open_library_isbn'
            time.sleep(0.2)

        # 2. Google Books por ISBN + título
        url = capa_google_books(nome, ean)
        if url:
            return url, 'google_books'
        time.sleep(0.3)

        # 3. Open Library por título
        url = capa_open_library_titulo(nome)
        if url:
            return url, 'open_library_titulo'
        time.sleep(0.2)

    # 4. Genérica
    url = imagem_generica(nome, categoria)
    return (url, 'generica') if url else (None, 'sem_imagem')

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--limite', type=int, default=9999)
    ap.add_argument('--apenas-livros', action='store_true')
    ap.add_argument('--apenas-genericos', action='store_true', help='Sem chamadas de API, só genéricas')
    args = ap.parse_args()

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    filtro = "AND lc.nome IN ('Livros', 'Apostilas')" if args.apenas_livros else ""
    cur.execute(f"""
        SELECT lp.id, lp.nome, lp.produto_estoque_id,
               fo.ean,
               COALESCE(lc.nome, 'Outros') AS categoria
        FROM loja_produtos lp
        LEFT JOIN fato_omie_produto fo ON fo.produto_id = lp.produto_estoque_id
        LEFT JOIN loja_categorias lc ON lc.id = lp.categoria_id
        WHERE lp.imagem_url IS NULL AND lp.ativo = true
          {filtro}
        ORDER BY
            CASE WHEN fo.ean IS NOT NULL AND fo.ean != '' THEN 0 ELSE 1 END,
            lp.nome
        LIMIT %s
    """, (args.limite,))

    produtos = cur.fetchall()
    print(f"Produtos sem imagem: {len(produtos)}\n")

    ok = err = 0
    por_fonte = {}

    for i, p in enumerate(produtos, 1):
        nome, ean, cat, pid = p['nome'], p['ean'] or '', p['categoria'], p['id']
        print(f"[{i}/{len(produtos)}] {nome[:65]}", end=' ', flush=True)

        url, fonte = buscar_imagem(nome, ean, cat, args.apenas_genericos)

        if url:
            print(f"→ {fonte} ✓")
            por_fonte[fonte] = por_fonte.get(fonte, 0) + 1
            if not args.dry_run:
                cur.execute(
                    "UPDATE loja_produtos SET imagem_url=%s, atualizado_em=NOW() WHERE id=%s",
                    (url, pid)
                )
            ok += 1
        else:
            print("→ sem imagem")
            err += 1

        # Rate limit suave entre chamadas API
        if not args.apenas_genericos and i % 5 == 0:
            time.sleep(0.5)

    if not args.dry_run:
        conn.commit()
        print(f"\n✅ {ok} atualizados | {err} sem imagem")
    else:
        print(f"\n[DRY-RUN] {ok} encontrariam imagem | {err} sem imagem")

    print(f"Fontes: {por_fonte}")
    cur.close(); conn.close()

if __name__ == '__main__':
    main()
