import { FinalizePatientTreatmentUseCase } from './finalize-treatment.use-case';
import { InMemoryPatientTreatmentRepository } from '../../../tests/in-memory-patient-treatment.repository';
import { InMemoryPatientTreatmentFinalizationStore } from '../../../tests/in-memory-patient-treatment-finalization.store';
import { InMemoryTreatmentEvolutionRepository } from '../../../../treatment-evolutions/tests/in-memory-treatment-evolution.repository';
import { InMemoryPatientRepository } from '../../../../tests/in-memory-patient.repository';
import { seedMinimalPatient } from '../../../../tests/patients-test.fixtures';
import { PatientTreatmentCompletedError } from '../../../domain/errors/patient-treatment-completed.error';
import { PatientTreatmentNotFoundError } from '../../../domain/errors/patient-treatment-not-found.error';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import type { AccrueCommissionsOnTreatmentCompletedService } from '../../../../../commissions/accruals/application/services/accrue-commissions-on-treatment-completed.service';

describe('FinalizePatientTreatmentUseCase', () => {
  const storeId = 'store-1';
  const patientId = '11111111-1111-4111-8111-111111111111';
  const treatmentId = '22222222-2222-4222-8222-222222222222';
  const treatmentIdB = '22222222-2222-4222-8222-222222222223';
  const professionalId = '33333333-3333-4333-8333-333333333333';
  const finalizedAt = new Date('2026-07-06T12:00:00.000Z');

  let patientRepo: InMemoryPatientRepository;
  let treatmentRepo: InMemoryPatientTreatmentRepository;
  let evolutionRepo: InMemoryTreatmentEvolutionRepository;
  let finalizationStore: InMemoryPatientTreatmentFinalizationStore;
  let useCase: FinalizePatientTreatmentUseCase;

  beforeEach(() => {
    patientRepo = new InMemoryPatientRepository();
    treatmentRepo = new InMemoryPatientTreatmentRepository();
    evolutionRepo = new InMemoryTreatmentEvolutionRepository();
    finalizationStore = new InMemoryPatientTreatmentFinalizationStore(
      treatmentRepo,
      evolutionRepo,
    );
    const accrueCommissionsOnTreatmentCompleted = {
      execute: async () => undefined,
    } as unknown as AccrueCommissionsOnTreatmentCompletedService;
    useCase = new FinalizePatientTreatmentUseCase(
      patientRepo,
      treatmentRepo,
      finalizationStore,
      accrueCommissionsOnTreatmentCompleted,
    );
    seedMinimalPatient(patientRepo, storeId, patientId);
  });

  it('finalizes active treatment and creates linked evolution', async () => {
    treatmentRepo.seed(
      {
        storeId,
        patientId,
        planId: null,
        treatmentId: null,
        professionalId: null,
        professionalName: '',
        planName: '',
        treatmentName: 'Limpeza',
        description: 'Limpeza',
        valueCents: 10000,
        locationType: 'tooth',
        locationLabel: '18',
        diagnosis: '',
        observation: '',
        sortOrder: 0,
        finalizedAt: null,
      },
      treatmentId,
    );

    const result = await useCase.execute({
      storeId,
      patientId,
      ids: [treatmentId],
      professionalId,
      professionalName: 'Dr. Ana',
      finalizedAt,
      evolutionNotes: 'Procedimento concluído sem intercorrências.',
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.status).toBe('completed');
    expect(result[0]?.finalizedAt).toEqual(finalizedAt);

    const evolutions = await evolutionRepo.findByPatient(storeId, patientId);
    expect(evolutions).toHaveLength(1);
    expect(evolutions[0]?.source).toBe('treatment');
    expect(evolutions[0]?.treatmentId).toBe(treatmentId);
    expect(evolutions[0]?.evolutionNotes).toBe(
      'Procedimento concluído sem intercorrências.',
    );
  });

  it('finalizes multiple treatments with a single shared evolution', async () => {
    treatmentRepo.seed(
      {
        storeId,
        patientId,
        planId: null,
        treatmentId: null,
        professionalId: null,
        professionalName: '',
        planName: '',
        treatmentName: 'Alveoloplastia',
        description: 'Alveoloplastia',
        valueCents: 10000,
        locationType: 'tooth',
        locationLabel: '11',
        diagnosis: '',
        observation: '',
        sortOrder: 0,
        finalizedAt: null,
      },
      treatmentId,
    );
    treatmentRepo.seed(
      {
        storeId,
        patientId,
        planId: null,
        treatmentId: null,
        professionalId: null,
        professionalName: '',
        planName: '',
        treatmentName: 'Alveoloplastia',
        description: 'Alveoloplastia',
        valueCents: 12000,
        locationType: 'tooth',
        locationLabel: '13',
        diagnosis: '',
        observation: '',
        sortOrder: 1,
        finalizedAt: null,
      },
      treatmentIdB,
    );

    const notes =
      'Alveoloplastia do dente 11, Alveoloplastia do dente 13 foram finalizados.';

    const result = await useCase.execute({
      storeId,
      patientId,
      ids: [treatmentId, treatmentIdB],
      professionalId,
      professionalName: 'Danillo',
      finalizedAt,
      evolutionNotes: notes,
    });

    expect(result).toHaveLength(2);
    expect(result.every((item) => item.status === 'completed')).toBe(true);

    const evolutions = await evolutionRepo.findByPatient(storeId, patientId);
    expect(evolutions).toHaveLength(1);
    expect(evolutions[0]?.evolutionNotes).toBe(notes);
    expect(evolutions[0]?.treatmentId).toBe(treatmentId);
    expect(evolutions[0]?.description).toBe('Alveoloplastia, Alveoloplastia');
    expect(evolutions[0]?.valueCents).toBe(22000);
  });

  it('rejects when treatment is already completed', async () => {
    treatmentRepo.seed(
      {
        storeId,
        patientId,
        source: 'standalone',
        status: 'completed',
        planId: null,
        treatmentId: null,
        professionalId: null,
        professionalName: '',
        planName: '',
        treatmentName: 'Limpeza',
        description: 'Limpeza',
        valueCents: 10000,
        locationType: 'tooth',
        locationLabel: '18',
        diagnosis: '',
        observation: '',
        sortOrder: 0,
        finalizedAt: new Date(),
      },
      treatmentId,
    );

    await expect(
      useCase.execute({
        storeId,
        patientId,
        ids: [treatmentId],
        professionalId,
        finalizedAt,
        evolutionNotes: 'Notas',
      }),
    ).rejects.toBeInstanceOf(PatientTreatmentCompletedError);
  });

  it('rejects when treatment is not found', async () => {
    await expect(
      useCase.execute({
        storeId,
        patientId,
        ids: [treatmentId],
        professionalId,
        finalizedAt,
        evolutionNotes: 'Notas',
      }),
    ).rejects.toBeInstanceOf(PatientTreatmentNotFoundError);
  });

  it('rejects when patient is not found', async () => {
    await expect(
      useCase.execute({
        storeId,
        patientId: '99999999-9999-4999-8999-999999999999',
        ids: [treatmentId],
        professionalId,
        finalizedAt,
        evolutionNotes: 'Notas',
      }),
    ).rejects.toBeInstanceOf(PatientNotFoundError);
  });
});
