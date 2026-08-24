import {
  formatToothLocationLabel,
  normalizeToothLocationLabel,
  parseToothLocationLabel,
} from './tooth-location-label';

describe('tooth-location-label', () => {
  it('formats tooth without faces', () => {
    expect(formatToothLocationLabel(15)).toBe('15');
  });

  it('formats tooth with faces in canonical UI order', () => {
    expect(formatToothLocationLabel(15, ['D', 'M', 'O'])).toBe('15 · M,O/I,D');
  });

  it('parses tooth and UI face labels', () => {
    expect(parseToothLocationLabel('15 · M,O/I,D')).toEqual({
      toothNumber: 15,
      faces: ['M', 'O', 'D'],
    });
  });

  it('normalizes tooth location label', () => {
    expect(normalizeToothLocationLabel('15 · D,M')).toBe('15 · M,D');
  });

  it('returns null for invalid label', () => {
    expect(parseToothLocationLabel('Maxila')).toBeNull();
    expect(normalizeToothLocationLabel('Maxila')).toBeNull();
  });
});
