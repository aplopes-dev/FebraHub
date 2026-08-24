import { ElectronicSignature } from '../../../domain/entities/electronic-signature.entity';
import {
  CONTRACT_A,
  PATIENT_A,
  SAMPLE_PDF_BASE64,
  STORE_A,
  createSignaturesTestHarness,
  seedPatientWithPhone,
  seedUnsignedContract,
} from '../../../tests/signatures-test.fixtures';
import { GetSignatureByTargetUseCase } from './get-signature-by-target.use-case';

describe('GetSignatureByTargetUseCase', () => {
  it('returns persisted signature without calling ZapSign when sync is false', async () => {
    const harness = createSignaturesTestHarness();
    seedPatientWithPhone(harness);
    seedUnsignedContract(harness);

    const created = await harness.requestContractSignature.execute({
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

    const getCallsBefore = harness.zapSign.getDocumentCalls.length;
    const useCase = new GetSignatureByTargetUseCase(
      harness.signatureRepo,
      harness.zapSign,
      harness.handleZapSignWebhook,
    );

    const result = await useCase.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      kind: 'contract',
      targetId: CONTRACT_A,
      sync: false,
    });

    expect(result.id).toBe(created.id);
    expect(harness.zapSign.getDocumentCalls.length).toBe(getCallsBefore);
  });

  it('calls ZapSign when sync is true and signature is pending', async () => {
    const harness = createSignaturesTestHarness();
    seedPatientWithPhone(harness);
    seedUnsignedContract(harness);

    await harness.requestContractSignature.execute({
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

    const getCallsBefore = harness.zapSign.getDocumentCalls.length;
    const useCase = new GetSignatureByTargetUseCase(
      harness.signatureRepo,
      harness.zapSign,
      harness.handleZapSignWebhook,
    );

    await useCase.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      kind: 'contract',
      targetId: CONTRACT_A,
      sync: true,
    });

    expect(harness.zapSign.getDocumentCalls.length).toBe(getCallsBefore + 1);
  });

  it('does not call ZapSign for already signed signatures even with sync', async () => {
    const harness = createSignaturesTestHarness();
    const now = new Date();
    const signed = ElectronicSignature.create({
      storeId: STORE_A,
      patientId: PATIENT_A,
      kind: 'contract',
      targetId: CONTRACT_A,
      zapsignDocumentToken: 'tok-signed',
      originalPdfObjectKey: `${STORE_A}/signatures/tok-signed.pdf`,
      status: 'signed',
      signers: [
        {
          role: 'patient',
          name: 'Paciente',
          phone: '73999990000',
          email: '',
          signUrl: 'https://example.com/p',
          zapsignSignerToken: 's1',
          status: 'signed',
          signedAt: now.toISOString(),
        },
        {
          role: 'responsible',
          name: 'Clínica',
          phone: '7336211234',
          email: 'a@b.com',
          signUrl: 'https://example.com/c',
          zapsignSignerToken: 's2',
          status: 'signed',
          signedAt: now.toISOString(),
        },
      ],
      requestedById: 'user-1',
      requestedByName: 'Operador',
      requestedAt: now,
      completedAt: now,
    });
    await harness.signatureRepo.save(signed);

    const useCase = new GetSignatureByTargetUseCase(
      harness.signatureRepo,
      harness.zapSign,
      harness.handleZapSignWebhook,
    );

    const getCallsBefore = harness.zapSign.getDocumentCalls.length;
    const result = await useCase.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      kind: 'contract',
      targetId: CONTRACT_A,
      sync: true,
    });

    expect(result.status).toBe('signed');
    expect(harness.zapSign.getDocumentCalls.length).toBe(getCallsBefore);
  });
});
