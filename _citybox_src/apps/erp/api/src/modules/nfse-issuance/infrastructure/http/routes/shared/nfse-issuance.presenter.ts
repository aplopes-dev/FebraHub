import type { NfseIssuance } from '../../../../domain/entities/nfse-issuance.entity';

export class NfseIssuancePresenter {
  static toHttpDetail(issuance: NfseIssuance) {
    return {
      id: issuance.id,
      companyId: issuance.companyId,
      externalReference: issuance.externalReference,
      accessKey: issuance.accessKey,
      protocol: issuance.protocol,
      status: issuance.status,
      environment: issuance.environment,
      errorCode: issuance.errorCode,
      errorMessage: issuance.errorMessage,
      fiscalDocumentId: issuance.fiscalDocumentId,
      createdAt: issuance.createdAt.toISOString(),
      updatedAt: issuance.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(issuance: NfseIssuance) {
    return { data: NfseIssuancePresenter.toHttpDetail(issuance) };
  }

  static toHttpList(issuances: NfseIssuance[]) {
    return {
      data: issuances.map((issuance) =>
        NfseIssuancePresenter.toHttpDetail(issuance),
      ),
    };
  }
}
