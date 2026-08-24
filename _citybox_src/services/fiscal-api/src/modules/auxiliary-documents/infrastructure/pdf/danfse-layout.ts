/// Primitivas de desenho do DANFSe v2.0 (NT 008/2026).
///
/// ⚠️ O modelo oficial (RTC NT-008 v1.02, figura do leiaute) **não tem grade de
/// células**: os campos são apenas rótulo (pequeno, no topo) + valor (abaixo),
/// posicionados em colunas, **sem moldura por campo e sem divisória vertical**.
/// A divisão é só **por tópico** — uma linha horizontal separa cada seção — mais
/// a **célula-título cinza** de cada seção e a **moldura externa** do documento.
/// Cabeçalho e rodapé são a exceção: têm divisórias entre suas 3 colunas.
///
/// Fidelidade **estrutural** (spec 029 R1): mesmas seções, rótulos, ordem e
/// disposição em colunas do modelo; sem perseguir medidas ao pixel.

export const PAGE_WIDTH = 595.28;
export const PAGE_HEIGHT = 841.89;
export const MARGIN = 22;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
export const PAGE_BOTTOM = PAGE_HEIGHT - MARGIN;

export const ROW_HEIGHT = 19;

const LABEL_SIZE = 4.8;
const VALUE_SIZE = 7.5;
const TITLE_SIZE = 6.3;
const LABEL_COLOR = '#000000';
//'#555555';
const LINE_COLOR = '#000000';
const TITLE_FILL = '#E4E4E4';
const PAD = 3;

/// Uma "coluna" de conteúdo — sem moldura própria (a não ser o fundo cinza do
/// título). `weight` divide a largura da linha (default 1).
///
/// - `title` → rótulo de seção com fundo cinza.
/// - `label` + `value` → campo: rótulo pequeno no topo, valor abaixo. `value`
///   ausente ⇒ em branco (só o rótulo), como o template — nunca `0,00` (R3).
export type Cell = {
  label?: string;
  value?: string;
  title?: string;
  weight?: number;
  valueSize?: number;
};

type RowOptions = {
  x?: number;
  width?: number;
  height?: number;
};

/// Desenha uma linha de campos SEM molduras. Só a célula-título ganha fundo
/// cinza. Retorna o novo `y`.
export function fieldsRow(
  doc: PDFKit.PDFDocument,
  y: number,
  cells: Cell[],
  options: RowOptions = {},
): number {
  const x0 = options.x ?? MARGIN;
  const totalWidth = options.width ?? CONTENT_WIDTH;
  const height = options.height ?? ROW_HEIGHT;
  const totalWeight = cells.reduce((sum, cell) => sum + (cell.weight ?? 1), 0);

  let x = x0;
  for (const cell of cells) {
    const w = (totalWidth * (cell.weight ?? 1)) / totalWeight;
    if (cell.title !== undefined) {
      drawTitle(doc, x, y, w, height, cell.title);
    } else {
      drawField(doc, x, y, w, cell);
    }
    x += w;
  }
  return y + height;
}

function drawTitle(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  height: number,
  title: string,
): void {
  doc.rect(x, y, w, height).fillColor(TITLE_FILL).fill();
  doc
    .fillColor('#000000')
    .font('Helvetica-Bold')
    .fontSize(TITLE_SIZE)
    .text(title.toUpperCase(), x + PAD, y + height / 2 - TITLE_SIZE / 2 + 0.5, {
      width: w - PAD * 2,
      lineBreak: false,
      ellipsis: true,
    });
}

function drawField(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  cell: Cell,
): void {
  if (cell.label) {
    doc
      .fillColor(LABEL_COLOR)
      .font('Helvetica-Bold')
      .fontSize(LABEL_SIZE)
      .text(cell.label, x + PAD, y + 2, {
        width: w - PAD * 2,
        lineBreak: false,
        ellipsis: true,
      });
  }
  if (cell.value) {
    doc
      .fillColor('#000000')
      .font('Helvetica')
      .fontSize(cell.valueSize ?? VALUE_SIZE)
      .text(cell.value, x + PAD, y + 9, {
        width: w - PAD * 2,
        lineBreak: false,
        ellipsis: true,
      });
  }
}

/// Bloco de conteúdo que flui (descrição do serviço, informações
/// complementares) — sem moldura própria. Mede a altura do texto.
export function textBlock(
  doc: PDFKit.PDFDocument,
  y: number,
  label: string,
  value: string,
  options: { minHeight?: number; italicLabel?: boolean } = {},
): number {
  const innerWidth = CONTENT_WIDTH - PAD * 2;
  doc.font('Helvetica').fontSize(VALUE_SIZE);
  const valueHeight = value
    ? doc.heightOfString(value, { width: innerWidth })
    : 0;
  const height = Math.max(options.minHeight ?? ROW_HEIGHT, valueHeight + 12);

  if (label) {
    doc
      .fillColor(LABEL_COLOR)
      .font(options.italicLabel ? 'Helvetica-Oblique' : 'Helvetica')
      .fontSize(LABEL_SIZE)
      .text(label, MARGIN + PAD, y + 2, {
        width: innerWidth,
        lineBreak: false,
        ellipsis: true,
      });
  }
  if (value) {
    doc
      .fillColor('#000000')
      .font('Helvetica')
      .fontSize(VALUE_SIZE)
      .text(value, MARGIN + PAD, y + 9, { width: innerWidth });
  }
  return y + height;
}

/// Linha horizontal de largura total — o **separador de tópico** entre seções.
export function topicLine(doc: PDFKit.PDFDocument, y: number): void {
  doc
    .lineWidth(0.5)
    .strokeColor(LINE_COLOR)
    .moveTo(MARGIN, y)
    .lineTo(MARGIN + CONTENT_WIDTH, y)
    .stroke();
}

/// Linha vertical (usada só no cabeçalho e rodapé, que têm 3 colunas com
/// divisória, como no modelo).
export function vLine(
  doc: PDFKit.PDFDocument,
  x: number,
  yTop: number,
  yBottom: number,
): void {
  doc
    .lineWidth(0.5)
    .strokeColor(LINE_COLOR)
    .moveTo(x, yTop)
    .lineTo(x, yBottom)
    .stroke();
}

/// Moldura externa do documento — o único retângulo fechado do leiaute.
export function outerFrame(
  doc: PDFKit.PDFDocument,
  top: number,
  bottom: number,
): void {
  doc
    .lineWidth(0.7)
    .strokeColor(LINE_COLOR)
    .rect(MARGIN, top, CONTENT_WIDTH, bottom - top)
    .stroke();
}

/// Quebra para nova página quando não há espaço para o próximo bloco, evitando
/// cortar uma seção ao meio (SC-005). Retorna o `y` de topo na (eventual) nova
/// página.
export function ensureSpace(
  doc: PDFKit.PDFDocument,
  y: number,
  needed: number,
): number {
  if (y + needed > PAGE_BOTTOM) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}
