import { describe, expect, it } from 'vitest';
import {
  applyEvolutionUpdate,
  createStandaloneEvolution,
  mapEvolutionToStandaloneFormValues,
  STANDALONE_EVOLUTION_DEFAULT_DESCRIPTION,
} from './patient-treatment-evolution';

describe('createStandaloneEvolution', () => {
  it('creates a standalone evolution with default description', () => {
    const evolution = createStandaloneEvolution('pat-001', {
      professionalId: 'prof-1',
      professionalName: 'Dr. Ana',
      finalizedAt: '2026-06-30T12:00:00.000Z',
      evolutionNotes: 'Paciente estável.',
    });

    expect(evolution.patientId).toBe('pat-001');
    expect(evolution.source).toBe('standalone');
    expect(evolution.description).toBe(STANDALONE_EVOLUTION_DEFAULT_DESCRIPTION);
    expect(evolution.evolutionNotes).toBe('Paciente estável.');
    expect(evolution.valueCents).toBe(0);
    expect(evolution.treatmentId).toContain('standalone-evolution-');
  });
});

describe('mapEvolutionToStandaloneFormValues', () => {
  it('maps evolution fields to form values', () => {
    const values = mapEvolutionToStandaloneFormValues({
      id: 'evo-1',
      treatmentId: 't-1',
      patientId: 'pat-1',
      source: 'budget',
      description: 'Limpeza',
      valueCents: 1000,
      finalizedAt: '2026-06-30T12:00:00.000Z',
      professionalId: 'prof-1',
      professionalName: 'Dr. Ana',
      evolutionNotes: 'Evolução inicial',
      signatureStatus: 'unsigned',
    });

    expect(values.professionalId).toBe('prof-1');
    expect(values.evolutionNotes).toBe('Evolução inicial');
    expect(values.evolutionDate).toEqual(new Date('2026-06-30T12:00:00.000Z'));
  });
});

describe('applyEvolutionUpdate', () => {
  it('updates evolution fields and appends edited history', () => {
    const evolution = createStandaloneEvolution('pat-001', {
      professionalId: 'prof-1',
      professionalName: 'Dr. Ana',
      finalizedAt: '2026-06-30T12:00:00.000Z',
      evolutionNotes: 'Antes',
    });

    const updated = applyEvolutionUpdate(evolution, {
      professionalId: 'prof-2',
      professionalName: 'Dr. Bruno',
      finalizedAt: '2026-07-01T12:00:00.000Z',
      evolutionNotes: 'Depois',
    });

    expect(updated.evolutionNotes).toBe('Depois');
    expect(updated.professionalName).toBe('Dr. Bruno');
    expect(updated.actionHistory?.[0]?.action).toBe('edited');
    expect(updated.actionHistory?.some((entry) => entry.action === 'created')).toBe(true);
  });
});
