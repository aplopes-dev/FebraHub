/**
 * Cliente server-to-server para a `services/fiscal-api` (spec erp/026, molde
 * `nfse-issuance/domain/providers/fiscal-api-client.interface.ts`). Isolado
 * atrás desta interface para trocar transporte/auth num único ponto e
 * permitir mock nos testes (sem rede real).
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

export type FiscalApiNfePisCofins = {
  cst: string;
  aliquota?: number | null;
};

export type FiscalApiNfeIpi = {
  cst: string;
  cEnq: string;
  aliquota?: number | null;
};

/** Espelha `IssueNfeItemDto` da fiscal-api (spec erp/026, FR-002/FR-003). */
export type FiscalApiNfeItem = {
  description: string;
  ncm: string;
  cfop: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  cst?: string | null;
  csosn?: string | null;
  icmsAliquota?: number | null;
  origem?: string | null;
  pis?: FiscalApiNfePisCofins | null;
  cofins?: FiscalApiNfePisCofins | null;
  ipi?: FiscalApiNfeIpi | null;
};

/** Um `detPag` por forma de pagamento real do pedido (spec erp/029). */
export type FiscalApiNfePayment = {
  /** `tPag` — código de 2 dígitos (`PaymentMethod.fiscalCode`). */
  method: string;
  amount: number;
  /** `xPag` — obrigatório quando `method === '99'`. */
  description?: string;
};

/** Espelha o `IssueNfeDto` da fiscal-api (`POST /v1/nfe`). */
export type IssueNfeRequest = {
  companyId: string;
  sourceSystem: string;
  externalReference: string;
  idempotencyKey: string;
  environment: 'HOMOLOGATION' | 'PRODUCTION';
  operationNature: string;
  operationType: '0' | '1';
  destinationIndicator?: '1' | '2' | '3';
  finalConsumer: boolean;
  presenceIndicator: '1' | '2' | '3' | '9';
  /** Mantido por compatibilidade com o DTO da fiscal-api (ainda obrigatório
   * lá) — sempre `payments[0].method` quando `payments` tem 1 item, ou o
   * `fiscalCode` da 1ª forma quando há mais de uma (a fiscal-api usa
   * `payments` com precedência sobre este campo quando ambos vêm). */
  paymentMethodCode: string;
  /** Um `detPag` por pagamento real do pedido — sempre preenchido pelo
   * `IssueNfeUseCase` (spec erp/029; nunca mais um `99` fixo). */
  payments: FiscalApiNfePayment[];
  customer: FiscalApiCustomer;
  items: FiscalApiNfeItem[];
};

export type IssueNfeResult = {
  status: string;
  accessKey: string | null;
  protocol: string | null;
  /**
   * Código/mensagem de rejeição do órgão (spec erp/028) — nulos quando
   * AUTHORIZED. A fiscal-api já devolve os dois no corpo de `POST /v1/nfe`
   * (mesmo presenter usado por `GET /v1/fiscal-documents`).
   */
  errorCode: string | null;
  errorMessage: string | null;
  /** Id do documento na fiscal-api (`FiscalDocument.id`, spec erp/029) —
   * necessário para montar a URL de download (`GET /v1/nfe/:id/xml|danfe`). */
  documentId: string | null;
};

/** Mesmo padrão de `nfse-issuance` (spec erp/025, P2) — nunca assumir
 * PRODUCTION por omissão. */
export type ResolvedFiscalCompany = {
  id: string;
  defaultEnvironment: 'HOMOLOGATION' | 'PRODUCTION';
};

export abstract class FiscalApiClient {
  /**
   * Emite a NF-e na fiscal-api. Sucesso → `{status, accessKey?, protocol?}`.
   * Recusa do órgão / indisponibilidade → lança `FiscalApiEmissionError` com
   * mensagem de negócio já traduzida.
   */
  abstract issueNfe(request: IssueNfeRequest): Promise<IssueNfeResult>;

  /**
   * Resolve o Emitente da fiscal-api pelo CNPJ (id + ambiente configurado).
   * `null` quando não há Emitente para o CNPJ.
   */
  abstract findCompanyIdByCnpj(
    cnpj: string,
  ): Promise<ResolvedFiscalCompany | null>;
}
