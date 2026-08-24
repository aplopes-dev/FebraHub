import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ElectronicSignature } from '../types/electronic-signature';
import type { PatientContractEmissionRecord } from '../types/patient-contract-emission';
import {
  isPatientContractFullySigned,
  printPatientContractDocument,
} from './print-patient-contract';

vi.mock('../services/electronic-signatures.service', () => ({
  getElectronicSignatureByTarget: vi.fn(),
  fetchSignedPdfBlob: vi.fn(),
}));

vi.mock('./patient-document-pdf-actions', () => ({
  printPatientDocumentPdf: vi.fn(),
}));

vi.mock('./print-patient-contract-html', () => ({
  printPatientContractHtml: vi.fn(),
}));

import {
  fetchSignedPdfBlob,
  getElectronicSignatureByTarget,
} from '../services/electronic-signatures.service';
import { printPatientDocumentPdf } from './patient-document-pdf-actions';
import { printPatientContractHtml } from './print-patient-contract-html';

function contract(
  overrides: Partial<PatientContractEmissionRecord> = {},
): PatientContractEmissionRecord {
  return {
    id: 'contract-1',
    patientId: 'patient-1',
    templateId: 'template-1',
    templateName: 'Contrato particular',
    content: '<p>Cláusulas</p>',
    issuedAt: '2026-08-18T14:00:00.000Z',
    issuedVia: 'manual',
    responsibleName: 'Clínica Sorriso',
    patientName: 'Maria Silva',
    responsibleSignatureStatus: 'unsigned',
    patientSignatureStatus: 'unsigned',
    formValues: {
      templateId: 'template-1',
      contractorName: 'Maria Silva',
      contractorBirthDate: '',
      contractorCpf: '',
      contractorZip: '',
      contractorStreet: '',
      contractorNeighborhood: '',
      contractorCity: '',
      contractorState: '',
      contractedName: 'Clínica Sorriso',
      contractedDocument: '',
      contractedCity: '',
      contractValue: '',
      treatmentsDescription: '',
      contractDate: '',
    },
    ...overrides,
  };
}

function signature(
  overrides: Partial<ElectronicSignature> = {},
): ElectronicSignature {
  return {
    id: 'sig-1',
    storeId: 'store-1',
    patientId: 'patient-1',
    kind: 'contract',
    targetId: 'contract-1',
    targetIds: null,
    status: 'signed',
    zapsignDocumentToken: 'token',
    hasSignedPdf: true,
    signers: [],
    requestedById: 'member-1',
    requestedByName: 'Dr. Ana',
    requestedAt: '2026-08-18T14:00:00.000Z',
    completedAt: '2026-08-18T15:00:00.000Z',
    cancelledAt: null,
    createdAt: '2026-08-18T14:00:00.000Z',
    updatedAt: '2026-08-18T15:00:00.000Z',
    ...overrides,
  };
}

describe('isPatientContractFullySigned', () => {
  it('is true when both parties are signed on the contract', () => {
    expect(
      isPatientContractFullySigned(
        contract({
          patientSignatureStatus: 'signed',
          responsibleSignatureStatus: 'signed',
        }),
      ),
    ).toBe(true);
  });

  it('is true when the ZapSign request is signed even if the contract row lags', () => {
    expect(
      isPatientContractFullySigned(contract(), signature({ status: 'signed' })),
    ).toBe(true);
  });

  it('is false while the signature is still pending', () => {
    expect(
      isPatientContractFullySigned(
        contract({
          patientSignatureStatus: 'pending',
          responsibleSignatureStatus: 'signed',
        }),
        signature({ status: 'pending' }),
      ),
    ).toBe(false);
  });
});

describe('printPatientContractDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prints the signed ZapSign PDF when both parties have signed', async () => {
    const signedBlob = new Blob(['%PDF-signed'], { type: 'application/pdf' });
    vi.mocked(fetchSignedPdfBlob).mockResolvedValue(signedBlob);

    await printPatientContractDocument({
      storeId: 'store-1',
      patientId: 'patient-1',
      contract: contract({
        patientSignatureStatus: 'signed',
        responsibleSignatureStatus: 'signed',
      }),
      signature: signature(),
    });

    expect(fetchSignedPdfBlob).toHaveBeenCalledWith('store-1', 'patient-1', 'sig-1');
    expect(printPatientDocumentPdf).toHaveBeenCalledWith(signedBlob);
    expect(printPatientContractHtml).not.toHaveBeenCalled();
  });

  it('loads the signature by target when printing a signed contract without a loaded request', async () => {
    const signedBlob = new Blob(['%PDF-signed'], { type: 'application/pdf' });
    vi.mocked(getElectronicSignatureByTarget).mockResolvedValue(signature());
    vi.mocked(fetchSignedPdfBlob).mockResolvedValue(signedBlob);

    await printPatientContractDocument({
      storeId: 'store-1',
      patientId: 'patient-1',
      contract: contract({
        patientSignatureStatus: 'signed',
        responsibleSignatureStatus: 'signed',
      }),
    });

    expect(getElectronicSignatureByTarget).toHaveBeenCalledWith(
      'store-1',
      'patient-1',
      'contract',
      'contract-1',
    );
    expect(printPatientDocumentPdf).toHaveBeenCalledWith(signedBlob);
  });

  it('prints the HTML content when the contract is not fully signed', async () => {
    await printPatientContractDocument({
      storeId: 'store-1',
      patientId: 'patient-1',
      contract: contract(),
    });

    expect(fetchSignedPdfBlob).not.toHaveBeenCalled();
    expect(printPatientDocumentPdf).not.toHaveBeenCalled();
    expect(printPatientContractHtml).toHaveBeenCalledWith(
      '<p>Cláusulas</p>',
      'Contrato particular',
    );
  });
});
