import { describe, expect, it } from 'vitest';
import type { PatientTreatmentEvolution } from '../types/patient-treatment';
import {
  formatEvolutionHistoryDateTime,
  formatEvolutionHistoryEntryDescription,
  getEvolutionHistoryActionLabel,
  resolveEvolutionActionHistory,
} from './patient-treatment-evolution-history';

function mockEvolution(
  overrides: Partial<PatientTreatmentEvolution> = {},
): PatientTreatmentEvolution {
  return {
    id: 'evo-1',
    treatmentId: 'treatment-1',
    patientId: 'pat-1',
    source: 'standalone',
    description: 'Evolução avulsa',
    valueCents: 0,
    finalizedAt: '2026-06-30T12:00:00.000Z',
    professionalId: 'prof-1',
    professionalName: 'Danillo Mota',
    evolutionNotes: 'Notas',
    signatureStatus: 'unsigned',
    ...overrides,
  };
}

describe('patient-treatment-evolution-history', () => {
  it('formats history datetime as dd/mm/yyyy, hh:mm', () => {
    expect(formatEvolutionHistoryDateTime('2026-06-30T13:22:00.000Z')).toMatch(
      /30\/06\/2026, \d{2}:\d{2}/,
    );
  });

  it('builds created action label', () => {
    expect(getEvolutionHistoryActionLabel('created')).toBe('Criou esta evolução');
  });

  it('resolves stored action history entries', () => {
    const evolution = mockEvolution({
      actionHistory: [
        {
          id: 'hist-1',
          professionalId: 'prof-1',
          professionalName: 'Danillo Mota',
          action: 'created',
          occurredAt: '2026-06-30T13:22:00.000Z',
        },
      ],
    });

    const entries = resolveEvolutionActionHistory(evolution);
    expect(entries).toHaveLength(1);
    expect(formatEvolutionHistoryEntryDescription(entries[0])).toContain(
      'Criou esta evolução em 30/06/2026',
    );
  });

  it('backfills creation history when actionHistory is missing', () => {
    const entries = resolveEvolutionActionHistory(mockEvolution({ actionHistory: undefined }));
    expect(entries[0]?.professionalName).toBe('Danillo Mota');
    expect(entries[0]?.action).toBe('created');
  });
});
