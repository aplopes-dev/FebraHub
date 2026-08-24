import type {
  AdditionalInfoTarget,
  FiscalDocumentType,
} from "@/features/fiscal-additional-info/lib/document-type-options";

/** Item como devolvido pela erp-api (presenter). */
export type FiscalAdditionalInfoDto = {
  id: string;
  name: string;
  text: string;
  documentType: FiscalDocumentType;
  target: AdditionalInfoTarget;
  /** Teto do XSD para o campo (documento × destino) — a UI avisa antes de estourar. */
  maxLength: number;
  createdAt: string;
  updatedAt: string;
};

export type FiscalAdditionalInfoListResponseDto = {
  data: FiscalAdditionalInfoDto[];
};

export type FiscalAdditionalInfoResponseDto = {
  data: FiscalAdditionalInfoDto;
};

/** Corpo de criação (documentType só na criação — imutável depois). */
export type CreateFiscalAdditionalInfoPayload = {
  name: string;
  text: string;
  documentType: FiscalDocumentType;
  target: AdditionalInfoTarget;
};

/** Corpo de edição (sem documentType). */
export type UpdateFiscalAdditionalInfoPayload = {
  name: string;
  text: string;
  target: AdditionalInfoTarget;
};

export type FiscalAdditionalInfo = FiscalAdditionalInfoDto;

/** spec erp/023, N7 — contagem por tipo de documento, usada no card do hub. */
export type FiscalAdditionalInfoCounts = {
  NFE: number;
  NFCE: number;
  NFSE: number;
  total: number;
};

export type FiscalAdditionalInfoCountsResponseDto = {
  data: FiscalAdditionalInfoCounts;
};
