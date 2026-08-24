import { PatientContractEmissionNotFoundError } from '../../../domain/errors/patient-contract-emission-not-found.error';
import { STORE_A } from '../../../tests/patient-contract-emissions-test.fixtures';
import {
  CONTRACT_A,
  createPatientContractEmissionsTestHarness,
  PATIENT_A,
  SAMPLE_CONTRACT_INPUT,
  seedPatient,
} from '../../../tests/patient-contract-emissions-test.fixtures';
import { PatientContractEmission } from '../../../domain/entities/patient-contract-emission.entity';

describe('DeletePatientContractEmissionUseCase', () => {
  it('deletes an existing contract emission', async () => {
    const harness = createPatientContractEmissionsTestHarness();
    seedPatient(harness);

    await harness.emissionRepo.save(
      PatientContractEmission.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          templateId: 't-1',
          templateName: 'Modelo',
          content: '<p>x</p>',
          issuedAt: new Date(),
          responsibleName: 'Dr.',
          patientName: 'Maria',
          formValues: SAMPLE_CONTRACT_INPUT,
        },
        CONTRACT_A,
      ),
    );

    await harness.deletePatientContractEmission.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      contractId: CONTRACT_A,
    });

    const remaining = await harness.emissionRepo.findById(
      STORE_A,
      PATIENT_A,
      CONTRACT_A,
    );
    expect(remaining).toBeNull();
  });

  it('throws when contract does not exist', async () => {
    const harness = createPatientContractEmissionsTestHarness();
    seedPatient(harness);

    await expect(
      harness.deletePatientContractEmission.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        contractId: CONTRACT_A,
      }),
    ).rejects.toBeInstanceOf(PatientContractEmissionNotFoundError);
  });
});
