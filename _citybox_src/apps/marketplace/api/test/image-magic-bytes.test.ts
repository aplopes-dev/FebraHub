import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  detectImageMimeFromBuffer,
  validateProfileImageBuffer,
} from '../src/common/image-magic-bytes.js';

describe('image-magic-bytes', () => {
  it('detecta PNG', () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    assert.equal(detectImageMimeFromBuffer(buf), 'image/png');
  });

  it('rejeita polyglot com MIME mentiroso', () => {
    const buf = Buffer.from('%PDF-1.4 fake');
    assert.throws(
      () => validateProfileImageBuffer(buf, 'image/png'),
      /INVALID_IMAGE_SIGNATURE/,
    );
  });

  it('rejeita mismatch entre bytes e header', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    assert.throws(
      () => validateProfileImageBuffer(png, 'image/jpeg'),
      /MIME_MISMATCH/,
    );
  });
});
