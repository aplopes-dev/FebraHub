import { InvalidDocumentFileError } from '../../domain/errors/invalid-document-file.error';

const PDF = Buffer.from([0x25, 0x50, 0x44, 0x46]);
const ZIP = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const OLE2 = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const MAX_BYTES = 15 * 1024 * 1024;
const MAX_NAME_LENGTH = 180;

type Signature = 'pdf' | 'zip' | 'ole2';

function startsWith(buf: Buffer, sig: Buffer): boolean {
  return buf.length >= sig.length && buf.subarray(0, sig.length).equals(sig);
}

function detectSignature(buffer: Buffer): Signature | null {
  if (startsWith(buffer, PDF)) return 'pdf';
  if (startsWith(buffer, ZIP)) return 'zip';
  if (startsWith(buffer, OLE2)) return 'ole2';
  return null;
}

function extensionOf(filename: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(filename.trim());
  return match ? match[1].toLowerCase() : '';
}

/**
 * Valida documentos por assinatura binária — o mime declarado pelo browser é
 * inconsistente para DOC/DOCX, então a extensão é usada para desambiguar
 * containers (ZIP → docx, OLE2 → doc).
 */
export class DocumentFileValidator {
  static readonly maxBytes = MAX_BYTES;

  static validate(buffer: Buffer, filename: string): string {
    if (!buffer?.length) {
      throw new InvalidDocumentFileError(DocumentFileValidator.name, 'empty');
    }
    if (buffer.length > MAX_BYTES) {
      throw new InvalidDocumentFileError(
        DocumentFileValidator.name,
        'too_large',
      );
    }

    const signature = detectSignature(buffer);
    if (!signature) {
      throw new InvalidDocumentFileError(
        DocumentFileValidator.name,
        'signature',
      );
    }

    const extension = extensionOf(filename);
    if (signature === 'pdf') {
      if (extension !== 'pdf') {
        throw new InvalidDocumentFileError(
          DocumentFileValidator.name,
          'extension',
        );
      }
      return 'application/pdf';
    }
    if (signature === 'zip') {
      if (extension !== 'docx') {
        throw new InvalidDocumentFileError(
          DocumentFileValidator.name,
          'extension',
        );
      }
      return DOCX_MIME;
    }
    if (extension !== 'doc') {
      throw new InvalidDocumentFileError(
        DocumentFileValidator.name,
        'extension',
      );
    }
    return 'application/msword';
  }

  /** Remove separadores de caminho e caracteres de controle do nome enviado. */
  static sanitizeName(filename: string): string {
    const base = filename.split(/[\\/]/).pop()?.trim() ?? '';
    // eslint-disable-next-line no-control-regex -- remove caracteres de controle
    const safe = base.replace(/[\u0000-\u001f\u007f]/g, '').trim();
    if (!safe || safe === '.' || safe === '..') {
      throw new InvalidDocumentFileError(DocumentFileValidator.name, 'name');
    }
    return safe.slice(0, MAX_NAME_LENGTH);
  }
}
