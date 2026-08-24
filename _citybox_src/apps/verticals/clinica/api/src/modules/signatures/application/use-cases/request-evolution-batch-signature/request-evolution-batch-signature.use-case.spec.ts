import {
  EVOLUTION_A,
  EVOLUTION_B,
  PATIENT_A,
  SAMPLE_PDF_BASE64,
  STORE_A,
  createSignaturesTestHarness,
  seedPatientWithPhone,
  seedUnsignedEvolutions,
} from '../../../tests/signatures-test.fixtures';

describe('RequestEvolutionBatchSignatureUseCase', () => {
  it('creates one ZapSign document for multiple evolutions', async () => {
    const harness = createSignaturesTestHarness();
    seedPatientWithPhone(harness);
    seedUnsignedEvolutions(harness);

    const signature = await harness.requestEvolutionBatchSignature.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      evolutionIds: [EVOLUTION_A, EVOLUTION_B],
      fileBase64: SAMPLE_PDF_BASE64,
      requestedById: 'user-1',
      requestedByName: 'Operador',
    });

    expect(signature.kind).toBe('evolution_batch');
    expect(signature.targetIds).toEqual([EVOLUTION_A, EVOLUTION_B]);
    expect(harness.zapSign.createCalls).toHaveLength(1);
    expect((await harness.creditBalanceRepo.findByStoreId(STORE_A))?.balance).toBe(
      9,
    );

    const evoA = await harness.evolutionRepo.findById(
      STORE_A,
      PATIENT_A,
      EVOLUTION_A,
    );
    const evoB = await harness.evolutionRepo.findById(
      STORE_A,
      PATIENT_A,
      EVOLUTION_B,
    );
    expect(evoA?.signatureStatus).toBe('pending');
    expect(evoB?.signatureStatus).toBe('pending');
    expect(evoA?.signatureRequestId).toBe(signature.id);
  });

  it('finds pending batch signature by evolution id in targetIds', async () => {
    const harness = createSignaturesTestHarness();
    seedPatientWithPhone(harness);
    seedUnsignedEvolutions(harness);

    const signature = await harness.requestEvolutionBatchSignature.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      evolutionIds: [EVOLUTION_A, EVOLUTION_B],
      fileBase64: SAMPLE_PDF_BASE64,
      requestedById: 'user-1',
      requestedByName: 'Operador',
    });

    const byTargetA = await harness.signatureRepo.findLatestByTarget(
      STORE_A,
      'evolution_batch',
      EVOLUTION_A,
    );
    const byTargetB = await harness.signatureRepo.findPendingByTarget(
      STORE_A,
      'evolution_batch',
      EVOLUTION_B,
    );

    expect(byTargetA?.id).toBe(signature.id);
    expect(byTargetB?.id).toBe(signature.id);
  });
});
