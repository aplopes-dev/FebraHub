import {
  formatProfessionalCouncilLabel,
  parseProfessionalCouncilInput,
  toProfessionalCouncilSnapshot,
} from './professional-council';

describe('professional-council', () => {
  it('accepts CREFITO regional 07 and formats label without leading zero', () => {
    const snapshot = parseProfessionalCouncilInput(
      {
        councilType: 'CREFITO',
        councilNumber: '12345',
        councilUf: '7',
      },
      { allowedTypes: ['CREFITO'] },
    );

    expect(snapshot).toEqual({
      councilType: 'CREFITO',
      councilNumber: '12345',
      councilUf: '07',
    });
    expect(formatProfessionalCouncilLabel(snapshot)).toBe('CREFITO-7 12345');
  });

  it('accepts CREFITO regional 06 (CE)', () => {
    expect(
      parseProfessionalCouncilInput(
        {
          councilType: 'CREFITO',
          councilNumber: '999',
          councilUf: '06',
        },
        { allowedTypes: ['CREFITO'] },
      ),
    ).toEqual({
      councilType: 'CREFITO',
      councilNumber: '999',
      councilUf: '06',
    });
  });

  it('rejects CREFITO regional 21', () => {
    expect(
      parseProfessionalCouncilInput(
        {
          councilType: 'CREFITO',
          councilNumber: '1',
          councilUf: '21',
        },
        { allowedTypes: ['CREFITO'] },
      ),
    ).toBeNull();
  });

  it('rejects CRM with regional code 07', () => {
    expect(
      parseProfessionalCouncilInput(
        {
          councilType: 'CRM',
          councilNumber: '123',
          councilUf: '07',
        },
        { allowedTypes: ['CRM', 'CRO'] },
      ),
    ).toBeNull();
  });

  it('rejects CRO on fisio-only allowed types', () => {
    expect(
      parseProfessionalCouncilInput(
        {
          councilType: 'CRO',
          councilNumber: '12345',
          councilUf: 'BA',
        },
        { allowedTypes: ['CREFITO'] },
      ),
    ).toBeNull();
  });

  it('normalizes stored CREFITO snapshot', () => {
    expect(
      toProfessionalCouncilSnapshot({
        councilType: 'CREFITO',
        councilNumber: '42',
        councilUf: '07',
      }),
    ).toEqual({
      councilType: 'CREFITO',
      councilNumber: '42',
      councilUf: '07',
    });
  });
});
