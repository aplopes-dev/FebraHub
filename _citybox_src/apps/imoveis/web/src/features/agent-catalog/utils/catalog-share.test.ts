import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  catalogPublicUrl,
  listingPublicUrl,
  shareOrCopyUrl,
} from './catalog-share';

describe('catalog-share', () => {
  it('builds catalog and listing public URLs', () => {
    assert.match(catalogPublicUrl('ana', 'https://example.com'), /\/agents\/ana$/);
    assert.match(
      listingPublicUrl('ana', 'prop-1', 'https://example.com'),
      /\/p\/prop-1\?action=new-lead$/,
    );
  });

  it('uses navigator.share when available', async () => {
    const original = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        share: async () => undefined,
      },
    });
    try {
      const result = await shareOrCopyUrl({
        title: 't',
        text: 'x',
        url: 'https://example.com',
        copyText: async () => false,
      });
      assert.equal(result, 'shared');
    } finally {
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: original,
      });
    }
  });

  it('falls back to copy when share is missing', async () => {
    const original = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {},
    });
    try {
      const result = await shareOrCopyUrl({
        title: 't',
        text: 'x',
        url: 'https://example.com/a',
        copyText: async (value) => value === 'https://example.com/a',
      });
      assert.equal(result, 'copied');
    } finally {
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: original,
      });
    }
  });

  it('returns failed on AbortError without copying', async () => {
    const original = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        share: async () => {
          throw new DOMException('Aborted', 'AbortError');
        },
      },
    });
    try {
      let copied = false;
      const result = await shareOrCopyUrl({
        title: 't',
        text: 'x',
        url: 'https://example.com',
        copyText: async () => {
          copied = true;
          return true;
        },
      });
      assert.equal(result, 'failed');
      assert.equal(copied, false);
    } finally {
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: original,
      });
    }
  });
});
