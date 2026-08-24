import { toast } from '@citybox/mui/molecules';
import type { LeadDocument } from '../types';

function isPdfFileName(name: string): boolean {
  return /\.pdf$/i.test(name);
}

export function printLeadDocument(doc: LeadDocument): boolean {
  if (!doc.fileUrl) {
    toast.error('Arquivo indisponível para impressão.', {
      description: 'Salve o lead e tente novamente.',
    });
    return false;
  }

  if (!isPdfFileName(doc.name)) {
    toast.message('Impressão direta só para PDF', {
      description: 'Baixe o DOCX e imprima pelo Word ou converta para PDF.',
    });
    return false;
  }

  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  frame.style.opacity = '0';
  frame.src = doc.fileUrl;
  document.body.appendChild(frame);

  const cleanup = () => {
    frame.remove();
  };

  frame.onload = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch {
      toast.error('Não foi possível abrir a impressão.');
      cleanup();
      return;
    }
    window.setTimeout(cleanup, 60_000);
  };

  frame.onerror = () => {
    toast.error('Não foi possível carregar o documento para impressão.');
    cleanup();
  };

  return true;
}
