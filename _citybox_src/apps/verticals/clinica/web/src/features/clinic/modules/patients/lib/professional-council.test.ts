import { describe, expect, it } from 'vitest';
import {
  formatProfessionalCouncilLabel,
  hasProfessionalCouncil,
  toProfessionalCouncilSnapshot,
} from './professional-council';

describe('professional-council', () => {
  it('formats complete council as TYPE-UF NUMBER', () => {
    expect(
      formatProfessionalCouncilLabel({
        councilType: 'CRO',
        councilNumber: '12345',
        councilUf: 'ba',
      }),
    ).toBe('CRO-BA 12345');
  });

  it('formats CRN with UF like CRM/CRO', () => {
    expect(
      formatProfessionalCouncilLabel({
        councilType: 'CRN',
        councilNumber: '12345',
        councilUf: 'ba',
      }),
    ).toBe('CRN-BA 12345');
  });

  it('formats CREFITO without leading zero in regional', () => {
    expect(
      formatProfessionalCouncilLabel({
        councilType: 'CREFITO',
        councilNumber: '12345',
        councilUf: '07',
      }),
    ).toBe('CREFITO-7 12345');
  });

  it('returns empty label when incomplete', () => {
    expect(
      formatProfessionalCouncilLabel({
        councilType: 'CRM',
        councilNumber: null,
        councilUf: 'SP',
      }),
    ).toBe('');
  });

  it('detects complete council and normalizes snapshot', () => {
    expect(
      hasProfessionalCouncil({
        councilType: 'CRM',
        councilNumber: '99',
        councilUf: 'sp',
      }),
    ).toBe(true);

    expect(
      toProfessionalCouncilSnapshot({
        councilType: 'CRM',
        councilNumber: '99',
        councilUf: 'sp',
      }),
    ).toEqual({
      councilType: 'CRM',
      councilNumber: '99',
      councilUf: 'SP',
    });
  });

  it('accepts CREFITO regional 06 (CE)', () => {
    expect(
      toProfessionalCouncilSnapshot({
        councilType: 'CREFITO',
        councilNumber: '42',
        councilUf: '06',
      }),
    ).toEqual({
      councilType: 'CREFITO',
      councilNumber: '42',
      councilUf: '06',
    });
  });
});
