import { DeletePatientTreatmentUseCase } from './delete-treatment.use-case';
import { InMemoryPatientTreatmentRepository } from '../../../tests/in-memory-patient-treatment.repository';
import { InMemoryPatientRepository } from '../../../../tests/in-memory-patient.repository';
import { seedMinimalPatient } from '../../../../tests/patients-test.fixtures';
import { PatientTreatmentCompletedError } from '../../../domain/errors/patient-treatment-completed.error';

describe('DeletePatientTreatmentUseCase', () => {
  const storeId = 'store-1';
  const patientId = '11111111-1111-4111-8111-111111111111';
  const treatmentId = '22222222-2222-4222-8222-222222222222';

  let patientRepo: InMemoryPatientRepository;
  let treatmentRepo: InMemoryPatientTreatmentRepository;
  let useCase: DeletePatientTreatmentUseCase;

  beforeEach(() => {
    patientRepo = new InMemoryPatientRepository();
    treatmentRepo = new InMemoryPatientTreatmentRepository();
    useCase = new DeletePatientTreatmentUseCase(patientRepo, treatmentRepo);
    seedMinimalPatient(patientRepo, storeId, patientId);
  });

  it('deletes active treatment', async () => {
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

    await useCase.execute({ storeId, patientId, id: treatmentId });

    expect(
      await treatmentRepo.findById(storeId, patientId, treatmentId),
    ).toBeNull();
  });

  it('rejects delete when treatment is completed', async () => {
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
      useCase.execute({ storeId, patientId, id: treatmentId }),
    ).rejects.toBeInstanceOf(PatientTreatmentCompletedError);
  });
});
