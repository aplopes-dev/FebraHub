/**
 * Montagem do TICKET do pedido da Loja (impressora térmica Bematech MP-4200 TH).
 *
 * O ticket é impresso pelo VENDEDOR e vai ANEXADO ao pedido: serve para o
 * PREPARADOR montar o pedido e como RECIBO do CLIENTE (itens, subtotal, desconto,
 * total, pagamento + dados da loja). Não é documento fiscal — a NFC-e tem módulo
 * próprio (fiscal/).
 *
 * 🪶 LAYOUT ULTRA-COMPACTO (economia de papel — a loja tem pouca bobina):
 *  - Fonte CONDENSADA (`ESC SI` / 0x0F) → ~64 colunas em 80mm.
 *  - Entrelinha apertada (`ESC 3 n`).
 *  - **TODO o ticket em 2 COLUNAS**: geramos as linhas de conteúdo (cada uma
 *    ≤ CELL) e as distribuímos em duas colunas lado a lado, cortando a altura
 *    do papel pela metade. A leitura é coluna esquerda (de cima a baixo) e depois
 *    a direita.
 *
 * ⚠️ PERFIL DA MP-4200 TH (validado no equipamento — ver AGENTS.md):
 * A impressora opera em modo **ESC/Bematech**, NÃO ESC/POS. Portanto:
 *   - Tamanho de fonte = `ESC ! n` (1B 21 n). NÃO usar `GS ! n` (sai como "!").
 *   - Condensado = `ESC SI` (0x0F); desliga com `DC2` (0x12).
 *   - Entrelinha = `ESC 3 n` (1B 33 n, n/144"); volta ao default com `ESC 2`.
 *   - Corte = `ESC i` (1B 69). NÃO usar `GS V`.
 *   - Negrito `ESC E/F`, alinhamento `ESC a n` funcionam.
 *   - QR/código de barras NÃO funcionam neste modo → ticket é só texto.
 *   - Acentos: transliterados para ASCII (`semAcento`), independe de code page.
 */

const ESC = 0x1b;
const SI = 0x0f;   // condensado ON
const DC2 = 0x12;  // condensado OFF

/** Largura de cada COLUNA (condensado ~64 col; 2×31 + 2 de gutter = 64). */
const CELL = 31;
/** Espaço entre as duas colunas. */
const GUTTER = 2;

/** Remove acentos/caracteres não-ASCII (a térmica em ESC/Bema imprime lixo p/ UTF-8). */
function semAcento(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x00-\x7f]/g, '');
}

const brl = (n: number) => `R$ ${Number(n).toFixed(2).replace('.', ',')}`;

export interface CupomItem {
  descricao: string;
  quantidade: number;
  precoUnit: number;
  total: number;
  observacao?: string;
}

export interface CupomDados {
  operacao: string;
  numero: number;
  senhaFila?: number | null;
  clienteNome?: string;
  itens: CupomItem[];
  subtotal: number;
  desconto: number;
  total: number;
  formaPagamento?: string | null;
  data: Date;
  /** Rodapé (loja) — configurável por env; default = Pituba/Salvador. */
  endereco?: string;
  telefone?: string;
}

// ---------- helpers de conteúdo (produzem strings de no máx CELL chars) ----------

/** "esq ....... dir" dentro de uma célula de CELL colunas. */
function kvCell(esq: string, dir: string): string {
  const e = semAcento(esq);
  const d = semAcento(dir);
  const espaco = Math.max(1, CELL - e.length - d.length);
  return (e + ' '.repeat(espaco) + d).slice(0, CELL);
}

/** Centraliza dentro da célula. */
function centro(s: string): string {
  const t = semAcento(s).slice(0, CELL);
  const pad = Math.max(0, Math.floor((CELL - t.length) / 2));
  return ' '.repeat(pad) + t;
}

/** Régua da largura da célula. */
function regua(ch: string): string {
  return ch.repeat(CELL);
}

/**
 * Quebra "prefixo + nome" em várias linhas de no máx CELL colunas, indentando
 * as continuações. Na ÚLTIMA linha encaixa o preço à direita (kv) se couber;
 * senão, o preço vai numa linha própria alinhada à direita.
 */
function linhasItem(it: CupomItem): string[] {
  const q = Number(it.quantidade);
  const preco = brl(Number(it.total));
  const palavras = semAcento(it.descricao).split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let l = `${q}x `;
  for (const p of palavras) {
    if ((l + p).length > CELL && l.trim() !== `${q}x`) {
      linhas.push(l.replace(/\s+$/, ''));
      l = '  ' + p + ' ';
    } else {
      l += p + ' ';
    }
  }
  const ultima = l.replace(/\s+$/, '');
  // Tenta encaixar o preço na última linha; se não couber, preço em linha própria.
  if (ultima.length + 1 + preco.length <= CELL) {
    linhas.push(kvCell(ultima, preco));
  } else {
    linhas.push(ultima.slice(0, CELL));
    linhas.push(kvCell('', preco));
  }
  if (it.observacao) linhas.push(('  >> ' + semAcento(it.observacao)).slice(0, CELL));
  return linhas;
}

/** Monta a lista completa de linhas de conteúdo do ticket (cada uma ≤ CELL). */
function linhasConteudo(d: CupomDados): string[] {
  const endereco = d.endereco ?? 'Av. Manoel Dias da Silva, 1236 - Pituba';
  const telefone = d.telefone ?? '(71) 4104-7677';
  const L: string[] = [];

  // Cabeçalho / identificação.
  L.push(centro('FEBRACIS'));
  L.push(centro(d.operacao));
  if (d.senhaFila != null) L.push(centro(`SENHA ${String(d.senhaFila).padStart(2, '0')}`));
  L.push(regua('-'));
  L.push(kvCell(`Pedido #${d.numero}`, formatarData(d.data)));
  if (d.clienteNome) L.push(('Cliente: ' + semAcento(d.clienteNome)).slice(0, CELL));
  L.push(regua('-'));

  // Itens.
  for (const it of d.itens) L.push(...linhasItem(it));
  L.push(regua('-'));

  // Totais.
  L.push(kvCell('Subtotal', brl(Number(d.subtotal))));
  if (Number(d.desconto) > 0) L.push(kvCell('Desconto', `- ${brl(Number(d.desconto))}`));
  L.push(kvCell('TOTAL', brl(Number(d.total))));
  if (d.formaPagamento) L.push(kvCell('Pagamento', semAcento(d.formaPagamento)));
  L.push(regua('='));

  // Rodapé.
  L.push(centro('Confira na retirada.'));
  // Endereço pode passar de CELL → quebra em pedaços centralizados.
  for (const parte of quebrarCentro(endereco)) L.push(parte);
  L.push(centro(`Salvador-BA - ${telefone}`));

  return L;
}

/** Quebra um texto longo em linhas centralizadas de no máx CELL chars. */
function quebrarCentro(texto: string): string[] {
  const palavras = semAcento(texto).split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let l = '';
  for (const p of palavras) {
    if ((l + ' ' + p).trim().length > CELL) {
      if (l) linhas.push(centro(l.trim()));
      l = p;
    } else {
      l = (l + ' ' + p).trim();
    }
  }
  if (l) linhas.push(centro(l.trim()));
  return linhas;
}

/** Monta o ticket em 2 COLUNAS e devolve o buffer ESC/Bema pronto. */
export function montarCupom(d: CupomDados): Buffer {
  const linhas = linhasConteudo(d);

  // Distribui em 2 colunas balanceadas por número de linhas. A esquerda leva a
  // primeira metade (arredondando p/ cima) — assim o cabeçalho fica no topo-esq.
  const metade = Math.ceil(linhas.length / 2);
  const colEsq = linhas.slice(0, metade);
  const colDir = linhas.slice(metade);
  const linhasTotais = Math.max(colEsq.length, colDir.length);

  const buf: number[] = [];
  const push = (...b: number[]) => buf.push(...b);
  const escrever = (s: string) => { for (let i = 0; i < s.length; i++) buf.push(s.charCodeAt(i) & 0xff); };

  push(ESC, 0x40);        // reset
  push(ESC, 0x74, 0x02);  // code page 850 (inofensivo)
  push(ESC, 0x33, 16);    // ESC 3 16 — entrelinha apertada
  push(SI);               // condensado ON
  push(ESC, 0x61, 0);     // alinhar à esquerda

  for (let i = 0; i < linhasTotais; i++) {
    const a = (colEsq[i] ?? '').padEnd(CELL);
    const b = colDir[i] ?? '';
    escrever(a + ' '.repeat(GUTTER) + b);
    push(0x0a);
  }

  push(DC2);              // condensado OFF (limpa estado)
  push(ESC, 0x32);        // ESC 2 — entrelinha default de volta
  push(0x0a);             // 1 linha de folga
  push(ESC, 0x69);        // corte total

  return Buffer.from(buf);
}

/** dd/mm/aaaa HH:MM no fuso de São Paulo. */
function formatarData(dt: Date): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(dt).replace(',', '');
  } catch {
    return dt.toISOString();
  }
}
