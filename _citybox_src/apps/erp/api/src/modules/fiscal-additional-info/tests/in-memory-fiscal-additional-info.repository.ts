import type {
  FiscalAdditionalInfo,
  FiscalDocumentType,
} from '../domain/entities/fiscal-additional-info.entity';
import { FiscalAdditionalInfoRepository } from '../domain/repositories/fiscal-additional-info.repository.interface';

export class InMemoryFiscalAdditionalInfoRepository extends FiscalAdditionalInfoRepository {
  private readonly items = new Map<string, FiscalAdditionalInfo>();

  listByOrganization(
    organizationId: string,
    documentType?: FiscalDocumentType,
  ): Promise<FiscalAdditionalInfo[]> {
    const found = [...this.items.values()]
      .filter(
        (item) =>
          item.organizationId === organizationId &&
          (documentType === undefined || item.documentType === documentType),
      )
      // Espelha o `orderBy: [createdAt, id]` do Prisma — desempate por id para
      // que a ordem (e o XML concatenado) seja determinística em empate de ms.
      .sort(
        (a, b) =>
          a.createdAt.getTime() - b.createdAt.getTime() ||
          a.id.localeCompare(b.id),
      );
    return Promise.resolve(found);
  }

  findById(
    organizationId: string,
    id: string,
  ): Promise<FiscalAdditionalInfo | null> {
    const found = this.items.get(id);
    return Promise.resolve(
      found && found.organizationId === organizationId ? found : null,
    );
  }

  save(info: FiscalAdditionalInfo): Promise<FiscalAdditionalInfo> {
    this.items.set(info.id, info);
    return Promise.resolve(info);
  }

  delete(organizationId: string, id: string): Promise<void> {
    const found = this.items.get(id);
    if (found && found.organizationId === organizationId) {
      this.items.delete(id);
    }
    return Promise.resolve();
  }

  countByDocumentType(
    organizationId: string,
  ): Promise<Record<FiscalDocumentType, number>> {
    const counts: Record<FiscalDocumentType, number> = {
      NFE: 0,
      NFCE: 0,
      NFSE: 0,
    };
    for (const item of this.items.values()) {
      if (item.organizationId === organizationId) {
        counts[item.documentType] += 1;
      }
    }
    return Promise.resolve(counts);
  }

  /** Helper de teste/seed. */
  seed(info: FiscalAdditionalInfo): void {
    this.items.set(info.id, info);
  }

  clear(): void {
    this.items.clear();
  }
}
