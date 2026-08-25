/**
 * Gera o comprovante (cupom) em HTML pronto para impressao em bobina termica
 * (58mm/80mm) ou papel comum. HTML porque: zero dependencia nativa, imprime em
 * qualquer navegador/impressora, e o cupom NAO fiscal precisa funcionar ja,
 * sem depender de SEFAZ nem de lib de PDF.
 *
 * O mesmo layout serve depois para reimprimir a DANFCE (cupom fiscal), so
 * acrescentando o bloco fiscal (chave de acesso, protocolo, QR Code).
 */

export interface EmitenteComprovante {
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj?: string | null;
  inscricaoEstadual?: string | null;
  endereco?: {
    logradouro?: string;
    numero?: string;
    bairro?: string;
    municipio?: string;
    uf?: string;
    cep?: string;
  } | null;
  telefone?: string | null;
}

export interface ItemComprovante {
  descricao: string;
  quantidade: number;
  precoUnit: number;
  total: number;
}

export interface PagamentoComprovante {
  forma: string;
  valor: number;
  bandeira?: string | null;
  parcelas?: number | null;
}

export interface DadosComprovante {
  emitente: EmitenteComprovante;
  numero: string;
  emitidoEm: Date;
  clienteNome?: string | null;
  clienteDoc?: string | null;
  itens: ItemComprovante[];
  subtotal: number;
  desconto: number;
  total: number;
  pagamentos: PagamentoComprovante[];
  operadorNome?: string | null;
  observacoes?: string | null;
  /** Bloco fiscal (NFC-e autorizada). Ausente => cupom NAO fiscal. */
  fiscal?: {
    chaveAcesso: string;
    protocolo?: string | null;
    serie: number;
    numero: number;
    ambiente: string; // homologacao | producao
    qrCodeDataUrl?: string | null; // <img src> do QR ja renderizado
    urlConsulta?: string | null;
  } | null;
}

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dataHora(d: Date): string {
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Bahia',
  });
}

function formatarCnpj(cnpj?: string | null): string {
  const d = (cnpj ?? '').replace(/\D/g, '');
  if (d.length !== 14) return cnpj ?? '';
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** HTML autocontido (imprimivel). `bobina` = largura estreita p/ termica. */
export function montarComprovanteHtml(
  dados: DadosComprovante,
  formato: 'bobina' | 'a4' = 'bobina',
): string {
  const e = dados.emitente;
  const ender = e.endereco;
  const enderLinha = ender
    ? [
        [ender.logradouro, ender.numero].filter(Boolean).join(', '),
        ender.bairro,
        [ender.municipio, ender.uf].filter(Boolean).join('/'),
        ender.cep,
      ].filter(Boolean).join(' - ')
    : '';

  const larguraBobina = '80mm';
  const isFiscal = Boolean(dados.fiscal);
  const homolog = dados.fiscal?.ambiente === 'homologacao';

  const linhasItens = dados.itens
    .map(
      (i, idx) => `
      <tr class="item">
        <td class="idx">${idx + 1}</td>
        <td class="desc">${esc(i.descricao)}</td>
        <td class="num">${i.quantidade.toLocaleString('pt-BR')}x</td>
        <td class="num">${brl(i.precoUnit)}</td>
        <td class="num total">${brl(i.total)}</td>
      </tr>`,
    )
    .join('');

  const linhasPag = dados.pagamentos
    .map(
      (p) => `
      <tr>
        <td>${esc(p.forma)}${p.bandeira ? ` (${esc(p.bandeira)})` : ''}${p.parcelas && p.parcelas > 1 ? ` ${p.parcelas}x` : ''}</td>
        <td class="num">${brl(p.valor)}</td>
      </tr>`,
    )
    .join('');

  const blocoFiscal = dados.fiscal
    ? `
    <div class="sep"></div>
    <div class="fiscal">
      <div class="fiscal-titulo">DOCUMENTO AUXILIAR DA NOTA FISCAL DE<br/>CONSUMIDOR ELETRONICA — NFC-e</div>
      ${homolog ? '<div class="homolog">*** EMITIDO EM AMBIENTE DE HOMOLOGACAO — SEM VALOR FISCAL ***</div>' : ''}
      <div class="chave-label">Consulte pela Chave de Acesso em:</div>
      <div class="chave">${esc(dados.fiscal.chaveAcesso.replace(/(\d{4})(?=\d)/g, '$1 '))}</div>
      ${dados.fiscal.protocolo ? `<div class="prot">Protocolo de autorizacao: ${esc(dados.fiscal.protocolo)}</div>` : ''}
      <div class="nnf">Serie ${dados.fiscal.serie} · Numero ${dados.fiscal.numero}</div>
      ${dados.fiscal.qrCodeDataUrl ? `<div class="qr"><img src="${dados.fiscal.qrCodeDataUrl}" alt="QR Code NFC-e"/></div>` : ''}
    </div>`
    : `
    <div class="sep"></div>
    <div class="nao-fiscal">*** COMPROVANTE — SEM VALOR FISCAL ***</div>`;

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"/>
<title>Comprovante ${esc(dados.numero)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Courier New", ui-monospace, monospace; color: #000; background: #fff; }
  .cupom {
    width: ${formato === 'bobina' ? larguraBobina : '210mm'};
    ${formato === 'bobina' ? '' : 'max-width: 400px; margin: 12mm auto; border: 1px solid #ccc;'}
    padding: 4mm 3mm; font-size: ${formato === 'bobina' ? '11px' : '12px'}; line-height: 1.35;
  }
  .center { text-align: center; }
  .b { font-weight: bold; }
  .emit-nome { font-weight: bold; font-size: 13px; text-transform: uppercase; }
  .emit-info { font-size: 10px; }
  .sep { border-top: 1px dashed #000; margin: 6px 0; }
  h1 { font-size: 12px; margin: 4px 0; text-align: center; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 0; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; }
  .idx { width: 16px; }
  .item .desc { word-break: break-word; }
  .total { font-weight: bold; }
  .totais td { padding: 1px 0; }
  .totais .grande { font-size: 14px; font-weight: bold; }
  .meta { font-size: 10px; }
  .nao-fiscal, .homolog { text-align: center; font-weight: bold; font-size: 10px; margin: 6px 0; }
  .homolog { color: #b00; }
  .fiscal-titulo { text-align: center; font-weight: bold; font-size: 10px; margin-bottom: 4px; }
  .chave-label { font-size: 9px; text-align: center; }
  .chave { font-size: 10px; text-align: center; word-break: break-all; letter-spacing: .3px; margin: 2px 0; }
  .prot, .nnf { font-size: 9px; text-align: center; }
  .qr { text-align: center; margin-top: 6px; }
  .qr img { width: 130px; height: 130px; }
  .rodape { text-align: center; font-size: 9px; margin-top: 8px; }
  @media print {
    @page { margin: 0; ${formato === 'bobina' ? `size: ${larguraBobina} auto;` : ''} }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cupom { ${formato === 'bobina' ? '' : 'border: none; margin: 0;'} }
  }
</style></head>
<body onload="try{window.focus()}catch(e){}">
<div class="cupom">
  <div class="center emit-nome">${esc(e.nomeFantasia || e.razaoSocial)}</div>
  <div class="center emit-info">
    ${e.nomeFantasia && e.razaoSocial ? `${esc(e.razaoSocial)}<br/>` : ''}
    ${e.cnpj ? `CNPJ ${formatarCnpj(e.cnpj)}` : ''}${e.inscricaoEstadual ? ` · IE ${esc(e.inscricaoEstadual)}` : ''}<br/>
    ${enderLinha ? `${esc(enderLinha)}<br/>` : ''}
    ${e.telefone ? `Tel ${esc(e.telefone)}` : ''}
  </div>

  <div class="sep"></div>
  <h1>${isFiscal ? 'Cupom Fiscal' : 'Comprovante de Venda'}</h1>
  <div class="meta center">
    Nº ${esc(dados.numero)} · ${esc(dataHora(dados.emitidoEm))}
    ${dados.operadorNome ? `<br/>Operador: ${esc(dados.operadorNome)}` : ''}
    ${dados.clienteNome ? `<br/>Cliente: ${esc(dados.clienteNome)}` : ''}
    ${dados.clienteDoc ? ` · Doc: ${esc(dados.clienteDoc)}` : ''}
  </div>

  <div class="sep"></div>
  <table>
    <tr class="b"><td class="idx">#</td><td>Item</td><td class="num">Qtd</td><td class="num">Unit</td><td class="num">Total</td></tr>
    ${linhasItens}
  </table>

  <div class="sep"></div>
  <table class="totais">
    <tr><td>Subtotal</td><td class="num">${brl(dados.subtotal)}</td></tr>
    ${dados.desconto > 0 ? `<tr><td>Desconto</td><td class="num">- ${brl(dados.desconto)}</td></tr>` : ''}
    <tr class="grande"><td>TOTAL</td><td class="num">${brl(dados.total)}</td></tr>
  </table>

  <div class="sep"></div>
  <div class="b">Pagamento</div>
  <table>${linhasPag}</table>

  ${dados.observacoes ? `<div class="sep"></div><div class="meta">Obs.: ${esc(dados.observacoes)}</div>` : ''}

  ${blocoFiscal}

  <div class="rodape">FebraHub · Emitido em ${esc(dataHora(new Date()))}</div>
</div>
</body></html>`;
}
