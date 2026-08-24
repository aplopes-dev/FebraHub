import type { FiscalEvent } from '../entities/fiscal-event.entity';

export abstract class FiscalEventRepository {
  /// Ordem cronológica — contracts/fiscal-documents-api.md
  /// GET /fiscal-documents/{id}/events.
  abstract findByFiscalDocumentId(
    fiscalDocumentId: string,
  ): Promise<FiscalEvent[]>;
  abstract save(event: FiscalEvent): Promise<FiscalEvent>;
}
