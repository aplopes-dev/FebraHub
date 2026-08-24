/**
 * Porta para a `services/fiscal-api`.
 *
 * O domínio conhece "listar documentos fiscais do Emitente" — nada de token M2M,
 * realm ou URL. Mesma fronteira da `IdentityProvider` do módulo `tenancy`.
 */

export type FiscalCompany = {
  id: string;
  cnpj: string;
};

export type ListFiscalDocumentsQuery = {
  companyId: string;
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  model?: string;
  issuedFrom?: string;
  issuedTo?: string;
};

/**
 * Espelha a resposta real de `GET /v1/fiscal-documents` na fiscal-api
 * (`FiscalDocumentPresenter.toListHttp`, envelope `{data, meta}`) — não uma
 * forma própria do erp-api. `data`/`meta` passam direto pela rota HTTP sem
 * remapeamento (spec erp/030: o formato antigo `{items, meta}` nunca batia
 * com o que a fiscal-api de fato devolve, então `items` sempre chegava
 * `undefined` no erp-web — achado ao investigar por que a lista não
 * carregava mesmo depois de corrigir o `companyId` na query).
 */
export type FiscalDocumentsPage = {
  data: unknown[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
};

/**
 * Espelha `FiscalDocumentSummaryPresenter.toHttp` — `{data: {..., cancelled}}`,
 * grafia com "ll" (a mesma que `services/fiscal-api` usa), não `canceled`.
 */
export type FiscalDocumentsSummary = {
  data: { total: number; authorized: number; cancelled: number };
};

export abstract class FiscalApiProvider {
  /** Emitente correspondente ao CNPJ, ou `null` se não houver cadastro fiscal. */
  abstract findCompanyByCnpj(cnpj: string): Promise<FiscalCompany | null>;

  abstract listDocuments(
    query: ListFiscalDocumentsQuery,
  ): Promise<FiscalDocumentsPage>;

  abstract getSummary(companyId: string): Promise<FiscalDocumentsSummary>;
}
