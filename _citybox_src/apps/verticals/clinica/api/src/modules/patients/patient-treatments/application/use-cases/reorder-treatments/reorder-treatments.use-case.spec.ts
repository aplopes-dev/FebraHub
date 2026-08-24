import { ReorderPatientTreatmentsUseCase } from './reorder-treatments.use-case';
import { InMemoryPatientTreatmentRepository } from '../../../tests/in-memory-patient-treatment.repository';
import { InMemoryPatientRepository } from '../../../../tests/in-memory-patient.repository';
import { seedMinimalPatient } from '../../../../tests/patients-test.fixtures';

describe('ReorderPatientTreatmentsUseCase', () => {
  const storeId = 'store-1';
  const patientId = '11111111-1111-4111-8111-111111111111';
  const firstId = '22222222-2222-4222-8222-222222222222';
  const secondId = '33333333-3333-4333-8333-333333333333';

  let patientRepo: InMemoryPatientRepository;
  let treatmentRepo: InMemoryPatientTreatmentRepository;
  let useCase: ReorderPatientTreatmentsUseCase;

  beforeEach(() => {
    patientRepo = new InMemoryPatientRepository();
    treatmentRepo = new InMemoryPatientTreatmentRepository();
    useCase = new ReorderPatientTreatmentsUseCase(patientRepo, treatmentRepo);
    seedMinimalPatient(patientRepo, storeId, patientId);

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

    treatmentRepo.seed({ ...base, sortOrder: 0 }, firstId);
    treatmentRepo.seed({ ...base, sortOrder: 1 }, secondId);
  });

  it('reorders treatments by orderedIds', async () => {
    const reordered = await useCase.execute({
      storeId,
      patientId,
      orderedIds: [secondId, firstId],
    });

    expect(reordered.map((item) => item.id)).toEqual([secondId, firstId]);
    expect(reordered[0]?.sortOrder).toBe(0);
    expect(reordered[1]?.sortOrder).toBe(1);
  });
});
