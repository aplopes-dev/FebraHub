import { FiscalDocumentSummaryPresenter } from './fiscal-document-summary.presenter';

describe('FiscalDocumentSummaryPresenter', () => {
  it('wraps the counts in the {data} envelope (contracts/fiscal-documents.md)', () => {
    const response = FiscalDocumentSummaryPresenter.toHttp({
      total: 128,
      authorized: 110,
      cancelled: 6,
    });

    expect(response).toEqual({
      data: { total: 128, authorized: 110, cancelled: 6 },
    });
  });
});
