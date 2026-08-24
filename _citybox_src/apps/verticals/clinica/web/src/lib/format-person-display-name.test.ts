import { describe, expect, it } from 'vitest';
import {
  displayNameFromJwtClaims,
  formatPersonDisplayName,
} from './format-person-display-name';

describe('formatPersonDisplayName', () => {
  it('ignora sobrenome placeholder', () => {
    expect(formatPersonDisplayName('Gabigol', '-')).toBe('Gabigol');
    expect(formatPersonDisplayName('Carlos', '-')).toBe('Carlos');
  });

  it('preserva nome completo válido', () => {
    expect(formatPersonDisplayName('Carlos', 'Mendes')).toBe('Carlos Mendes');
  });
});

describe('displayNameFromJwtClaims', () => {
  it('corrige family_name "-" do Keycloak', () => {
    expect(
      displayNameFromJwtClaims({
        given_name: 'Gabigol',
        family_name: '-',
        preferred_username: 'gabigol',
      }),
    ).toBe('Gabigol');
  });

  it('corrige claim name "Gabigol -"', () => {
    expect(
      displayNameFromJwtClaims({
        name: 'Gabigol -',
        preferred_username: 'gabigol',
      }),
    ).toBe('Gabigol');
  });
});
