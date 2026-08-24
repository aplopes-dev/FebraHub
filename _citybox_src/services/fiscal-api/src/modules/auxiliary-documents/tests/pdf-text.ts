import {
  decodePDFRawStream,
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFFlateStream,
  PDFName,
  PDFRawStream,
  PDFRef,
  type PDFPage,
} from 'pdf-lib';

/// Extração de texto de PDF — **só para testes**.
///
/// Existe porque a asserção que importa nesta feature é sobre o CONTEÚDO do
/// documento, não sobre o código de status. Esta base já pagou por confundir os
/// dois: uma substituição de NFS-e passou por 14/14 verificações enquanto
/// estava quebrada, porque as asserções só conferiam HTTP 201. Um `200`
/// devolvendo PDF corrompido é exatamente o mesmo risco.
///
/// **Por que não uma biblioteca de extração.** Três foram avaliadas e todas
/// custavam mais do que resolviam:
///
/// - `pdf-parse` puxa `@napi-rs/canvas` — binário nativo, contra a premissa do
///   plano de não trazer compilação nativa.
/// - `pdfjs-dist@6` é ESM-only; num projeto CJS o `import()` vira `require()` e
///   quebra, e o sandbox do Jest recusa import dinâmico sem
///   `--experimental-vm-modules`. Habilitar isso mexeria na configuração de
///   todo o serviço por causa de um utilitário de teste.
/// - `pdfjs-dist@3` (último com build CJS) puxa `canvas` — nativo de novo.
///
/// A saída é decodificar os content streams com `pdf-lib`, que já é dependência
/// de produção. Menos dependência, nenhuma mudança de runner.

// ---------------------------------------------------------------------------
// Decodificação de streams
// ---------------------------------------------------------------------------

/// Um PDF estampado tem os DOIS tipos de stream no mesmo `Contents`: o
/// original, que veio parseado do arquivo de entrada (`PDFRawStream`), e o que
/// o pdf-lib acrescentou ao desenhar a marca (`PDFFlateStream`). Ler só um dos
/// tipos devolveria metade do documento — e daria a impressão de que a marca
/// não foi aplicada.
function decodeStream(document: PDFDocument, value: unknown): string {
  const resolved =
    value instanceof PDFRef ? document.context.lookup(value) : value;

  if (resolved instanceof PDFRawStream) {
    return Buffer.from(decodePDFRawStream(resolved).decode()).toString(
      'latin1',
    );
  }

  if (resolved instanceof PDFFlateStream) {
    return Buffer.from(resolved.getUnencodedContents()).toString('latin1');
  }

  return '';
}

// ---------------------------------------------------------------------------
// ToUnicode: de código de glifo para caractere
// ---------------------------------------------------------------------------

/// ⚠️ O ponto que fez este utilitário existir na forma atual.
///
/// Quando a fonte é embutida como subset — o que a biblioteca de DANFE faz —,
/// os códigos escritos no content stream são **índices de glifo**, não
/// caracteres. Ler `<0024>` como ASCII devolve lixo, e a primeira versão deste
/// arquivo devolvia exatamente isso.
///
/// O próprio PDF carrega a tradução, no `ToUnicode` de cada fonte: é o que
/// permite copiar texto de um PDF no leitor. Sem interpretá-lo, nenhum teste
/// conseguiria afirmar que a chave de acesso está impressa no DANFE.
type UnicodeMap = Map<number, string>;

function hexToString(hex: string): string {
  const clean = hex.replace(/\s+/g, '');
  let out = '';
  // UTF-16BE: dois bytes por caractere no destino do CMap.
  for (let i = 0; i + 3 < clean.length + 1; i += 4) {
    const unit = clean.slice(i, i + 4);
    if (unit.length < 4) break;
    out += String.fromCharCode(parseInt(unit, 16));
  }
  return out;
}

function parseToUnicode(cmap: string): UnicodeMap {
  const map: UnicodeMap = new Map();

  const charSections = cmap.match(/beginbfchar([\s\S]*?)endbfchar/g) ?? [];
  for (const section of charSections) {
    const pairs = section.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g) ?? [];
    for (const pair of pairs) {
      const [src, dst] = pair.match(/<([0-9A-Fa-f]+)>/g) ?? [];
      if (!src || !dst) continue;
      map.set(parseInt(src.slice(1, -1), 16), hexToString(dst.slice(1, -1)));
    }
  }

  // `bfrange` tem DUAS formas, e a especificação admite as duas na mesma
  // seção:
  //   <lo> <hi> <inicio>              — destinos consecutivos
  //   <lo> <hi> [<d0> <d1> ... <dN>]  — destinos arbitrários, um por código
  //
  // A biblioteca de DANFE emite a segunda (subset de fonte não produz faixa
  // contígua). Tratar só a primeira devolvia índice de glifo cru, que é o que
  // fazia o teste ver "NOPQ..." onde está escrito o nome do emitente.
  const rangeSections = cmap.match(/beginbfrange([\s\S]*?)endbfrange/g) ?? [];
  for (const section of rangeSections) {
    const rows =
      section.matchAll(
        /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(?:\[([\s\S]*?)\]|<([0-9A-Fa-f]+)>)/g,
      ) ?? [];

    for (const [, rawLo, rawHi, arrayForm, startForm] of rows) {
      if (!rawLo || !rawHi) continue;
      const lo = parseInt(rawLo, 16);
      const hi = parseInt(rawHi, 16);

      if (arrayForm !== undefined) {
        const destinations = arrayForm.match(/<([0-9A-Fa-f]*)>/g) ?? [];
        destinations.forEach((destination, offset) => {
          map.set(lo + offset, hexToString(destination.slice(1, -1)));
        });
        continue;
      }

      if (startForm === undefined) continue;
      const start = parseInt(startForm, 16);
      for (let code = lo; code <= hi && code - lo < 0xffff; code += 1) {
        map.set(code, String.fromCharCode(start + (code - lo)));
      }
    }
  }

  return map;
}

/// Mapas por nome de fonte (`/F1`, `/Helvetica-Bold-123`), porque uma página
/// mistura fontes e cada uma tem a sua tabela.
function fontMapsOf(
  document: PDFDocument,
  page: PDFPage,
): Map<string, UnicodeMap> {
  const maps = new Map<string, UnicodeMap>();

  const resources = page.node.Resources();
  const fonts = resources?.lookupMaybe(PDFName.of('Font'), PDFDict);
  if (!fonts) return maps;

  for (const [name, ref] of fonts.entries()) {
    const font = document.context.lookup(ref);
    if (!(font instanceof PDFDict)) continue;

    const toUnicode = font.get(PDFName.of('ToUnicode'));
    if (!toUnicode) continue;

    const cmap = decodeStream(document, toUnicode);
    if (cmap)
      maps.set(name.asString().replace(/^\//, ''), parseToUnicode(cmap));
  }

  return maps;
}

// ---------------------------------------------------------------------------
// Varredura do content stream
// ---------------------------------------------------------------------------

/// O PDF admite DUAS formas de string: literal `(texto)` e hexadecimal
/// `<48454C4C4F>`. Um documento estampado tem as duas, porque o pdfkit escreve
/// em hexadecimal e o pdf-lib em literal.
const TOKEN =
  /\/([^\s/<>[\]()]+)\s+[\d.]+\s+Tf|\((?:\\.|[^\\()])*\)|<([0-9A-Fa-f\s]*)>/g;

function unescapeLiteral(raw: string): string {
  return raw
    .slice(1, -1)
    .replace(/\\([nrtbf()\\])/g, (_m, ch: string) => {
      const escapes: Record<string, string> = {
        n: '\n',
        r: '\r',
        t: '\t',
        b: '\b',
        f: '\f',
      };
      return escapes[ch] ?? ch;
    })
    .replace(/\\([0-7]{1,3})/g, (_m, oct: string) =>
      String.fromCharCode(parseInt(oct, 8)),
    );
}

/// Traduz uma string do stream para texto, usando o mapa da fonte ATIVA. Sem
/// rastrear qual fonte está ativa (`Tf`), um documento com duas fontes teria
/// metade do texto traduzido pela tabela errada.
function decodeWithFont(raw: string, font: UnicodeMap | undefined): string {
  const isHex = raw.startsWith('<');
  const codes: number[] = [];

  if (isHex) {
    const hex = raw.slice(1, -1).replace(/\s+/g, '');
    // Subset embutido usa 2 bytes por código; fonte simples usa 1. A presença
    // do mapa é o que distingue os dois casos na prática.
    const width = font ? 4 : 2;
    for (let i = 0; i + width <= hex.length; i += width) {
      codes.push(parseInt(hex.slice(i, i + width), 16));
    }
  } else {
    const literal = unescapeLiteral(raw);
    for (let i = 0; i < literal.length; i += 1)
      codes.push(literal.charCodeAt(i));
  }

  return codes
    .map((code) => font?.get(code) ?? String.fromCharCode(code))
    .join('');
}

function textOf(raw: string, fonts: Map<string, UnicodeMap>): string {
  let active: UnicodeMap | undefined;
  let out = '';

  for (const match of raw.matchAll(TOKEN)) {
    const [token, fontName] = match;

    if (fontName !== undefined) {
      active = fonts.get(fontName);
      continue;
    }

    out += decodeWithFont(token, active);
  }

  return out;
}

/// Conteúdo dos **Form XObjects** referenciados pela página.
///
/// ⚠️ Sem isto o extrator enxerga menos do que o leitor de PDF mostra. Quando
/// uma página de outro PDF é embutida (`drawPage` do pdf-lib), o conteúdo dela
/// não entra no content stream da página — vira um XObject, referenciado a
/// partir de `Resources`. É assim que a marca do Citybox chega ao documento.
///
/// Um extrator que ignora XObject reportaria "texto ausente" para algo que está
/// visivelmente lá, e o teste acusaria um defeito que não existe.
function xObjectContentOf(document: PDFDocument, page: PDFPage): string {
  const resources = page.node.Resources();
  const xObjects = resources?.lookupMaybe(PDFName.of('XObject'), PDFDict);
  if (!xObjects) return '';

  const parts: string[] = [];
  for (const [, ref] of xObjects.entries()) {
    const resolved = document.context.lookup(ref);
    // Só `/Form` carrega texto. Um `/Image` decodificado como content stream
    // produziria lixo binário no meio da extração.
    const dict =
      resolved instanceof PDFRawStream || resolved instanceof PDFFlateStream
        ? resolved.dict
        : undefined;
    if (dict?.get(PDFName.of('Subtype'))?.toString() !== '/Form') continue;
    parts.push(decodeStream(document, ref));
  }

  return parts.join(String.fromCharCode(10));
}

function rawContentOf(document: PDFDocument, page: PDFPage): string {
  // `normalize()` converte o `Contents` para a forma de array. A forma de array
  // aparece justamente quando um PDF existente recebe conteúdo apendado — que é
  // o que a estampagem da marca d'água faz.
  page.node.normalize();
  const contents = page.node.Contents();

  if (contents instanceof PDFArray) {
    const parts: string[] = [];
    for (let i = 0; i < contents.size(); i += 1) {
      parts.push(decodeStream(document, contents.get(i)));
    }
    return parts.join('\n');
  }

  return decodeStream(document, contents);
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/// Texto por página. Necessário para provar que a marca d'água chega a
/// **todas** as páginas, e não só à primeira (FR-005) — um documento marcado só
/// na primeira permitiria destacar as demais e usá-las como se valessem.
export async function extractPdfTextPerPage(pdf: Buffer): Promise<string[]> {
  const document = await PDFDocument.load(new Uint8Array(pdf));
  return document.getPages().map((page) => {
    const fonts = fontMapsOf(document, page);
    return (
      textOf(rawContentOf(document, page), fonts) +
      textOf(xObjectContentOf(document, page), fonts)
    );
  });
}

export async function extractPdfText(pdf: Buffer): Promise<string> {
  return (await extractPdfTextPerPage(pdf)).join('\n');
}

export async function countPdfPages(pdf: Buffer): Promise<number> {
  const document = await PDFDocument.load(new Uint8Array(pdf));
  return document.getPageCount();
}
