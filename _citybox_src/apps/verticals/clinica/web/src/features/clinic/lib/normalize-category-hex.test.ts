import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CATEGORY_HEX,
  normalizeCategoryHex,
} from './normalize-category-hex';

describe('normalizeCategoryHex', () => {
  it('keeps valid hex lowercase', () => {
    expect(normalizeCategoryHex('#3B82F6')).toBe('#3b82f6');
  });

  it('maps legacy named ids', () => {
    expect(normalizeCategoryHex('blue')).toBe('#3b82f6');
    expect(normalizeCategoryHex('teal')).toBe('#14b8a6');
  });

  it('falls back to default', () => {
    expect(normalizeCategoryHex('')).toBe(DEFAULT_CATEGORY_HEX);
    expect(normalizeCategoryHex('#xyz')).toBe(DEFAULT_CATEGORY_HEX);
    expect(normalizeCategoryHex('unknown')).toBe(DEFAULT_CATEGORY_HEX);
  });
});
