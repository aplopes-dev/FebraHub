import {
  isNumericPatientSearch,
  matchesPatientSearch,
  resolvePatientSearchFilter,
} from './patient-search.utils';

const patient = {
  name: 'Bruno Santos',
  cpf: '52998224725',
  phone: '73999887766',
  landlinePhone: '7332211000',
};

describe('patient-search.utils', () => {
  it('resolves text queries as partial name search', () => {
    expect(resolvePatientSearchFilter('bruno')).toEqual({
      type: 'name',
      term: 'bruno',
    });
    expect(isNumericPatientSearch('bruno')).toBe(false);
  });

  it('matches partial name case-insensitively', () => {
    expect(matchesPatientSearch(patient, 'BRUNO')).toBe(true);
    expect(matchesPatientSearch(patient, 'santos')).toBe(true);
    expect(matchesPatientSearch(patient, 'Carlos')).toBe(false);
  });

  it('resolves plain-digit queries as numeric search', () => {
    expect(resolvePatientSearchFilter('52998224725')).toEqual({
      type: 'numeric',
      digits: '52998224725',
    });
    expect(matchesPatientSearch(patient, '52998224725')).toBe(true);
  });

  it('normalizes formatted CPF before matching', () => {
    expect(isNumericPatientSearch('529.982.247-25')).toBe(true);
    expect(matchesPatientSearch(patient, '529.982.247-25')).toBe(true);
  });

  it('matches phone digits exactly', () => {
    expect(matchesPatientSearch(patient, '73999887766')).toBe(true);
    expect(matchesPatientSearch(patient, '(73) 99988-7766')).toBe(true);
    expect(matchesPatientSearch(patient, '7332211000')).toBe(true);
  });

  it('does not match partial phone digits', () => {
    expect(matchesPatientSearch(patient, '99988')).toBe(false);
  });
});
