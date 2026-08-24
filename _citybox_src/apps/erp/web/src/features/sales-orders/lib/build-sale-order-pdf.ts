import { jsPDF } from "jspdf";
import { SALE_ORDER_STATUS_LABELS } from "@/features/sales-orders/lib/sale-order-status";
import { formatSaleOrderAmount } from "@/features/sales-orders/services/sale-order-list.service";
import type { SaleOrder } from "@/features/sales-orders/types/sale-order";

const MARGIN_X = 14;
const MUTED: [number, number, number] = [100, 100, 100];
const TEXT: [number, number, number] = [30, 30, 30];

export function buildSaleOrderPdfFileName(order: SaleOrder): string {
  return `pedido-${order.number}.pdf`;
}

export async function buildSaleOrderPdf(
  order: SaleOrder,
  options?: { includeValues?: boolean },
): Promise<Blob> {
  const includeValues = options?.includeValues ?? true;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...TEXT);
  doc.text(`Pedido #${order.number}`, MARGIN_X, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    `Gerado em ${new Date().toLocaleString("pt-BR")} · Status: ${SALE_ORDER_STATUS_LABELS[order.status]}`,
    MARGIN_X,
    y,
  );
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT);
  doc.text("Informações", MARGIN_X, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const info = [
    `Cliente: ${order.customerName}`,
    `Criado por: ${order.createdBy}`,
    `Canal: ${order.channelId}`,
    `Criado em: ${new Date(order.createdAt).toLocaleString("pt-BR")}`,
    includeValues
      ? `Total: ${formatSaleOrderAmount(order.totalAmount)}`
      : "Total: —",
  ];
  for (const line of info) {
    doc.text(line, MARGIN_X, y);
    y += 5;
  }
  y += 4;

  if (order.lines?.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Itens", MARGIN_X, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const line of order.lines) {
      const price = includeValues
        ? formatSaleOrderAmount(line.unitPrice * line.quantity)
        : "—";
      doc.text(
        `${line.productId} · qtd ${line.quantity} · ${price}`,
        MARGIN_X,
        y,
      );
      y += 5;
      if (y > 270) {
        doc.addPage();
        y = 18;
      }
    }
  }

  if (order.notes) {
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Observações", MARGIN_X, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(order.notes, MARGIN_X, y, { maxWidth: 180 });
  }

  return doc.output("blob");
}

export function downloadSaleOrderPdf(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function printSaleOrderPdf(
  order: SaleOrder,
  options?: { includeValues?: boolean },
): Promise<void> {
  const blob = await buildSaleOrderPdf(order, options);
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.addEventListener("load", () => {
      win.focus();
      win.print();
    });
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
