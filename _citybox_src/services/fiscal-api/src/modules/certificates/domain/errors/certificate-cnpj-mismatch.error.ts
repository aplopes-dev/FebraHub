import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

/// Mapeia para 422 — US3 Acceptance Scenario 2, SC-006: o CNPJ extraído do
/// certificado (e-CNPJ ICP-Brasil) deve bater com `Company.cnpj`; caso
/// contrário o upload é rejeitado sem persistir nada.
export class CertificateCnpjMismatchError extends ValidatorDomainError {
  constructor(context: string, certificateCnpj: string, companyCnpj: string) {
    super({
      internalMessage: `Certificate subjectCnpj (${certificateCnpj}) does not match Company.cnpj (${companyCnpj})`,
      externalMessage:
        'O CNPJ do certificado não corresponde ao CNPJ do emitente',
      context,
    });
  }
}
