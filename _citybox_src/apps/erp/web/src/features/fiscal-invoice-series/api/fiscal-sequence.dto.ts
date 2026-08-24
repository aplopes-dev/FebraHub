export type FiscalDocumentType = "NFE" | "NFCE" | "NFSE";
export type FiscalEnvironment = "HOMOLOGATION" | "PRODUCTION";

/** Item de série como a fiscal-api devolve (série já formatada "001", número como string). */
export type FiscalSequenceDto = {
  id: string;
  documentType: FiscalDocumentType;
  series: string;
  currentNumber: string;
  environment: FiscalEnvironment;
  active: boolean;
};

export type FiscalSequenceListResponseDto = { data: FiscalSequenceDto[] };
export type FiscalSequenceResponseDto = { data: FiscalSequenceDto };

export type CreateFiscalSequencePayload = {
  documentType: FiscalDocumentType;
  series: string;
  initialNumber?: number;
  environment: FiscalEnvironment;
};
