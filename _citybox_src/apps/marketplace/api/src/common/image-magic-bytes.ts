const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff]);
const RIFF = Buffer.from([0x52, 0x49, 0x46, 0x46]);
const WEBP = Buffer.from([0x57, 0x45, 0x42, 0x50]);

const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp']);

function startsWith(buf: Buffer, sig: Buffer): boolean {
  return buf.length >= sig.length && buf.subarray(0, sig.length).equals(sig);
}

/** Valida assinatura binária independente do Content-Type informado pelo cliente. */
export function detectImageMimeFromBuffer(buffer: Buffer): string | null {
  if (!buffer?.length) return null;
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

export function validateProfileImageBuffer(buffer: Buffer, declaredMime: string): string {
  const detected = detectImageMimeFromBuffer(buffer);
  if (!detected) {
    throw new Error('INVALID_IMAGE_SIGNATURE');
  }
  const normalized = normalizeDeclaredMime(declaredMime);
  if (!ALLOWED.has(normalized)) {
    throw new Error('INVALID_IMAGE_MIME');
  }
  if (detected !== normalized) {
    throw new Error('MIME_MISMATCH');
  }
  return detected;
}
