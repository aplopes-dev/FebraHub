import type { NfeIssuance } from '../../../../domain/entities/nfe-issuance.entity';
import type { NfePreview } from '../../../../application/dtos/issue-nfe.dto';

export class NfeIssuancePresenter {
  static toHttpDetail(issuance: NfeIssuance) {
    return {
      id: issuance.id,
      saleOrderId: issuance.saleOrderId,
      companyId: issuance.companyId,
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

  static toHttpSingle(issuance: NfeIssuance) {
    return { data: NfeIssuancePresenter.toHttpDetail(issuance) };
  }

  static toHttpList(issuances: NfeIssuance[]) {
    return {
      data: issuances.map((issuance) =>
        NfeIssuancePresenter.toHttpDetail(issuance),
      ),
    };
  }

  static toHttpPreview(preview: NfePreview) {
    return { data: preview };
  }
}
