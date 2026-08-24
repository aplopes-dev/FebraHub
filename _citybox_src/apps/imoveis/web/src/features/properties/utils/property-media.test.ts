import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  compressPropertyPhoto,
  isHeicFile,
  isPropertyPhotoFile,
  MAX_PROPERTY_PHOTOS,
  PROPERTY_PHOTO_COMPRESSION_OPTIONS,
  photoProgressLabel,
  propertyPhotosCaption,
} from './property-media';

describe('PROPERTY_PHOTO_COMPRESSION_OPTIONS', () => {
  it('encodes WebP off the main thread under the API 4 MB cap', () => {
    assert.equal(PROPERTY_PHOTO_COMPRESSION_OPTIONS.fileType, 'image/webp');
    assert.equal(PROPERTY_PHOTO_COMPRESSION_OPTIONS.useWebWorker, true);
    assert.ok(PROPERTY_PHOTO_COMPRESSION_OPTIONS.maxSizeMB <= 3.5);
    assert.equal(PROPERTY_PHOTO_COMPRESSION_OPTIONS.maxWidthOrHeight, 1600);
  });
});

describe('propertyPhotosCaption', () => {
  it('states quantity, formats and 4 MB size limit', () => {
    assert.equal(MAX_PROPERTY_PHOTOS, 20);
    const caption = propertyPhotosCaption();
    assert.match(caption, /20 fotos/);
    assert.match(caption, /HEIC/);
    assert.match(caption, /capa/);
    assert.match(caption, /4 MB/);
    assert.match(caption, /otimizados automaticamente/i);
  });
});

describe('isHeicFile', () => {
  it('detects iPhone HEIC by extension even without MIME', () => {
    assert.equal(isHeicFile({ name: 'IMG_0001.HEIC', type: '' }), true);
    assert.equal(isHeicFile({ name: 'foto.heif', type: '' }), true);
    assert.equal(isHeicFile({ name: 'capa.jpg', type: 'image/jpeg' }), false);
  });
});

describe('isPropertyPhotoFile', () => {
  it('accepts HEIC without an image MIME', () => {
    assert.equal(isPropertyPhotoFile({ name: 'IMG.HEIC', type: '' }), true);
    assert.equal(isPropertyPhotoFile({ name: 'doc.pdf', type: 'application/pdf' }), false);
  });
});

describe('photoProgressLabel', () => {
  it('omits the fraction for a single file', () => {
    assert.equal(
      photoProgressLabel({ phase: 'compress', current: 1, total: 1 }),
      'Otimizando…',
    );
  });

  it('shows current/total while uploading several files', () => {
    assert.equal(
      photoProgressLabel({ phase: 'upload', current: 3, total: 12 }),
      'Enviando 3/12',
    );
  });
});

describe('compressPropertyPhoto', () => {
  it('rejects non-image files', async () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    await assert.rejects(() => compressPropertyPhoto(file), /imagem/i);
  });

  it('delegates to the compressor with exported options and a .webp name', async () => {
    const original = new File(['raw-jpeg'], 'fachada.JPG', {
      type: 'image/jpeg',
    });
    const compressedBlob = new File(['webp-bytes'], 'ignored.bin', {
      type: 'image/webp',
    });
    let receivedOptions: { fileType?: string; useWebWorker?: boolean; maxWidthOrHeight?: number; libURL?: string } | undefined;
    const result = await compressPropertyPhoto(original, async (file, options) => {
      receivedOptions = options;
      assert.equal(file, original);
      return compressedBlob;
    });
    assert.equal(receivedOptions?.fileType, PROPERTY_PHOTO_COMPRESSION_OPTIONS.fileType);
    assert.equal(receivedOptions?.useWebWorker, true);
    assert.equal(
      receivedOptions?.maxWidthOrHeight,
      PROPERTY_PHOTO_COMPRESSION_OPTIONS.maxWidthOrHeight,
    );
    assert.match(String(receivedOptions?.libURL), /\/vendor\/browser-image-compression\.js$/);
    assert.doesNotMatch(String(receivedOptions?.libURL), /jsdelivr/);
    assert.equal(result.type, 'image/webp');
    assert.match(result.name, /\.webp$/i);
    assert.equal(await result.text(), 'webp-bytes');
  });

  it('throws when the compressed file still exceeds 4 MB', async () => {
    const original = new File(['x'], 'huge.jpg', { type: 'image/jpeg' });
    const tooBig = new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'out.webp', {
      type: 'image/webp',
    });
    await assert.rejects(
      () => compressPropertyPhoto(original, async () => tooBig),
      /4 MB/,
    );
  });

  it('throws a Portuguese error when compression fails', async () => {
    const original = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    await assert.rejects(
      () =>
        compressPropertyPhoto(original, async () => {
          throw new Error('worker failed');
        }),
      /otimizar/i,
    );
  });

  it('converts HEIC then compresses the JPEG', async () => {
    const heic = new File(['heic-bytes'], 'IMG_1.HEIC', { type: '' });
    const jpeg = new File(['jpeg-bytes'], 'IMG_1.jpg', { type: 'image/jpeg' });
    const webp = new File(['webp-bytes'], 'out.webp', { type: 'image/webp' });
    let compressedInput: File | undefined;
    const result = await compressPropertyPhoto(
      heic,
      async (file) => {
        compressedInput = file;
        return webp;
      },
      async (file) => {
        assert.equal(file, heic);
        return jpeg;
      },
    );
    assert.equal(compressedInput, jpeg);
    assert.equal(result.type, 'image/webp');
  });

  it('throws a Portuguese error when HEIC conversion fails', async () => {
    const heic = new File(['x'], 'IMG.HEIC', { type: 'image/heic' });
    await assert.rejects(
      () =>
        compressPropertyPhoto(
          heic,
          async () => new File(['w'], 'w.webp', { type: 'image/webp' }),
          async () => {
            throw new Error('decode failed');
          },
        ),
      /HEIC/i,
    );
  });
});
