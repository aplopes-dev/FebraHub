import type { ElectronicSignature } from '../types/electronic-signature';
import type { PatientContractEmissionRecord } from '../types/patient-contract-emission';
import {
  fetchSignedPdfBlob,
  getElectronicSignatureByTarget,
} from '../services/electronic-signatures.service';
import { printPatientDocumentPdf } from './patient-document-pdf-actions';
import { printPatientContractHtml } from './print-patient-contract-html';

export { printPatientContractHtml };

export function isPatientContractFullySigned(
  contract: Pick<
    PatientContractEmissionRecord,
    'patientSignatureStatus' | 'responsibleSignatureStatus'
  >,
  signature?: Pick<ElectronicSignature, 'status'> | null,
): boolean {
  if (signature?.status === 'signed') {
    return true;
  }

  return (
    contract.patientSignatureStatus === 'signed' &&
    contract.responsibleSignatureStatus === 'signed'
  );
}

export async function printPatientContractDocument(input: {
  storeId: string;
  patientId: string;
  contract: PatientContractEmissionRecord;
  signature?: ElectronicSignature | null;
}): Promise<void> {
  if (!isPatientContractFullySigned(input.contract, input.signature)) {
    printPatientContractHtml(input.contract.content, input.contract.templateName);
    return;
  }

  const signature =
    input.signature?.status === 'signed'
      ? input.signature
      : await getElectronicSignatureByTarget(
          input.storeId,
          input.patientId,
          'contract',
          input.contract.id,
        );

  const blob = await fetchSignedPdfBlob(input.storeId, input.patientId, signature.id);
  printPatientDocumentPdf(blob);
}
