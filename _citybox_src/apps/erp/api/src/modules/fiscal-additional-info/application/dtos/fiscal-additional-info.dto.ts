import type {
  AdditionalInfoTarget,
  FiscalDocumentType,
} from '../../domain/entities/fiscal-additional-info.entity';

export type CreateFiscalAdditionalInfoDto = {
  organizationId: string;
  name: string;
  text: string;
  documentType: FiscalDocumentType;
  target: AdditionalInfoTarget;
};

export type UpdateFiscalAdditionalInfoDto = {
  organizationId: string;
  id: string;
  name: string;
  text: string;
  target: AdditionalInfoTarget;
};

export type ListFiscalAdditionalInfosDto = {
  organizationId: string;
  documentType?: FiscalDocumentType;
};

/** Informação já resolvida para a emissão (spec erp/017, plan D7). */
export type ResolvedDocumentAdditionalInfo = {
  /** `infAdic/infCpl` (NF-e/NFC-e) ou `serv/infoCompl/xInfComp` (NFS-e). */
  infCpl?: string;
  /** `infAdic/infAdFisco` — só NF-e/NFC-e (NFS-e nunca preenche). */
  infAdFisco?: string;
};
