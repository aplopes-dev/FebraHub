import type { ListInvoicesResult } from '../../../../application/use-cases/list-invoices/list-invoices.use-case';
import { toInvoiceResponse } from '../shared/invoice-response.mapper';

export class ListInvoicesPresenter {
  static toHttp(result: ListInvoicesResult) {
    return {
      data: result.invoices.map(toInvoiceResponse),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
