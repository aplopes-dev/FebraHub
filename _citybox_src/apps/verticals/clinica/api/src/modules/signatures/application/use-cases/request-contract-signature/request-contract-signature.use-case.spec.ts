import {
  CONTRACT_A,
  PATIENT_A,
  SAMPLE_PDF_BASE64,
  STORE_A,
  createSignaturesTestHarness,
  seedPatientWithPhone,
  seedUnsignedContract,
} from '../../../tests/signatures-test.fixtures';

describe('RequestContractSignatureUseCase', () => {
  it('creates document with two signers in order', async () => {
    const harness = createSignaturesTestHarness();
    seedPatientWithPhone(harness);
    seedUnsignedContract(harness);

    const signature = await harness.requestContractSignature.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      contractId: CONTRACT_A,
      fileBase64: SAMPLE_PDF_BASE64,
      responsible: {
        name: 'Clínica Sorriso',
        phone: '7336211234',
        email: 'contato@clinica.com',
      },
      requestedById: 'user-1',
      requestedByName: 'Operador',
    });

    expect(signature.signers).toHaveLength(2);
    expect(signature.signers[0]?.role).toBe('patient');
    expect(signature.signers[1]?.role).toBe('responsible');
    expect(harness.zapSign.createCalls[0]?.signatureOrderActive).toBe(true);
    expect(harness.zapSign.createCalls[0]?.signers[0]?.sendAutomaticEmail).toBe(
      true,
    );
    expect(harness.zapSign.createCalls[0]?.signers[1]?.sendAutomaticEmail).toBe(
      true,
    );
    expect((await harness.creditBalanceRepo.findByStoreId(STORE_A))?.balance).toBe(
      9,
    );

    const contract = await harness.contractRepo.findById(
      STORE_A,
      PATIENT_A,
      CONTRACT_A,
    );
    expect(contract?.patientSignatureStatus).toBe('pending');
    expect(contract?.responsibleSignatureStatus).toBe('pending');
  });
});
