import type { ListTransactionDocumentsResult } from '../../../../application/use-cases/list-transaction-documents/list-transaction-documents.use-case';

export class ListTransactionDocumentsPresenter {
  static toHttp(result: ListTransactionDocumentsResult) {
    return {
      data: {
        items: result.items.map((item) => ({
          id: item.id,
          name: item.name,
          sizeLabel: item.sizeLabel,
          kind: item.kind,
          source: item.source,
          sentAt: item.sentAt?.toISOString() ?? null,
          sentChannel: item.sentChannel,
          path: item.path,
        })),
        checklist: result.checklist,
      },
    };
  }
}
