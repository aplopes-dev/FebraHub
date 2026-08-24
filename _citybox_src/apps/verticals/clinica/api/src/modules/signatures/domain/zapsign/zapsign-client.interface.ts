export type ZapSignCreateSignerInput = {
  name: string;
  email?: string;
  phoneCountry?: string;
  phoneNumber?: string;
  authMode?: string;
  sendAutomaticEmail?: boolean;
  sendAutomaticWhatsapp?: boolean;
};

export type ZapSignCreateDocumentInput = {
  name: string;
  base64Pdf: string;
  externalId: string;
  signers: ZapSignCreateSignerInput[];
  signatureOrderActive?: boolean;
  lang?: string;
};

export type ZapSignSignerResponse = {
  token: string;
  status: string;
  name: string;
  email: string;
  phoneCountry: string;
  phoneNumber: string;
  signUrl: string;
  signedAt: string | null;
};

export type ZapSignDocumentResponse = {
  token: string;
  status: string;
  name: string;
  originalFile: string | null;
  signedFile: string | null;
  signers: ZapSignSignerResponse[];
};

export abstract class ZapSignClient {
  abstract createDocument(
    input: ZapSignCreateDocumentInput,
  ): Promise<ZapSignDocumentResponse>;

  abstract getDocument(token: string): Promise<ZapSignDocumentResponse>;

  abstract downloadSignedPdf(signedFileUrl: string): Promise<Buffer>;

  abstract cancelDocument(token: string): Promise<void>;
}
