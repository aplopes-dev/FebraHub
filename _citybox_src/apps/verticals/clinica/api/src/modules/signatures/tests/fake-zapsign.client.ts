import {
  ZapSignClient,
  type ZapSignCreateDocumentInput,
  type ZapSignDocumentResponse,
} from '../domain/zapsign/zapsign-client.interface';

export class FakeZapSignClient extends ZapSignClient {
  createCalls: ZapSignCreateDocumentInput[] = [];
  getDocumentCalls: string[] = [];
  cancelCalls: string[] = [];
  documents = new Map<string, ZapSignDocumentResponse>();
  signedPdf = Buffer.from('%PDF-1.4 signed');
  failNextCreate = false;

  async createDocument(
    input: ZapSignCreateDocumentInput,
  ): Promise<ZapSignDocumentResponse> {
    this.createCalls.push(input);
    if (this.failNextCreate) {
      this.failNextCreate = false;
      throw new Error('ZapSign unavailable');
    }
    const token = `doc-${this.createCalls.length}`;
    const response: ZapSignDocumentResponse = {
      token,
      status: 'pending',
      name: input.name,
      originalFile: null,
      signedFile: null,
      signers: input.signers.map((signer, index) => ({
        token: `${token}-signer-${index + 1}`,
        status: 'new',
        name: signer.name,
        email: signer.email ?? '',
        phoneCountry: signer.phoneCountry ?? '55',
        phoneNumber: signer.phoneNumber ?? '',
        signUrl: `https://sandbox.zapsign.com.br/verificar/${token}-${index + 1}`,
        signedAt: null,
      })),
    };
    this.documents.set(token, response);
    return response;
  }

  async getDocument(token: string): Promise<ZapSignDocumentResponse> {
    this.getDocumentCalls.push(token);
    const doc = this.documents.get(token);
    if (!doc) {
      throw new Error(`Documento ZapSign não encontrado: ${token}`);
    }
    return doc;
  }

  async downloadSignedPdf(_signedFileUrl: string): Promise<Buffer> {
    return this.signedPdf;
  }

  async cancelDocument(token: string): Promise<void> {
    this.cancelCalls.push(token);
  }
}

export const SAMPLE_PDF_BASE64 = Buffer.from('%PDF-1.4 sample').toString(
  'base64',
);
