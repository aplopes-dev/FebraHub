import { PatientContractEmission } from '../../../domain/entities/patient-contract-emission.entity';
import { STORE_A } from '../../../tests/patient-contract-emissions-test.fixtures';
import {
  CONTRACT_A,
  createPatientContractEmissionsTestHarness,
  PATIENT_A,
  seedPatient,
} from '../../../tests/patient-contract-emissions-test.fixtures';

describe('ListPatientContractEmissionsUseCase', () => {
  it('lists contract emissions with pagination and default sort by issuedAt desc', async () => {
    const harness = createPatientContractEmissionsTestHarness();
    seedPatient(harness);

    await harness.emissionRepo.save(
      PatientContractEmission.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          templateId: 't-1',
          templateName: 'Modelo A',
          content: '<p>A</p>',
          issuedAt: new Date('2026-07-01T10:00:00.000Z'),
          responsibleName: 'Dr. A',
          patientName: 'Maria',
          formValues: {
            templateId: 't-1',
            contractorName: '',
            contractorBirthDate: '',
            contractorCpf: '',
            contractorZip: '',
            contractorStreet: '',
            contractorNeighborhood: '',
            contractorCity: '',
            contractorState: '',
            contractedName: '',
            contractedDocument: '',
            contractedCity: '',
            contractValue: '',
            treatmentsDescription: '',
            contractDate: '',
          },
        },
        'contract-1',
      ),
    );

    await harness.emissionRepo.save(
      PatientContractEmission.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          templateId: 't-2',
          templateName: 'Modelo B',
          content: '<p>B</p>',
          issuedAt: new Date('2026-07-05T10:00:00.000Z'),
          responsibleName: 'Dr. B',
          patientName: 'Maria',
          formValues: {
            templateId: 't-2',
            contractorName: '',
            contractorBirthDate: '',
            contractorCpf: '',
            contractorZip: '',
            contractorStreet: '',
            contractorNeighborhood: '',
            contractorCity: '',
            contractorState: '',
            contractedName: '',
            contractedDocument: '',
            contractedCity: '',
            contractValue: '',
            treatmentsDescription: '',
            contractDate: '',
          },
        },
        CONTRACT_A,
      ),
    );

    const result = await harness.listPatientContractEmissions.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      page: 1,
      perPage: 10,
    });

    expect(result.total).toBe(2);
    expect(result.items.map((item) => item.id)).toEqual([
      CONTRACT_A,
      'contract-1',
    ]);
  });
});
