import {
  FiscalDocumentRepository,
  type IdempotencyLookup,
  type ListFiscalDocumentsCriteria,
} from '../domain/repositories/fiscal-document.repository.interface';
import { FiscalDocument } from '../domain/entities/fiscal-document.entity';
import { FiscalDocumentItem } from '../domain/entities/fiscal-document-item.entity';

export class InMemoryFiscalDocumentRepository extends FiscalDocumentRepository {
  private readonly documents = new Map<string, FiscalDocument>();

  findById(id: string): Promise<FiscalDocument | null> {
    return Promise.resolve(this.documents.get(id) ?? null);
  }

  findByIdempotency(lookup: IdempotencyLookup): Promise<FiscalDocument | null> {
    const found = [...this.documents.values()].find(
      (doc) =>
        // `companyId` primeiro, e nao por estilo: sem ele o fake divergia do
        // Prisma e escondia o vazamento entre empresas que os testes existem
        // para pegar.
        doc.companyId === lookup.companyId &&
        doc.sourceSystem === lookup.sourceSystem &&
        doc.externalReference === lookup.externalReference &&
        doc.documentType === lookup.documentType &&
        doc.idempotencyKey === lookup.idempotencyKey,
    );
    return Promise.resolve(found ?? null);
  }

  findAll(criteria: ListFiscalDocumentsCriteria): Promise<FiscalDocument[]> {
    const filtered = this.applyFilters(criteria);
    return Promise.resolve(
      filtered.slice(criteria.skip, criteria.skip + criteria.take),
    );
  }

  count(
    criteria: Omit<ListFiscalDocumentsCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return Promise.resolve(this.applyFilters(criteria).length);
  }

  save(document: FiscalDocument): Promise<FiscalDocument> {
    const stored = InMemoryFiscalDocumentRepository.copyOf(document);
    this.documents.set(document.id, stored);
    return Promise.resolve(stored);
  }

  /// Guardar a instância recebida por referência faz o fake se comportar como
  /// um banco que nunca perde nada — foi assim que a ausência de escrita de
  /// `items` no repositório Prisma passou despercebida (D2). Reconstruir a
  /// entidade a cada `save` aproxima o fake do round-trip real: só sobrevive
  /// o que a entidade de fato expõe.
  private static copyOf(document: FiscalDocument): FiscalDocument {
    const copy = FiscalDocument.with(
      { ...document.props },
      document.id,
    ).withCustomerName(document.customerName);
    return copy.withItems(
      document.items.map((item) =>
        FiscalDocumentItem.with({ ...item.props }, item.id),
      ),
    );
  }

  private applyFilters(criteria: {
    companyId: string;
    documentType?: string;
    status?: string;
    sourceSystem?: string;
    externalReference?: string;
    series?: string;
    search?: string;
  }): FiscalDocument[] {
    return [...this.documents.values()].filter((doc) => {
      if (doc.companyId !== criteria.companyId) return false;
      if (criteria.documentType && doc.documentType !== criteria.documentType)
        return false;
      if (criteria.status && doc.status !== criteria.status) return false;
      if (criteria.sourceSystem && doc.sourceSystem !== criteria.sourceSystem)
        return false;
      if (
        criteria.externalReference &&
        doc.externalReference !== criteria.externalReference
      )
        return false;
      if (criteria.series && doc.series !== criteria.series) return false;
      // Espelha o `OR` insensitive do Prisma (só `number`/`series`, sem nome
      // de cliente — research.md §3 da spec `009-facilita-nfe-screen`).
      if (criteria.search?.trim()) {
        const term = criteria.search.trim().toLowerCase();
        const matchesNumber = doc.number?.toLowerCase().includes(term) ?? false;
        const matchesSeries = doc.series?.toLowerCase().includes(term) ?? false;
        if (!matchesNumber && !matchesSeries) return false;
      }
      return true;
    });
  }
}
