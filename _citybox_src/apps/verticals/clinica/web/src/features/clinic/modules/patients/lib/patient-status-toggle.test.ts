import { describe, expect, it } from 'vitest';
import {
  getPatientStatusToggleMode,
  PATIENT_STATUS_TOGGLE_COPY,
} from './patient-status-toggle';

describe('getPatientStatusToggleMode', () => {
  it('returns deactivate when patient is active', () => {
    expect(getPatientStatusToggleMode('active')).toBe('deactivate');
  });

  it('returns activate when patient is inactive', () => {
    expect(getPatientStatusToggleMode('inactive')).toBe('activate');
  });
});

describe('PATIENT_STATUS_TOGGLE_COPY', () => {
  it('activate copy is correct', () => {
    const copy = PATIENT_STATUS_TOGGLE_COPY.activate;
    expect(copy.title).toBe('Ativar paciente?');
    expect(copy.menuLabel).toBe('Ativar');
    expect(copy.confirmLabel).toBe('Ativar');
    expect(copy.description('Ana Lima')).toContain('Ana Lima');
  });

  it('deactivate copy is correct', () => {
    const copy = PATIENT_STATUS_TOGGLE_COPY.deactivate;
    expect(copy.title).toBe('Inativar paciente?');
    expect(copy.menuLabel).toBe('Inativar');
    expect(copy.confirmLabel).toBe('Inativar');
    expect(copy.description('João Silva')).toContain('João Silva');
  });
});
