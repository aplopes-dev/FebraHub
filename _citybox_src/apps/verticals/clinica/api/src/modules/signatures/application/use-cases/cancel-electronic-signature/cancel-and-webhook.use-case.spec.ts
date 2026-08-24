import {
  ANAMNESIS_A,
  CONTRACT_A,
  PATIENT_A,
  SAMPLE_PDF_BASE64,
  STORE_A,
  createSignaturesTestHarness,
  seedIssuedAnamnesis,
  seedPatientWithPhone,
  seedUnsignedContract,
} from '../../../tests/signatures-test.fixtures';

describe('CancelElectronicSignatureUseCase + HandleZapSignWebhookUseCase', () => {
  it('cancels pending signature and reverts anamnesis to unsigned', async () => {
    const harness = createSignaturesTestHarness();
    seedPatientWithPhone(harness);
    seedIssuedAnamnesis(harness);

    const signature = await harness.requestAnamnesisSignature.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      anamnesisId: ANAMNESIS_A,
      fileBase64: SAMPLE_PDF_BASE64,
      requestedById: 'user-1',
      requestedByName: 'Operador',
    });

    const cancelled = await harness.cancelElectronicSignature.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      signatureId: signature.id,
    });

    expect(cancelled.status).toBe('cancelled');
    expect(harness.zapSign.cancelCalls).toContain(signature.zapsignDocumentToken);

    const anamnesis = await harness.anamnesisRepo.findById(
      STORE_A,
      PATIENT_A,
      ANAMNESIS_A,
    );
    expect(anamnesis?.signatureStatus).toBe('unsigned');
  });

  it('marks signed on final webhook and stores PDF', async () => {
    const harness = createSignaturesTestHarness();
    seedPatientWithPhone(harness);
    seedIssuedAnamnesis(harness);

    const signature = await harness.requestAnamnesisSignature.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      anamnesisId: ANAMNESIS_A,
      fileBase64: SAMPLE_PDF_BASE64,
      requestedById: 'user-1',
      requestedByName: 'Operador',
    });

    await harness.handleZapSignWebhook.execute({
      eventType: 'doc_signed',
      documentToken: signature.zapsignDocumentToken,
      documentStatus: 'signed',
      signedFileUrl: 'https://example.com/signed.pdf',
      signers: signature.signers.map((signer) => ({
        token: signer.zapsignSignerToken,
        status: 'signed',
        signUrl: signer.signUrl,
      })),
    });

    const updated = await harness.signatureRepo.findById(STORE_A, signature.id);
    expect(updated?.status).toBe('signed');
    expect(updated?.signedPdfObjectKey).toBeTruthy();

    const anamnesis = await harness.anamnesisRepo.findById(
      STORE_A,
      PATIENT_A,
      ANAMNESIS_A,
    );
    expect(anamnesis?.signatureStatus).toBe('signed');
  });

  it('keeps pending on partial signer webhook for contract', async () => {
    const harness = createSignaturesTestHarness();
    seedPatientWithPhone(harness);
    seedUnsignedContract(harness);

    const signature = await harness.requestContractSignature.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      contractId: CONTRACT_A,
      fileBase64: SAMPLE_PDF_BASE64,
      responsible: { name: 'Clínica Sorriso', phone: '7336211234' },
      requestedById: 'user-1',
      requestedByName: 'Operador',
    });

    await harness.handleZapSignWebhook.execute({
      eventType: 'doc_signed',
      documentToken: signature.zapsignDocumentToken,
      documentStatus: 'pending',
      signedFileUrl: null,
      signers: [
        {
          token: signature.signers[0]?.zapsignSignerToken,
          status: 'signed',
          signUrl: signature.signers[0]?.signUrl,
        },
        {
          token: signature.signers[1]?.zapsignSignerToken,
          status: 'pending',
          signUrl: signature.signers[1]?.signUrl,
        },
      ],
    });

    const updated = await harness.signatureRepo.findById(STORE_A, signature.id);
    expect(updated?.status).toBe('pending');
  });
});
