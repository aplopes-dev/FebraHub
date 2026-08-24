import { describe, expect, it } from 'vitest';
import {
  matchesHitFields,
  matchesQueryText,
  normalizeSearchText,
  queryTokens,
} from './match-query';

describe('match-query', () => {
  it('normalizeSearchText removes accents and lowercases', () => {
    expect(normalizeSearchText('  João  ')).toBe('joao');
  });

  it('queryTokens splits on whitespace', () => {
    expect(queryTokens('ana  silva')).toEqual(['ana', 'silva']);
  });

  it('matchesQueryText requires all tokens', () => {
    expect(matchesQueryText('Ana Silva Costa', 'ana costa')).toBe(true);
    expect(matchesQueryText('Ana Silva', 'ana costa')).toBe(false);
  });

  it('matchesQueryText with empty query matches everything', () => {
    expect(matchesQueryText('anything', '')).toBe(true);
  });

  it('matchesHitFields joins optional fields', () => {
    expect(matchesHitFields(['Paciente', undefined, '11999'], 'paciente 119')).toBe(
      true,
    );
  });
});
