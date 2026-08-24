import { ElectronicSignatureDocumentNotReadyError } from '../../../domain/errors/electronic-signature-document-not-ready.error';
import { ElectronicSignatureInvalidPdfError } from '../../../domain/errors/electronic-signature-invalid-pdf.error';
import { SignatureCreditsInsufficientError } from '../../../../signature-packages/domain/errors/signature-credits-insufficient.error';
import {
  ANAMNESIS_A,
  PATIENT_A,
  SAMPLE_PDF_BASE64,
  STORE_A,
  createSignaturesTestHarness,
  seedIssuedAnamnesis,
  seedPatientWithPhone,
} from '../../../tests/signatures-test.fixtures';

describe('RequestAnamnesisSignatureUseCase', () => {
  it('creates ZapSign document and marks anamnesis pending', async () => {
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

    expect(signature.status).toBe('pending');
    expect(signature.kind).toBe('anamnesis');
    expect(signature.signers).toHaveLength(1);
    expect(signature.signers[0]?.signUrl).toContain('zapsign');
    expect(harness.zapSign.createCalls).toHaveLength(1);
    expect(harness.zapSign.createCalls[0]?.signers[0]?.sendAutomaticEmail).toBe(
      false,
    );
    expect((await harness.creditBalanceRepo.findByStoreId(STORE_A))?.balance).toBe(
      9,
    );

    const anamnesis = await harness.anamnesisRepo.findById(
      STORE_A,
      PATIENT_A,
      ANAMNESIS_A,
    );
    expect(anamnesis?.signatureStatus).toBe('pending');
  });

  it('rejects when signature credits are insufficient', async () => {
    const harness = createSignaturesTestHarness({ initialCredits: 0 });
    seedPatientWithPhone(harness);
    seedIssuedAnamnesis(harness);

    await expect(
      harness.requestAnamnesisSignature.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        anamnesisId: ANAMNESIS_A,
        fileBase64: SAMPLE_PDF_BASE64,
        requestedById: 'user-1',
        requestedByName: 'Operador',
      }),
    ).rejects.toBeInstanceOf(SignatureCreditsInsufficientError);
    expect(harness.zapSign.createCalls).toHaveLength(0);
  });

  it('refunds credit when ZapSign fails after debit', async () => {
    const harness = createSignaturesTestHarness({ initialCredits: 3 });
    seedPatientWithPhone(harness);
    seedIssuedAnamnesis(harness);
    harness.zapSign.failNextCreate = true;

    await expect(
      harness.requestAnamnesisSignature.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        anamnesisId: ANAMNESIS_A,
        fileBase64: SAMPLE_PDF_BASE64,
        requestedById: 'user-1',
        requestedByName: 'Operador',
      }),
    ).rejects.toThrow('ZapSign unavailable');

    expect((await harness.creditBalanceRepo.findByStoreId(STORE_A))?.balance).toBe(
      3,
    );
  });

  it('uses guardian contact for minors', async () => {
    const harness = createSignaturesTestHarness();
    seedPatientWithPhone(harness, {
      birthDate: new Date('2015-01-01'),
      guardianName: 'Responsável Legal',
      guardianPhone: '73988776655',
    });
    seedIssuedAnamnesis(harness);

    await harness.requestAnamnesisSignature.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      anamnesisId: ANAMNESIS_A,
      fileBase64: SAMPLE_PDF_BASE64,
      requestedById: 'user-1',
      requestedByName: 'Operador',
    });

    expect(harness.zapSign.createCalls[0]?.signers[0]?.name).toBe(
      'Responsável Legal',
    );
    expect(harness.zapSign.createCalls[0]?.signers[0]?.phoneNumber).toBe(
      '73988776655',
    );
  });

  it('rejects invalid PDF', async () => {
    const harness = createSignaturesTestHarness();
    seedPatientWithPhone(harness);
    seedIssuedAnamnesis(harness);

    await expect(
      harness.requestAnamnesisSignature.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        anamnesisId: ANAMNESIS_A,
        fileBase64: Buffer.from('not-a-pdf').toString('base64'),
        requestedById: 'user-1',
        requestedByName: 'Operador',
      }),
    ).rejects.toBeInstanceOf(ElectronicSignatureInvalidPdfError);
    expect((await harness.creditBalanceRepo.findByStoreId(STORE_A))?.balance).toBe(
      10,
    );
  });

  it('rejects when anamnesis already pending', async () => {
    const harness = createSignaturesTestHarness();
    seedPatientWithPhone(harness);
    seedIssuedAnamnesis(harness);

    await harness.requestAnamnesisSignature.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      anamnesisId: ANAMNESIS_A,
      fileBase64: SAMPLE_PDF_BASE64,
      requestedById: 'user-1',
      requestedByName: 'Operador',
    });

    await expect(
      harness.requestAnamnesisSignature.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        anamnesisId: ANAMNESIS_A,
        fileBase64: SAMPLE_PDF_BASE64,
        requestedById: 'user-1',
        requestedByName: 'Operador',
      }),
    ).rejects.toBeInstanceOf(ElectronicSignatureDocumentNotReadyError);
  });
});
