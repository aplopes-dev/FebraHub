import { InvalidAttachmentFileError } from '../errors/invalid-attachment-file.error';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff]);
const RIFF = Buffer.from([0x52, 0x49, 0x46, 0x46]);
const WEBP = Buffer.from([0x57, 0x45, 0x42, 0x50]);
const PDF = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF

const ALLOWED = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
]);
/** D14 de research.md — 5MB por arquivo, PDF ou imagem. */
const MAX_BYTES = 5 * 1024 * 1024;

const EXTENSION_BY_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

function startsWith(buf: Buffer, sig: Buffer): boolean {
  return buf.length >= sig.length && buf.subarray(0, sig.length).equals(sig);
}

function detectMimeFromBuffer(buffer: Buffer): string | null {
  if (!buffer?.length) return null;
  if (startsWith(buffer, PDF)) return 'application/pdf';
  if (startsWith(buffer, PNG)) return 'image/png';
  if (startsWith(buffer, JPEG)) return 'image/jpeg';
  if (
    buffer.length >= 12 &&
    startsWith(buffer, RIFF) &&
    buffer.subarray(8, 12).equals(WEBP)
  ) {
    return 'image/webp';
  }
  return null;
}

function normalizeDeclaredMime(mime: string): string {
  return mime === 'image/jpg' ? 'image/jpeg' : mime;
}

export type ValidatedAttachmentFile = {
  mimeType: string;
  extension: string;
};

/**
 * Molde de `ImageFileValidator` (catálogo), estendido para aceitar também PDF
 * e com teto de 5MB (D14 de research.md) — mesma mecânica de checar a
 * assinatura binária (magic bytes), não confiar só no `mimetype` declarado.
 */
export class AttachmentFileValidator {
  static validate(
    buffer: Buffer,
    declaredMime: string,
  ): ValidatedAttachmentFile {
    if (!buffer?.length) {
      throw new InvalidAttachmentFileError(
        AttachmentFileValidator.name,
        'empty',
      );
    }
    if (buffer.length > MAX_BYTES) {
      throw new InvalidAttachmentFileError(
        AttachmentFileValidator.name,
        'too_large',
      );
    }

    const detected = detectMimeFromBuffer(buffer);
    if (!detected) {
      throw new InvalidAttachmentFileError(
        AttachmentFileValidator.name,
        'signature',
      );
    }

    const normalized = normalizeDeclaredMime(declaredMime);
    if (!ALLOWED.has(normalized)) {
      throw new InvalidAttachmentFileError(
        AttachmentFileValidator.name,
        'mime',
      );
    }
    if (detected !== normalized) {
      throw new InvalidAttachmentFileError(
        AttachmentFileValidator.name,
        'mismatch',
      );
    }

    return { mimeType: detected, extension: EXTENSION_BY_MIME[detected] };
  }
}
