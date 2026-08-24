import { FiscalEventRepository } from '../domain/repositories/fiscal-event.repository.interface';
import type { FiscalEvent } from '../domain/entities/fiscal-event.entity';

export class InMemoryFiscalEventRepository extends FiscalEventRepository {
  private readonly events: FiscalEvent[] = [];

  findByFiscalDocumentId(fiscalDocumentId: string): Promise<FiscalEvent[]> {
    return Promise.resolve(
      this.events
        .filter((event) => event.fiscalDocumentId === fiscalDocumentId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    );
  }

  save(event: FiscalEvent): Promise<FiscalEvent> {
    this.events.push(event);
    return Promise.resolve(event);
  }
}
