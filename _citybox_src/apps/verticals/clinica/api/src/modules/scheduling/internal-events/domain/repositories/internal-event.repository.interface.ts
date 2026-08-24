import { DomainError } from '../../../../../shared/core/errors/domain.error';
import type { InternalEvent } from '../entities/internal-event.entity';

export class InternalEventNotFoundError extends DomainError {
  constructor(context: string, eventId: string) {
    super({
      internalMessage: `Internal event not found: ${eventId}`,
      externalMessage: 'Compromisso não encontrado',
      context,
    });
  }
}

export type InternalEventListCriteria = {
  startDate?: string;
  endDate?: string;
  professionalIds?: string[];
};

export abstract class InternalEventRepository {
  abstract findById(storeId: string, id: string): Promise<InternalEvent | null>;

  abstract findMany(
    storeId: string,
    criteria: InternalEventListCriteria,
  ): Promise<InternalEvent[]>;

  abstract findForCalendar(
    storeId: string,
    criteria: {
      startDate: string;
      endDate: string;
      professionalIds?: string[];
    },
  ): Promise<InternalEvent[]>;

  abstract save(event: InternalEvent): Promise<InternalEvent>;
  abstract delete(storeId: string, id: string): Promise<void>;
}
