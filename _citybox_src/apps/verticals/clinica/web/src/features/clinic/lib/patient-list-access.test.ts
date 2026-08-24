import { describe, expect, it } from 'vitest';
import { defineAbilityFor } from '@citybox/clinica-permissions';
import {
  canAccessPatientFicha,
  isPatientDetailPath,
  isPatientListPath,
} from './patient-list-access';

describe('patient-list-access', () => {
  it('exige read Patient (visualizar dados pessoais) para abrir a ficha', () => {
    const withoutRead = defineAbilityFor({
      userId: 'u1',
      permissions: ['patient_budget_read', 'patient_create', 'vertical_access'],
    });
    expect(canAccessPatientFicha(withoutRead)).toBe(false);

    const withRead = defineAbilityFor({
      userId: 'u1',
      permissions: ['patient_read_personal', 'vertical_access'],
    });
    expect(canAccessPatientFicha(withRead)).toBe(true);
  });

  it('reconhece paths de lista e ficha', () => {
    expect(isPatientListPath('/pacientes')).toBe(true);
    expect(isPatientListPath('/pacientes/')).toBe(true);
    expect(isPatientListPath('/pacientes/abc/sobre')).toBe(false);
    expect(isPatientDetailPath('/pacientes/abc/sobre')).toBe(true);
    expect(isPatientDetailPath('/pacientes')).toBe(false);
  });
});
