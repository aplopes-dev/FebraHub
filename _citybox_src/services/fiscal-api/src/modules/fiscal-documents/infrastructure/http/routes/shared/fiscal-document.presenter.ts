import type { FiscalDocument } from '../../../../domain/entities/fiscal-document.entity';
import type { FiscalEvent } from '../../../../domain/entities/fiscal-event.entity';
import {
  toFiscalDocumentResponse,
  toFiscalEventResponse,
} from './fiscal-document-response.mapper';

type ListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export class FiscalDocumentPresenter {
  static toHttp(document: FiscalDocument) {
    return { data: toFiscalDocumentResponse(document) };
  }

  static toListHttp(documents: FiscalDocument[], meta: ListMeta) {
    return { data: documents.map(toFiscalDocumentResponse), meta };
  }

  static toEventsHttp(events: FiscalEvent[]) {
    return { data: events.map(toFiscalEventResponse) };
  }

  static toEventHttp(event: FiscalEvent) {
    return { data: toFiscalEventResponse(event) };
  }
}
