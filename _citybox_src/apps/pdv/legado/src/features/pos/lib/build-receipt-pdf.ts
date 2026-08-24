import { jsPDF } from 'jspdf';
import { formatCatalogPrice } from '../data/placeholder-catalog-products';
import type { ReceiptData } from '../types/receipt';
import {
  RECEIPT_PAYMENT_METHOD_LABEL,
  formatReceiptDateTime,
} from './receipt-pdf-actions';

const PAGE_W = 80;
const MARGIN_X = 6;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const LINE = 4.2;
const MUTED: [number, number, number] = [115, 115, 115];
const TEXT: [number, number, number] = [23, 23, 23];
const BORDER: [number, number, number] = [229, 229, 229];

function ensureSpace(doc: jsPDF, y: number, need: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + need <= pageH - 8) return y;
  doc.addPage([PAGE_W, 200]);
  return 10;
}

function drawDivider(doc: jsPDF, y: number): number {
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
  return y + 4;
}

function drawRow(
  doc: jsPDF,
  y: number,
  left: string,
  right: string,
  opts?: { bold?: boolean; muted?: boolean; size?: number },
): number {
  const size = opts?.size ?? 8;
  doc.setFontSize(size);
  doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
  doc.setTextColor(...(opts?.muted ? MUTED : TEXT));
  doc.text(left, MARGIN_X, y);
  doc.text(right, PAGE_W - MARGIN_X, y, { align: 'right' });
  return y + LINE;
}

/**
 * Gera o PDF do recibo do PDV (formato térmico ~80mm).
 */
export async function buildReceiptPdf(receipt: ReceiptData): Promise<Blob> {
  const doc = new jsPDF({
    unit: 'mm',
    format: [PAGE_W, 200],
    orientation: 'portrait',
  });

  let y = 10;

  // Cabeçalho da loja
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(MARGIN_X, y, CONTENT_W, 28, 2, 2, 'F');

  doc.setFillColor(51, 51, 51);
  doc.circle(PAGE_W / 2, y + 8, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  const mono = receipt.storeName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase() || 'CB';
  doc.text(mono, PAGE_W / 2, y + 9.1, { align: 'center' });

  doc.setTextColor(...TEXT);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.storeName, PAGE_W / 2, y + 16, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  const addressLines = doc.splitTextToSize(receipt.storeAddress, CONTENT_W - 4);
  doc.text(addressLines, PAGE_W / 2, y + 20.5, { align: 'center' });

  y += 34;

  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(formatReceiptDateTime(receipt.paidAtIso), PAGE_W / 2, y, {
    align: 'center',
  });
  y += 5;
  y = drawDivider(doc, y);

  doc.setFontSize(8);
  doc.setTextColor(...TEXT);
  doc.setFont('helvetica', 'normal');
  doc.text(`ID da transação: #${receipt.orderId}`, MARGIN_X, y);
  y += LINE;
  doc.text(`Atendente: ${receipt.salespersonName}`, MARGIN_X, y);
  y += LINE;
  doc.text(
    `Cliente: ${receipt.customerName ?? 'Consumidor final'}`,
    MARGIN_X,
    y,
  );
  y += 5;
  y = drawDivider(doc, y);

  for (const item of receipt.items) {
    y = ensureSpace(doc, y, 16);
    const optionsTotal = item.selectedOptions.reduce(
      (acc, opt) => acc + opt.priceCents,
      0,
    );
    const unitCents = item.priceCents + optionsTotal;
    const lineTotal = unitCents * item.quantity;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT);
    const nameLines = doc.splitTextToSize(item.name, CONTENT_W);
    doc.text(nameLines, MARGIN_X, y);
    y += nameLines.length * 3.6;

    y = drawRow(
      doc,
      y,
      `${item.quantity} x ${formatCatalogPrice(unitCents)}`,
      formatCatalogPrice(lineTotal),
      { muted: true, size: 7.5 },
    );

    for (const opt of item.selectedOptions) {
      y = ensureSpace(doc, y, 6);
      y = drawRow(
        doc,
        y,
        `  ${opt.valueName}`,
        opt.priceCents > 0 ? formatCatalogPrice(opt.priceCents) : 'Grátis',
        { muted: true, size: 7 },
      );
    }

    if (item.notes) {
      y = ensureSpace(doc, y, 6);
      doc.setFontSize(6.5);
      doc.setTextColor(...MUTED);
      doc.setFont('helvetica', 'italic');
      const noteLines = doc.splitTextToSize(`Obs: ${item.notes}`, CONTENT_W - 2);
      doc.text(noteLines, MARGIN_X + 1, y);
      y += noteLines.length * 3.2;
    }

    y += 2;
  }

  y = ensureSpace(doc, y, 28);
  y = drawDivider(doc, y);

  y = drawRow(doc, y, 'Subtotal', formatCatalogPrice(receipt.subtotalCents), {
    muted: true,
  });
  y = drawRow(doc, y, 'Desconto', formatCatalogPrice(receipt.discountCents), {
    muted: true,
  });
  y = drawRow(doc, y, 'Total', formatCatalogPrice(receipt.totalCents), {
    bold: true,
    size: 10,
  });
  y += 1;
  y = drawRow(
    doc,
    y,
    RECEIPT_PAYMENT_METHOD_LABEL[receipt.paymentMethod],
    formatCatalogPrice(receipt.receivedCents),
    { muted: true },
  );
  y = drawRow(doc, y, 'Troco', formatCatalogPrice(receipt.changeCents), {
    muted: true,
  });

  y += 6;
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.setFont('helvetica', 'normal');
  doc.text('Obrigado pela preferência!', PAGE_W / 2, y, { align: 'center' });

  return doc.output('blob');
}
