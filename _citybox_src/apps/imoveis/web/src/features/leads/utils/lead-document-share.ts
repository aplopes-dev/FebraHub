import { toast } from '@citybox/mui/molecules';
import type { LeadDocument } from '../types';
import { getCachedLeadDocumentFile } from './lead-document-file-cache';

function mimeTypeFromFileName(name: string): string {
  if (/\.pdf$/i.test(name)) return 'application/pdf';
  if (/\.docx$/i.test(name)) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (/\.doc$/i.test(name)) return 'application/msword';
  return 'application/octet-stream';
}

export async function resolveLeadDocumentFile(
  doc: LeadDocument,
): Promise<File | null> {
  const cached = getCachedLeadDocumentFile(doc.id);
  if (cached) return cached;

  if (!doc.fileUrl) return null;

  try {
    const response = await fetch(doc.fileUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new File([blob], doc.name, {
      type: blob.type || mimeTypeFromFileName(doc.name),
    });
  } catch {
    return null;
  }
}

export function downloadLeadDocumentFile(file: File): void {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function canShareFiles(files: readonly File[]): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return false;
  }
  if (typeof navigator.canShare !== 'function') return files.length > 0;
  try {
    return navigator.canShare({ files: [...files] });
  } catch {
    return false;
  }
}

export async function shareLeadDocumentFile(input: {
  file: File;
  title?: string;
  text: string;
}): Promise<boolean> {
  if (!canShareFiles([input.file])) return false;

  try {
    await navigator.share({
      title: input.title ?? input.file.name,
      text: input.text,
      files: [input.file],
    });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return true;
    }
    return false;
  }
}

export async function ensureLeadDocumentFile(
  doc: LeadDocument,
): Promise<File | null> {
  const file = await resolveLeadDocumentFile(doc);
  if (file) return file;

  toast.error('Arquivo indisponível para anexo.', {
    description:
      'O documento precisa estar anexado nesta sessão. Envie o arquivo novamente e tente outra vez.',
  });
  return null;
}
