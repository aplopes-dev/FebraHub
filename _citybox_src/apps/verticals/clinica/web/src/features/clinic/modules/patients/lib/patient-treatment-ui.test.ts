import { describe, expect, it } from 'vitest';
import type { PatientTreatment } from '../types/patient-treatment';
import {
  buildDefaultTreatmentFinalizeEvolutionNotes,
  formatPatientTreatmentDescription,
  formatPatientTreatmentLabel,
  formatPatientTreatmentProfessionalLabel,
  formatPatientTreatmentSubtitle,
  partitionPatientTreatmentBodyRegions,
  partitionPatientTreatmentTeeth,
} from './patient-treatment-ui';

function buildTreatment(
  overrides: Partial<PatientTreatment> &
    Pick<PatientTreatment, 'id' | 'status' | 'source' | 'toothNumber'>,
): PatientTreatment {
  return {
    patientId: 'p1',
    description: 'Teste',
    valueCents: 1000,
    ...overrides,
  };
}

describe('buildDefaultTreatmentFinalizeEvolutionNotes', () => {
  it('preenche com dente quando não há faces', () => {
    expect(
      buildDefaultTreatmentFinalizeEvolutionNotes({
        description: 'Restauração',
        treatmentName: 'Restauração',
        toothNumber: 16,
        locationType: 'tooth',
        locationLabel: '16',
      }),
    ).toBe('Restauração do dente 16 foi finalizado.');
  });

  it('preenche com face singular quando há uma face', () => {
    expect(
      buildDefaultTreatmentFinalizeEvolutionNotes({
        description: 'Restauração',
        treatmentName: 'Restauração',
        toothNumber: 15,
        locationType: 'tooth',
        locationLabel: '15 · M',
      }),
    ).toBe('Restauração da face m foi finalizado.');
  });

  it('preenche com faces no plural quando há várias', () => {
    expect(
      buildDefaultTreatmentFinalizeEvolutionNotes({
        description: 'Restauração',
        treatmentName: 'Restauração',
        toothNumber: 15,
        locationType: 'tooth',
        locationLabel: '15 · M,O/I',
      }),
    ).toBe('Restauração das faces m, o/i foi finalizado.');
  });

  it('preenche região corporal em minúsculas (malar, bochecha)', () => {
    expect(
      buildDefaultTreatmentFinalizeEvolutionNotes({
        description: 'Preenchimento',
        treatmentName: 'Preenchimento',
        locationType: 'body_region',
        locationLabel: 'Região Malar',
      }),
    ).toBe('Preenchimento da região malar foi finalizado.');

    expect(
      buildDefaultTreatmentFinalizeEvolutionNotes({
        description: 'Liberação miofascial',
        treatmentName: 'Liberação miofascial',
        locationType: 'body_region',
        locationLabel: 'body:quadril-direito',
      }),
    ).toBe('Liberação miofascial da região quadril direito foi finalizado.');
  });

  it('usa descrição quando treatmentName está vazio', () => {
    expect(
      buildDefaultTreatmentFinalizeEvolutionNotes({
        description: 'Limpeza',
        toothNumber: 11,
        locationType: 'tooth',
        locationLabel: '11',
      }),
    ).toBe('Limpeza do dente 11 foi finalizado.');
  });

  it('inclui sessão i/N quando o tratamento faz parte de um pacote', () => {
    expect(
      buildDefaultTreatmentFinalizeEvolutionNotes({
        description: 'Reabilitação',
        treatmentName:
          'Reabilitação Pós-Cirúrgica de Ombro / Joelho / Quadril / Coluna',
        locationType: 'body_region',
        locationLabel: 'body:ombro-esquerdo',
        sessionIndex: 2,
        sessionTotal: 5,
      }),
    ).toBe(
      'Reabilitação Pós-Cirúrgica de Ombro / Joelho / Quadril / Coluna da região ombro esquerdo - sessão 2/5 foi finalizado.',
    );

    expect(
      buildDefaultTreatmentFinalizeEvolutionNotes({
        description: 'RPG',
        treatmentName: 'RPG',
        locationType: 'none',
        sessionIndex: 1,
        sessionTotal: 5,
      }),
    ).toBe('RPG - sessão 1/5 foi finalizado.');

    expect(
      buildDefaultTreatmentFinalizeEvolutionNotes({
        description: 'Pilates',
        treatmentName: 'Pilates',
        locationType: 'session',
        sessionIndex: 3,
        sessionTotal: 10,
      }),
    ).toBe('Pilates - sessão 3/10 foi finalizado.');
  });

  it('não menciona sessão quando total é 1 ou ausente', () => {
    expect(
      buildDefaultTreatmentFinalizeEvolutionNotes({
        description: 'RPG',
        treatmentName: 'RPG',
        locationType: 'body_region',
        locationLabel: 'body:ombro-esquerdo',
        sessionIndex: 1,
        sessionTotal: 1,
      }),
    ).toBe('RPG da região ombro esquerdo foi finalizado.');
  });

  it('lista vários procedimentos no plural', () => {
    expect(
      buildDefaultTreatmentFinalizeEvolutionNotes([
        {
          description: 'Clareamento em Consultório',
          treatmentName: 'Clareamento em Consultório',
          toothNumber: 23,
          locationType: 'tooth',
          locationLabel: '23',
        },
        {
          description: 'Clareamento em Consultório',
          treatmentName: 'Clareamento em Consultório',
          toothNumber: 26,
          locationType: 'tooth',
          locationLabel: '26',
        },
      ]),
    ).toBe(
      'Clareamento em Consultório do dente 23, Clareamento em Consultório do dente 26 foram finalizados.',
    );
  });
});

describe('partitionPatientTreatmentTeeth', () => {
  it('includes standalone and budget treatments with tooth numbers', () => {
    const result = partitionPatientTreatmentTeeth([
      buildTreatment({ id: '1', status: 'active', source: 'standalone', toothNumber: 13 }),
      buildTreatment({ id: '2', status: 'active', source: 'budget', toothNumber: 11 }),
      buildTreatment({ id: '3', status: 'finalized', source: 'standalone', toothNumber: 21 }),
      buildTreatment({ id: '4', status: 'active', source: 'standalone', toothNumber: undefined }),
    ]);

    expect(result.openToothNumbers).toEqual([11, 13]);
    expect(result.finalizedToothNumbers).toEqual([21]);
  });

  it('prefers the most recent treatment on the same tooth (finalize turns green)', () => {
    const result = partitionPatientTreatmentTeeth([
      buildTreatment({
        id: '1',
        status: 'active',
        source: 'budget',
        toothNumber: 13,
        createdAt: '2026-07-15T12:00:00.000Z',
      }),
      buildTreatment({
        id: '2',
        status: 'finalized',
        source: 'standalone',
        toothNumber: 13,
        createdAt: '2026-07-20T12:00:00.000Z',
        finalizedAt: '2026-07-27T15:00:00.000Z',
      }),
    ]);

    expect(result.openToothNumbers).toEqual([]);
    expect(result.finalizedToothNumbers).toEqual([13]);
  });

  it('keeps tooth open when a newer active treatment exists after finalize', () => {
    const result = partitionPatientTreatmentTeeth([
      buildTreatment({
        id: '1',
        status: 'finalized',
        source: 'standalone',
        toothNumber: 11,
        finalizedAt: '2026-07-20T12:00:00.000Z',
      }),
      buildTreatment({
        id: '2',
        status: 'active',
        source: 'budget',
        toothNumber: 11,
        createdAt: '2026-07-27T12:00:00.000Z',
      }),
    ]);

    expect(result.openToothNumbers).toEqual([11]);
    expect(result.finalizedToothNumbers).toEqual([]);
  });
});

describe('partitionPatientTreatmentBodyRegions', () => {
  it('partitions body_region treatments by status', () => {
    const result = partitionPatientTreatmentBodyRegions([
      buildTreatment({
        id: '1',
        status: 'active',
        source: 'standalone',
        toothNumber: 0,
        locationType: 'body_region',
        locationLabel: 'body:quadril-direito',
      }),
      buildTreatment({
        id: '2',
        status: 'finalized',
        source: 'budget',
        toothNumber: 0,
        locationType: 'body_region',
        locationLabel: 'body:joelho-esquerdo',
      }),
    ]);

    expect(result.openRegionIds).toEqual(['quadril-direito']);
    expect(result.finalizedRegionIds).toEqual(['joelho-esquerdo']);
  });

  it('mantém região aberta até todas as sessões do pacote estarem finalizadas', () => {
    const base = {
      source: 'budget' as const,
      toothNumber: 0,
      locationType: 'body_region' as const,
      locationLabel: 'body:ombro-esquerdo',
      budgetId: 'budget-1',
      treatmentId: 'trt-rehab',
      treatmentName: 'Reabilitação',
      sessionTotal: 8,
    };

    const partial = partitionPatientTreatmentBodyRegions([
      buildTreatment({ ...base, id: 's1', status: 'finalized', sessionIndex: 1 }),
      buildTreatment({ ...base, id: 's2', status: 'active', sessionIndex: 2 }),
      buildTreatment({ ...base, id: 's3', status: 'active', sessionIndex: 3 }),
      buildTreatment({ ...base, id: 's4', status: 'active', sessionIndex: 4 }),
      buildTreatment({ ...base, id: 's5', status: 'active', sessionIndex: 5 }),
      buildTreatment({ ...base, id: 's6', status: 'active', sessionIndex: 6 }),
      buildTreatment({ ...base, id: 's7', status: 'active', sessionIndex: 7 }),
      buildTreatment({ ...base, id: 's8', status: 'active', sessionIndex: 8 }),
    ]);

    expect(partial.openRegionIds).toEqual(['ombro-esquerdo']);
    expect(partial.finalizedRegionIds).toEqual([]);

    const complete = partitionPatientTreatmentBodyRegions([
      buildTreatment({ ...base, id: 's1', status: 'finalized', sessionIndex: 1 }),
      buildTreatment({ ...base, id: 's2', status: 'finalized', sessionIndex: 2 }),
      buildTreatment({ ...base, id: 's3', status: 'finalized', sessionIndex: 3 }),
      buildTreatment({ ...base, id: 's4', status: 'finalized', sessionIndex: 4 }),
      buildTreatment({ ...base, id: 's5', status: 'finalized', sessionIndex: 5 }),
      buildTreatment({ ...base, id: 's6', status: 'finalized', sessionIndex: 6 }),
      buildTreatment({ ...base, id: 's7', status: 'finalized', sessionIndex: 7 }),
      buildTreatment({ ...base, id: 's8', status: 'finalized', sessionIndex: 8 }),
    ]);

    expect(complete.openRegionIds).toEqual([]);
    expect(complete.finalizedRegionIds).toEqual(['ombro-esquerdo']);
  });

  it('com 1 sessão (sem pacote) finaliza a região ao finalizar o único item', () => {
    const result = partitionPatientTreatmentBodyRegions([
      buildTreatment({
        id: 'only',
        status: 'finalized',
        source: 'budget',
        toothNumber: 0,
        locationType: 'body_region',
        locationLabel: 'body:ombro-esquerdo',
        sessionIndex: null,
        sessionTotal: null,
      }),
    ]);

    expect(result.openRegionIds).toEqual([]);
    expect(result.finalizedRegionIds).toEqual(['ombro-esquerdo']);
  });

  it('mantém região aberta se outro pacote/item na mesma região ainda estiver ativo', () => {
    const result = partitionPatientTreatmentBodyRegions([
      buildTreatment({
        id: 'a1',
        status: 'finalized',
        source: 'budget',
        toothNumber: 0,
        locationType: 'body_region',
        locationLabel: 'body:ombro-esquerdo',
        budgetId: 'b1',
        treatmentId: 't-a',
        sessionIndex: 1,
        sessionTotal: 2,
      }),
      buildTreatment({
        id: 'a2',
        status: 'finalized',
        source: 'budget',
        toothNumber: 0,
        locationType: 'body_region',
        locationLabel: 'body:ombro-esquerdo',
        budgetId: 'b1',
        treatmentId: 't-a',
        sessionIndex: 2,
        sessionTotal: 2,
      }),
      buildTreatment({
        id: 'b1',
        status: 'active',
        source: 'standalone',
        toothNumber: 0,
        locationType: 'body_region',
        locationLabel: 'body:ombro-esquerdo',
      }),
    ]);

    expect(result.openRegionIds).toEqual(['ombro-esquerdo']);
    expect(result.finalizedRegionIds).toEqual([]);
  });
});

describe('formatPatientTreatmentDescription / Label (sessões)', () => {
  it('não sufixa 1/1; sufixa i/N só se total ≥ 2', () => {
    expect(
      formatPatientTreatmentDescription('RPG', 0, 'none', '', 1, 1),
    ).toBe('RPG');
    expect(
      formatPatientTreatmentDescription('RPG', 0, 'none', '', 1, 5),
    ).toBe('RPG - 1/5');
    expect(
      formatPatientTreatmentDescription(
        'Liberação',
        0,
        'body_region',
        'body:joelho-direito',
        2,
        5,
      ),
    ).toBe('Liberação — Joelho Direito - 2/5');
  });

  it('label da aba Tratamentos usa sessionIndex/Total do tratamento', () => {
    expect(
      formatPatientTreatmentLabel({
        description: 'RPG',
        treatmentName: 'RPG',
        locationType: 'session',
        sessionIndex: 3,
        sessionTotal: 5,
      }),
    ).toBe('RPG — Sessão - 3/5');
  });
});

describe('formatPatientTreatmentSubtitle', () => {
  it('coloca Dr(a) + nome completo antes do plano', () => {
    expect(
      formatPatientTreatmentSubtitle('Particular', 'Danillo Mota de Assis'),
    ).toBe('Dr(a) Danillo Mota de Assis - Particular');
  });

  it('não duplica título quando o snapshot já tem Dr/Dra', () => {
    expect(
      formatPatientTreatmentSubtitle('Particular', 'Dr. Danillo Mota de Assis'),
    ).toBe('Dr(a) Danillo Mota de Assis - Particular');
  });

  it('mostra só profissional ou só plano quando um falta', () => {
    expect(formatPatientTreatmentSubtitle(undefined, 'Ana Silva')).toBe(
      'Dr(a) Ana Silva',
    );
    expect(formatPatientTreatmentSubtitle('Particular', undefined)).toBe(
      'Particular',
    );
  });
});

describe('formatPatientTreatmentProfessionalLabel', () => {
  it('retorna null para nome vazio', () => {
    expect(formatPatientTreatmentProfessionalLabel('  ')).toBeNull();
  });
});
