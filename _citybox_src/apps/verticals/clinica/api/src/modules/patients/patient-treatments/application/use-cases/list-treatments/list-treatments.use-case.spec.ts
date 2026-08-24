import { ListPatientTreatmentsUseCase } from './list-treatments.use-case';
import { InMemoryPatientTreatmentRepository } from '../../../tests/in-memory-patient-treatment.repository';
import { InMemoryPatientRepository } from '../../../../tests/in-memory-patient.repository';
import { seedMinimalPatient } from '../../../../tests/patients-test.fixtures';

describe('ListPatientTreatmentsUseCase', () => {
  const storeId = 'store-1';
  const patientId = '11111111-1111-4111-8111-111111111111';

  it('lists treatments ordered by sortOrder', async () => {
    const patientRepo = new InMemoryPatientRepository();
    const treatmentRepo = new InMemoryPatientTreatmentRepository();
    const useCase = new ListPatientTreatmentsUseCase(
      patientRepo,
      treatmentRepo,
    );

    seedMinimalPatient(patientRepo, storeId, patientId);

    const firstId = '22222222-2222-4222-8222-222222222222';
    const secondId = '33333333-3333-4333-8333-333333333333';
    const base = {
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
      locationType: 'tooth' as const,
      locationLabel: '18',
      diagnosis: '',
      observation: '',
      finalizedAt: null,
    };

    treatmentRepo.seed({ ...base, sortOrder: 1 }, firstId);
    treatmentRepo.seed({ ...base, sortOrder: 0 }, secondId);

    const treatments = await useCase.execute({ storeId, patientId });
    expect(treatments.map((item) => item.id)).toEqual([secondId, firstId]);
  });
});
