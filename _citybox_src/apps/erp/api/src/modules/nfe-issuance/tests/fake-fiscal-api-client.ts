import {
  FiscalApiClient,
  type IssueNfeRequest,
  type IssueNfeResult,
  type ResolvedFiscalCompany,
} from '../domain/providers/fiscal-api-client.interface';

/** Fake do transporte para a fiscal-api — testes não fazem rede real (molde `nfse-issuance`). */
export class FakeFiscalApiClient extends FiscalApiClient {
  public readonly requests: IssueNfeRequest[] = [];
  public result: IssueNfeResult = {
    status: 'AUTHORIZED',
    accessKey: 'chave-de-acesso',
    protocol: 'protocolo-123',
    errorCode: null,
    errorMessage: null,
    documentId: 'fiscal-document-1',
  };
  public error: Error | null = null;
  public companyIdByCnpj = new Map<string, string>();
  public defaultEnvironmentByCnpj = new Map<
    string,
    'HOMOLOGATION' | 'PRODUCTION'
  >();

  issueNfe(request: IssueNfeRequest): Promise<IssueNfeResult> {
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
