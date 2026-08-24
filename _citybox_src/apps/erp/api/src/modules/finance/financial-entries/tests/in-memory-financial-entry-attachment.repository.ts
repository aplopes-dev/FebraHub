import { FinancialEntryAttachment } from '../domain/entities/financial-entry-attachment.entity';
import { FinancialEntryAttachmentRepository } from '../domain/repositories/financial-entry-attachment.repository.interface';

export class InMemoryFinancialEntryAttachmentRepository extends FinancialEntryAttachmentRepository {
  private readonly items = new Map<string, FinancialEntryAttachment>();

  async findById(
    organizationId: string,
    financialEntryId: string,
    id: string,
  ): Promise<FinancialEntryAttachment | null> {
    const item = this.items.get(id);
    if (
      !item ||
      item.organizationId !== organizationId ||
      item.financialEntryId !== financialEntryId
    ) {
      return null;
    }
    return item;
  }

  async findAllByFinancialEntry(
    organizationId: string,
    financialEntryId: string,
  ): Promise<FinancialEntryAttachment[]> {
    return [...this.items.values()]
      .filter(
        (item) =>
          item.organizationId === organizationId &&
          item.financialEntryId === financialEntryId,
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async save(
    attachment: FinancialEntryAttachment,
  ): Promise<FinancialEntryAttachment> {
    this.items.set(attachment.id, attachment);
    return attachment;
  }

  async delete(
    organizationId: string,
    financialEntryId: string,
    id: string,
  ): Promise<void> {
    const item = this.items.get(id);
    if (
      item &&
      item.organizationId === organizationId &&
      item.financialEntryId === financialEntryId
    ) {
      this.items.delete(id);
    }
  }
}
