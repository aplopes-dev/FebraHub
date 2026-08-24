import { describe, expect, it } from 'vitest';
import {
  evaluatePatientAnamnesisAlerts,
  mergePatientAnamnesisAlerts,
} from './evaluate-patient-anamnesis-alerts';
import type { PatientAnamnesisQuestionSnapshot } from '../types/patient-anamnesis';

const allergyQuestion: PatientAnamnesisQuestionSnapshot = {
  id: 'q-001',
  text: 'Possui alergia a medicamentos?',
  type: 'yes_no_unknown_text',
  generatesAlert: true,
  alertWhen: 'yes',
  alertName: 'Alergia medicamentosa',
};

describe('evaluatePatientAnamnesisAlerts', () => {
  it('creates alert when tri-state answer matches alertWhen', () => {
    const alerts = evaluatePatientAnamnesisAlerts(
      'anam-001',
      [{ questionId: 'q-001', triState: 'yes', auxiliaryText: 'Penicilina' }],
      [allergyQuestion],
    );

    expect(alerts).toEqual([
      { id: 'anam-001-q-001', message: 'Alergia medicamentosa' },
    ]);
  });

  it('does not create alert when answer does not match alertWhen', () => {
    const alerts = evaluatePatientAnamnesisAlerts(
      'anam-001',
      [{ questionId: 'q-001', triState: 'no' }],
      [allergyQuestion],
    );

    expect(alerts).toEqual([]);
  });
});

describe('mergePatientAnamnesisAlerts', () => {
  it('deduplicates alerts by message', () => {
    const merged = mergePatientAnamnesisAlerts([
      [{ id: 'a-1', message: 'Alergia medicamentosa' }],
      [{ id: 'a-2', message: 'Alergia medicamentosa' }],
      [{ id: 'a-3', message: 'Uso de anticoagulante' }],
    ]);

    expect(merged).toHaveLength(2);
    expect(merged.map((alert) => alert.message)).toEqual([
      'Alergia medicamentosa',
      'Uso de anticoagulante',
    ]);
  });
});
