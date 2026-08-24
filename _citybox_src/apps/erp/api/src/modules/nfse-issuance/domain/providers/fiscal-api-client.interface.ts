/**
 * Cliente server-to-server para a `services/fiscal-api` (spec erp/018). Isolado
 * atrás desta interface para trocar transporte/auth num único ponto e permitir
 * mock nos testes (sem rede real).
 */

export type FiscalApiCustomerAddress = {
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  uf: string;
  cityCodeIbge?: string | null;
  zipCode?: string | null;
};

export type FiscalApiCustomer = {
  documentType: 'CPF' | 'CNPJ';
  document: string;
  name: string;
  email?: string | null;
  address?: FiscalApiCustomerAddress | null;
};

export type FiscalApiNfseService = {
  serviceDescription: string;
  municipalServiceCode: string;
  nationalServiceCode?: string | null;
  issRate?: number | null;
  issWithheld: boolean;
  tribISSQN?: '1' | '2' | '3' | '4';
};

export type FiscalApiNfseItem = {
  description: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  serviceCode: string;
};

/** Espelha o `IssueNfseDto` da fiscal-api (`POST /api/v1/nfse`). */
export type IssueNfseRequest = {
  companyId: string;
  sourceSystem: string;
  externalReference: string;
  idempotencyKey: string;
  environment: 'HOMOLOGATION' | 'PRODUCTION';
  customer: FiscalApiCustomer;
  nfse: FiscalApiNfseService;
  items: FiscalApiNfseItem[];
};

export type IssueNfseResult = {
  status: string;
  accessKey: string | null;
  protocol: string | null;
  /**
   * Código/mensagem de rejeição do órgão (spec erp/028) — nulos quando
   * AUTHORIZED. A fiscal-api já devolve os dois no corpo de `POST /v1/nfse`
   * (mesmo presenter usado por `GET /v1/fiscal-documents`).
   */
  errorCode: string | null;
  errorMessage: string | null;
  /** Id do documento na fiscal-api (`FiscalDocument.id`, spec erp/029) —
   * necessário para montar a URL de download (`GET /v1/nfse/:id/xml|danfse`). */
  documentId: string | null;
};

/**
 * spec erp/025 (P2): `defaultEnvironment` vem junto da resolução do Emitente
 * — a fiscal-api já devolve esse campo em `GET /v1/companies?cnpj=`
 * (`company-response.mapper.ts`), só não era lido antes. Elimina a chamada
 * extra e a constante `HOMOLOGATION` fixa que existia em `issue-nfse.use-case.ts`.
 */
export type ResolvedFiscalCompany = {
  id: string;
  defaultEnvironment: 'HOMOLOGATION' | 'PRODUCTION';
};

export abstract class FiscalApiClient {
  /**
   * Emite a NFS-e na fiscal-api. Sucesso → `{status, accessKey?, protocol?}`.
   * Recusa do órgão / indisponibilidade → lança `FiscalApiEmissionError` com
   * mensagem de negócio já traduzida (E0116/E0310/E0625/…).
   */
  abstract issueNfse(request: IssueNfseRequest): Promise<IssueNfseResult>;

  /**
   * Resolve o Emitente da fiscal-api pelo CNPJ (id + ambiente configurado).
   * Usado para o erp-api **derivar** o `companyId` do CNPJ da própria
   * organização, em vez de confiar num id vindo do cliente (isolamento de
   * tenant — spec erp/018). `null` quando não há Emitente para o CNPJ.
   */
  abstract findCompanyIdByCnpj(
    cnpj: string,
  ): Promise<ResolvedFiscalCompany | null>;
}
