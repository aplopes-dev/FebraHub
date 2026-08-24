import { UpdatePatientTreatmentUseCase } from './update-treatment.use-case';
import { InMemoryPatientTreatmentRepository } from '../../../tests/in-memory-patient-treatment.repository';
import { InMemoryPatientRepository } from '../../../../tests/in-memory-patient.repository';
import { seedMinimalPatient } from '../../../../tests/patients-test.fixtures';
import { PatientTreatmentCompletedError } from '../../../domain/errors/patient-treatment-completed.error';
import { PatientTreatmentNotFoundError } from '../../../domain/errors/patient-treatment-not-found.error';

describe('UpdatePatientTreatmentUseCase', () => {
  const storeId = 'store-1';
  const patientId = '11111111-1111-4111-8111-111111111111';
  const treatmentId = '22222222-2222-4222-8222-222222222222';

  let patientRepo: InMemoryPatientRepository;
  let treatmentRepo: InMemoryPatientTreatmentRepository;
  let useCase: UpdatePatientTreatmentUseCase;

  beforeEach(() => {
    patientRepo = new InMemoryPatientRepository();
    treatmentRepo = new InMemoryPatientTreatmentRepository();
    useCase = new UpdatePatientTreatmentUseCase(patientRepo, treatmentRepo);
    seedMinimalPatient(patientRepo, storeId, patientId);
  });

  it('updates diagnosis and observation for active treatment', async () => {
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

    const updated = await useCase.execute({
      storeId,
      patientId,
      id: treatmentId,
      diagnosis: 'Cárie',
      observation: 'Acompanhar',
    });

    expect(updated.diagnosis).toBe('Cárie');
    expect(updated.observation).toBe('Acompanhar');
  });

  it('rejects update when treatment is completed', async () => {
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
        id: treatmentId,
        diagnosis: 'Cárie',
        observation: 'Acompanhar',
      }),
    ).rejects.toBeInstanceOf(PatientTreatmentCompletedError);
  });

  it('rejects unknown treatment', async () => {
    await expect(
      useCase.execute({
        storeId,
        patientId,
        id: '99999999-9999-4999-8999-999999999999',
        diagnosis: 'Cárie',
        observation: 'Acompanhar',
      }),
    ).rejects.toBeInstanceOf(PatientTreatmentNotFoundError);
  });
});
