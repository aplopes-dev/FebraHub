import type { ReceiptData } from '../types/receipt';
import { PAYMENT_METHOD_LABEL } from '../types/payment';

export function createPdfObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokePdfObjectUrl(url: string | null | undefined): void {
  if (!url) return;
  URL.revokeObjectURL(url);
}

export function printPdfBlob(blob: Blob): void {
  const url = createPdfObjectUrl(blob);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = url;

  const cleanup = () => {
    revokePdfObjectUrl(url);
    iframe.remove();
  };

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) {
      cleanup();
      return;
    }
    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(cleanup, 1_000);
  };

  document.body.append(iframe);
}

export function buildReceiptPdfFileName(orderId: string): string {
  return `recibo-${orderId}.pdf`;
}

export const RECEIPT_PAYMENT_METHOD_LABEL = PAYMENT_METHOD_LABEL;

export function formatReceiptDateTime(iso: string): string {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart} • ${timePart}`;
}

export type { ReceiptData };
