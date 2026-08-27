import { jsPDF } from "jspdf";
import {
  formatCurrencyBRL,
  formatPurchasedAt,
  computePurchaseTotal,
} from "@/features/purchases/lib/purchase-form-values";
import {
  PURCHASE_LINE_STATUS_LABELS,
  PURCHASE_STATUS_LABELS,
  type PurchaseDetail,
} from "@/features/purchases/types/purchase";

const MARGIN_X = 14;
const MUTED: [number, number, number] = [100, 100, 100];
const TEXT: [number, number, number] = [30, 30, 30];
const BORDER: [number, number, number] = [220, 220, 220];

export function buildPurchasePdfFileName(purchase: PurchaseDetail): string {
  return `compra-${purchase.id}.pdf`;
}

function productLabel(line: PurchaseDetail["lines"][number]): string {
  return `${line.productName} (${line.productSku})`;
}

export async function buildPurchasePdf(
  purchase: PurchaseDetail,
): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN_X * 2;
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...TEXT);
  doc.text(`Compra ${purchase.id}`, MARGIN_X, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    `Gerado em ${new Date().toLocaleString("pt-BR")} · Status: ${PURCHASE_STATUS_LABELS[purchase.deliveryStatus]}`,
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
  const infoLines = [
    `Fornecedor: ${purchase.supplierName}`,
    `Estoque: ${purchase.warehouseName}`,
    `Data da compra: ${formatPurchasedAt(purchase.purchasedAt)}`,
    `Série: ${purchase.series.trim() || "—"}`,
    `Número da NF: ${purchase.invoiceNumber.trim() || "—"}`,
    `Observações: ${purchase.notes.trim() || "—"}`,
  ];
  for (const line of infoLines) {
    doc.text(line, MARGIN_X, y);
    y += 5;
  }
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Produtos", MARGIN_X, y);
  y += 6;

  const cols = [
    { header: "Produto", width: 78 },
    { header: "Status", width: 28 },
    { header: "Qtd", width: 18 },
    { header: "Custo", width: 28 },
    { header: "Total", width: 30 },
  ] as const;

  const drawHeader = () => {
    doc.setFillColor(243, 244, 246);
    doc.rect(MARGIN_X, y - 4, contentWidth, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT);
    let x = MARGIN_X + 1;
    for (const col of cols) {
      doc.text(col.header, x, y);
      x += col.width;
    }
    y += 8;
  };

  drawHeader();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  for (const line of purchase.lines) {
    if (y > 270) {
      doc.addPage();
      y = 18;
      drawHeader();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
    }

    const name = productLabel(line);
    const truncated =
      name.length > 42 ? `${name.slice(0, 39)}...` : name;
    const lineTotal = line.quantity * line.costPrice;
    const values = [
      truncated,
      PURCHASE_LINE_STATUS_LABELS[line.status],
      String(line.quantity),
      formatCurrencyBRL(line.costPrice),
      formatCurrencyBRL(lineTotal),
    ];

    let x = MARGIN_X + 1;
    doc.setTextColor(...TEXT);
    values.forEach((value, index) => {
      const col = cols[index];
      if (index >= 3) {
        doc.text(value, x + col.width - 2, y, { align: "right" });
      } else {
        doc.text(value, x, y);
      }
      x += col.width;
    });

    y += 2;
    doc.setDrawColor(...BORDER);
    doc.line(MARGIN_X, y + 2, MARGIN_X + contentWidth, y + 2);
    y += 7;
  }

  if (purchase.lines.length === 0) {
    doc.setTextColor(...MUTED);
    doc.text("Nenhum produto nesta compra.", MARGIN_X, y);
    y += 8;
  }

  y += 4;
  if (y > 250) {
    doc.addPage();
    y = 18;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT);
  doc.text("Totais", MARGIN_X, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const total = computePurchaseTotal(purchase.lines, purchase.extras);
  const totals = [
    `Frete: ${formatCurrencyBRL(purchase.extras.freight)}`,
    `Descontos: ${formatCurrencyBRL(purchase.extras.discounts)}`,
    `Outras despesas: ${formatCurrencyBRL(purchase.extras.otherExpenses)}`,
    `Total da compra: ${formatCurrencyBRL(total)}`,
  ];
  for (const line of totals) {
    doc.text(line, MARGIN_X, y);
    y += 5;
  }

  return doc.output("blob");
}

export function downloadPurchasePdf(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function printPurchasePdf(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  // Nova janela: iframe oculto + blob PDF cancela o diálogo no Chromium
  const printWindow = window.open(url, "_blank");

  if (!printWindow) {
    URL.revokeObjectURL(url);
    throw new Error("POPUP_BLOCKED");
  }

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    URL.revokeObjectURL(url);
  };

  const tryPrint = () => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch {
      // Usuário ainda pode imprimir manualmente na aba aberta
    }
  };

  // Viewer de PDF não dispara `load` de forma confiável
  window.setTimeout(tryPrint, 500);

  const onAfterPrint = () => {
    printWindow.removeEventListener("afterprint", onAfterPrint);
    window.setTimeout(() => {
      printWindow.close();
      cleanup();
    }, 300);
  };
  printWindow.addEventListener("afterprint", onAfterPrint);

  const poll = window.setInterval(() => {
    if (printWindow.closed) {
      window.clearInterval(poll);
      cleanup();
    }
  }, 500);
}
