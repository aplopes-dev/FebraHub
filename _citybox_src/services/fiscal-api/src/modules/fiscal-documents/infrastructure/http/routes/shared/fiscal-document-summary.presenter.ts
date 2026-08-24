import type { FiscalDocumentStatusCounts } from '../../../../domain/repositories/fiscal-document.repository.interface';

/** `GET /v1/fiscal-documents/summary` (spec `009-facilita-nfe-screen`, contracts). */
export class FiscalDocumentSummaryPresenter {
  static toHttp(counts: FiscalDocumentStatusCounts) {
    return {
      data: {
        total: counts.total,
        authorized: counts.authorized,
        cancelled: counts.cancelled,
      },
    };
  }
}
