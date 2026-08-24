import {
  FiscalSequenceRepository,
  type FiscalSequenceKey,
} from '../domain/repositories/fiscal-sequence.repository.interface';
import type { FiscalSequence } from '../domain/entities/fiscal-sequence.entity';
import type { FiscalDocumentEnvironment } from '../domain/entities/fiscal-document.entity';

function keyString(key: FiscalSequenceKey): string {
  return [key.companyId, key.documentType, key.series, key.environment].join(
    '::',
  );
}

export class InMemoryFiscalSequenceRepository extends FiscalSequenceRepository {
  private readonly sequences = new Map<string, FiscalSequence>();

  findByKey(key: FiscalSequenceKey): Promise<FiscalSequence | null> {
    return Promise.resolve(this.sequences.get(keyString(key)) ?? null);
  }

  save(sequence: FiscalSequence): Promise<FiscalSequence> {
    this.sequences.set(
      keyString({
        companyId: sequence.companyId,
        documentType: sequence.documentType,
        series: sequence.series,
        environment: sequence.environment,
      }),
      sequence,
    );
    return Promise.resolve(sequence);
  }

  findAllByCompany(
    companyId: string,
    environment?: FiscalDocumentEnvironment,
  ): Promise<FiscalSequence[]> {
    const all = [...this.sequences.values()].filter(
      (seq) =>
        seq.companyId === companyId &&
        (environment ? seq.environment === environment : true),
    );
    return Promise.resolve(all);
  }

  findById(id: string): Promise<FiscalSequence | null> {
    const found = [...this.sequences.values()].find((seq) => seq.id === id);
    return Promise.resolve(found ?? null);
  }

  delete(id: string): Promise<void> {
    for (const [key, seq] of this.sequences.entries()) {
      if (seq.id === id) this.sequences.delete(key);
    }
    return Promise.resolve();
  }
}
