import { describe, expect, it } from 'vitest';
import { completeDecimalZeros, maskDecimalInput } from './mask-decimal-input';

describe('maskDecimalInput', () => {
  it('strips letters and keeps digits', () => {
    expect(maskDecimalInput('70a5')).toBe('705');
    expect(maskDecimalInput('abc')).toBe('');
  });

  it('allows a single decimal separator', () => {
    expect(maskDecimalInput('70,5')).toBe('70,5');
    expect(maskDecimalInput('70.5')).toBe('70.5');
    expect(maskDecimalInput('70,5,2')).toBe('70,52');
    expect(maskDecimalInput('1.2.3')).toBe('1.23');
  });

  it('preserves trailing separator while typing', () => {
    expect(maskDecimalInput('70,')).toBe('70,');
    expect(maskDecimalInput('175.')).toBe('175.');
  });
});

describe('completeDecimalZeros', () => {
  it('appends ,00 for 2 or 3 digit integers', () => {
    expect(completeDecimalZeros('70')).toBe('70,00');
    expect(completeDecimalZeros('175')).toBe('175,00');
    expect(completeDecimalZeros('70,')).toBe('70,00');
  });

  it('leaves other values unchanged', () => {
    expect(completeDecimalZeros('')).toBe('');
    expect(completeDecimalZeros('5')).toBe('5');
    expect(completeDecimalZeros('1234')).toBe('1234');
    expect(completeDecimalZeros('70,5')).toBe('70,5');
    expect(completeDecimalZeros('70,50')).toBe('70,50');
  });
});
