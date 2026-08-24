import {
  FiscalApiClient,
  type IssueNfseRequest,
  type IssueNfseResult,
  type ResolvedFiscalCompany,
} from '../domain/providers/fiscal-api-client.interface';

/** Fake do transporte para a fiscal-api — testes não fazem rede real. */
export class FakeFiscalApiClient extends FiscalApiClient {
  /** Requests capturados, para asserção do que o erp-api montou. */
  public readonly requests: IssueNfseRequest[] = [];
  public result: IssueNfseResult = {
    status: 'AUTHORIZED',
    accessKey: 'chave-de-acesso',
    protocol: 'protocolo-123',
    errorCode: null,
    errorMessage: null,
    documentId: 'fiscal-document-1',
  };
  public error: Error | null = null;
  /** `Company.id` devolvido por `findCompanyIdByCnpj` (por CNPJ). */
  public companyIdByCnpj = new Map<string, string>();
  /**
   * `Company.defaultEnvironment` devolvido junto do id (spec erp/025, P2).
   * Por CNPJ — mesmo mapa de chave que `companyIdByCnpj`, default
   * `HOMOLOGATION` quando não configurado explicitamente pelo teste.
   */
  public defaultEnvironmentByCnpj = new Map<
    string,
    'HOMOLOGATION' | 'PRODUCTION'
  >();

  issueNfse(request: IssueNfseRequest): Promise<IssueNfseResult> {
    this.requests.push(request);
    if (this.error) return Promise.reject(this.error);
    return Promise.resolve(this.result);
  }

  findCompanyIdByCnpj(cnpj: string): Promise<ResolvedFiscalCompany | null> {
    const digits = cnpj.replace(/\D/g, '');
    const id = this.companyIdByCnpj.get(digits);
    if (!id) return Promise.resolve(null);
    return Promise.resolve({
      id,
      defaultEnvironment:
        this.defaultEnvironmentByCnpj.get(digits) ?? 'HOMOLOGATION',
    });
  }
}
