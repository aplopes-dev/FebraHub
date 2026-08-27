/**
 * Montagem do TICKET do pedido da Loja (impressora térmica Bematech MP-4200 TH).
 *
 * O ticket é impresso pelo VENDEDOR e vai ANEXADO ao pedido: serve para o
 * PREPARADOR montar o pedido (itens grandes + observações em destaque) e também
 * como RECIBO do CLIENTE (preços, subtotal, desconto, total, pagamento + dados
 * da loja). Não é documento fiscal — a NFC-e tem módulo próprio (fiscal/).
 *
 * ⚠️ PERFIL DA MP-4200 TH (validado no equipamento — ver AGENTS.md):
 * A impressora opera em modo **ESC/Bematech**, NÃO ESC/POS. Portanto:
 *   - Tamanho de fonte = `ESC ! n` (1B 21 n). NÃO usar `GS ! n` (é ESC/POS e sai
 *     impresso como texto literal "!").
 *     bits: 0x08 ênfase(negrito), 0x10 dupla altura, 0x20 dupla largura.
 *   - Corte = `ESC i` (1B 69, corte total). NÃO usar `GS V`.
 *   - Negrito = `ESC E`/`ESC F` (funciona), alinhamento = `ESC a n` (funciona).
 *   - QR Code (`GS ( k`) e código de barras (`GS k`) NÃO funcionam neste modo —
 *     saem como texto. Por isso o ticket é só texto.
 *   - Acentos: transliteramos para ASCII (`semAcento`) — independe de code page,
 *     sempre limpo. (Default do equipamento é CP850, mas não confiamos nele.)
 */

const ESC = 0x1b;

/** Largura em colunas (80mm, fonte A = 48). */
const COLS = 48;

// Atributos do ESC ! n (modo de impressão) — ver manual §"ESC ! n".
const EMPH = 0x08; // negrito/ênfase
const DH = 0x10;   // dupla altura
const DW = 0x20;   // dupla largura

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

class Escritor {
  private buf: number[] = [];

  cmd(...bytes: number[]): this { this.buf.push(...bytes); return this; }
  reset(): this { return this.cmd(ESC, 0x40); }
  /** Code page 850 (default do equipamento) — inofensivo; não dependemos dele. */
  codepage850(): this { return this.cmd(ESC, 0x74, 0x02); }
  alinhar(n: 0 | 1 | 2): this { return this.cmd(ESC, 0x61, n); }
  /** ESC ! n — define ênfase/dupla altura/dupla largura de uma vez. 0 = normal. */
  modo(n: number): this { return this.cmd(ESC, 0x21, n & 0xff); }

  texto(s: string): this {
    const t = semAcento(s);
    for (let i = 0; i < t.length; i++) this.buf.push(t.charCodeAt(i) & 0xff);
    return this;
  }
  nl(n = 1): this { for (let i = 0; i < n; i++) this.buf.push(0x0a); return this; }
  linha(s = ''): this { return this.texto(s).nl(); }

  /** "esquerda ........... direita" preenchendo COLS (largura normal). */
  kv(esq: string, dir: string): this {
    const e = semAcento(esq);
    const d = semAcento(dir);
    const espaco = Math.max(1, COLS - e.length - d.length);
    return this.linha(e + ' '.repeat(espaco) + d);
  }
  regua(ch = '='): this { return this.linha(ch.repeat(COLS)); }

  /** Quebra "prefixo + nome" em várias linhas de no máx `largura` colunas,
   *  indentando as continuações. Devolve as linhas (sem imprimir). */
  static quebrar(prefixo: string, nome: string, largura: number): string[] {
    const palavras = semAcento(nome).split(/\s+/).filter(Boolean);
    const linhas: string[] = [];
    let l = prefixo;
    for (const p of palavras) {
      if ((l + p).length > largura && l.trim() !== prefixo.trim()) {
        linhas.push(l.replace(/\s+$/, ''));
        l = '   ' + p + ' ';
      } else {
        l += p + ' ';
      }
    }
    linhas.push(l.replace(/\s+$/, ''));
    return linhas;
  }

  cortar(): this { return this.nl(4).cmd(ESC, 0x69); }
  buffer(): Buffer { return Buffer.from(this.buf); }
}

/** Monta o ticket completo do pedido e devolve o buffer ESC/Bema pronto. */
export function montarCupom(d: CupomDados): Buffer {
  const w = new Escritor();
  const endereco = d.endereco ?? 'Av. Manoel Dias da Silva, 1236 - Pituba';
  const telefone = d.telefone ?? '(71) 4104-7677';

  w.reset().codepage850();

  // ---------- MARCA (compacto: sem régua/linhas em branco) ----------
  w.alinhar(1);
  w.modo(EMPH | DW).linha('FEBRACIS').modo(0);
  w.linha(d.operacao);

  // ---------- SENHA na mesma faixa (rótulo + número grande, sem padding) ----------
  if (d.senhaFila != null) {
    w.modo(EMPH).texto('SENHA ').modo(EMPH | DH | DW).texto(String(d.senhaFila).padStart(2, '0')).modo(0).nl();
  }
  w.alinhar(0);
  w.kv(`Pedido #${d.numero}`, formatarData(d.data));
  if (d.clienteNome) w.linha(`Cliente: ${d.clienteNome}`);
  w.regua('-');

  // ---------- ITENS: 1 linha cada (qtd x nome ..... total); obs só quando houver.
  //  Sem a sub-linha de preço unitário (redundante) e sem o rótulo "ITENS". ----------
  for (const it of d.itens) {
    const q = Number(it.quantidade);
    const linhas = Escritor.quebrar(`${q}x `, it.descricao, COLS - 11);
    linhas.forEach((ln, i) => {
      if (i === linhas.length - 1) w.kv(ln, brl(Number(it.total)));
      else w.linha(ln);
    });
    if (it.observacao) w.modo(EMPH).linha(`   >> ${it.observacao}`).modo(0);
  }
  w.regua('-');

  // ---------- TOTAIS (compactos, sem linhas em branco) ----------
  w.kv('Subtotal', brl(Number(d.subtotal)));
  if (Number(d.desconto) > 0) w.kv('Desconto', `- ${brl(Number(d.desconto))}`);
  w.modo(EMPH | DH).kv('TOTAL', brl(Number(d.total))).modo(0);
  if (d.formaPagamento) w.kv('Pagamento', d.formaPagamento);
  w.regua('=');

  // ---------- RODAPÉ enxuto ----------
  w.alinhar(1);
  w.linha('Confira os itens na retirada.');
  w.linha(endereco);
  w.linha(`Salvador-BA - ${telefone}`);

  // Corte com feed reduzido (2 linhas em vez de 4) — economiza papel.
  return w.nl(2).cmd(ESC, 0x69).buffer();
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
