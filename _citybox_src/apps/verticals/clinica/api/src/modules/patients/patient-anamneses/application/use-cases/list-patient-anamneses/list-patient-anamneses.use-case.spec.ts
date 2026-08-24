import { PatientAnamnesis } from '../../../domain/entities/patient-anamnesis.entity';
import { STORE_A } from '../../../../tests/patients-test.fixtures';
import {
  createPatientAnamnesesTestHarness,
  PATIENT_A,
  seedPatient,
} from '../../../tests/patient-anamneses-test.fixtures';

describe('ListPatientAnamnesesUseCase', () => {
  it('lists anamneses with pagination and default sort by issuedAt desc', async () => {
    const harness = createPatientAnamnesesTestHarness();
    seedPatient(harness);

    await harness.anamnesisRepo.save(
      PatientAnamnesis.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          templateId: 't-1',
          templateName: 'Modelo A',
          issuedAt: new Date('2026-07-01'),
          status: 'issued',
          fillingMode: 'professional',
          consultationReason: 'Motivo A',
          questionsSnapshot: [],
          answers: [],
        },
        'anam-1',
      ),
    );

    await harness.anamnesisRepo.save(
      PatientAnamnesis.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          templateId: 't-2',
          templateName: 'Modelo B',
          issuedAt: new Date('2026-07-05'),
          status: 'issued',
          fillingMode: 'professional',
          consultationReason: 'Motivo B',
          questionsSnapshot: [],
          answers: [],
        },
        'anam-2',
      ),
    );

    const result = await harness.listPatientAnamneses.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      page: 1,
      perPage: 10,
    });

    expect(result.total).toBe(2);
    expect(result.items.map((item) => item.id)).toEqual(['anam-2', 'anam-1']);
  });

  it('filters by template name search', async () => {
    const harness = createPatientAnamnesesTestHarness();
    seedPatient(harness);

    await harness.anamnesisRepo.save(
      PatientAnamnesis.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          templateId: 't-1',
          templateName: 'Ortodontia',
          issuedAt: new Date('2026-07-01'),
          status: 'issued',
          fillingMode: 'professional',
          consultationReason: null,
          questionsSnapshot: [],
          answers: [],
        },
        'anam-1',
      ),
    );

    await harness.anamnesisRepo.save(
      PatientAnamnesis.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          templateId: 't-2',
          templateName: 'Geral',
          issuedAt: new Date('2026-07-02'),
          status: 'issued',
          fillingMode: 'professional',
          consultationReason: null,
          questionsSnapshot: [],
          answers: [],
        },
        'anam-2',
      ),
    );

    const result = await harness.listPatientAnamneses.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      search: 'orto',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.templateName).toBe('Ortodontia');
  });
});
