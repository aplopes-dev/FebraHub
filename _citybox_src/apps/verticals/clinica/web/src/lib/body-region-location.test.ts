import { describe, expect, it } from 'vitest';
import {
  formatBodyRegionDisplayLabel,
  formatBodyRegionLocationLabel,
  isBodyRegionLocationLabel,
  parseBodyRegionIdFromLabel,
} from './body-region-location';

describe('body-region-location', () => {
  it('formats and parses body: prefix', () => {
    expect(formatBodyRegionLocationLabel('quadril-direito')).toBe('body:quadril-direito');
    expect(parseBodyRegionIdFromLabel('body:quadril-direito')).toBe('quadril-direito');
    expect(isBodyRegionLocationLabel('body:quadril-direito')).toBe(true);
    expect(isBodyRegionLocationLabel('Quadril Direito')).toBe(false);
  });

  it('resolves human label for display', () => {
    expect(formatBodyRegionDisplayLabel('body:quadril-direito')).toBe('Quadril Direito');
    expect(formatBodyRegionDisplayLabel('')).toBe('—');
  });
});
