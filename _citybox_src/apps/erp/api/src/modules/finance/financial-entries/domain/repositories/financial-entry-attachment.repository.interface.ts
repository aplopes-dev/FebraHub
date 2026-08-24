import type { FinancialEntryAttachment } from '../entities/financial-entry-attachment.entity';

/**
 * CRUD próprio do anexo — independente de `FinancialEntryRepository.save()`
 * (que só grava o agregado + `payments`/`allocations`). Anexos são imutáveis:
 * só criam e apagam, nunca atualizam.
 */
export abstract class FinancialEntryAttachmentRepository {
  abstract findById(
    organizationId: string,
    financialEntryId: string,
    id: string,
  ): Promise<FinancialEntryAttachment | null>;

  abstract findAllByFinancialEntry(
    organizationId: string,
    financialEntryId: string,
  ): Promise<FinancialEntryAttachment[]>;

  abstract save(
    attachment: FinancialEntryAttachment,
  ): Promise<FinancialEntryAttachment>;

  abstract delete(
    organizationId: string,
    financialEntryId: string,
    id: string,
  ): Promise<void>;
}
