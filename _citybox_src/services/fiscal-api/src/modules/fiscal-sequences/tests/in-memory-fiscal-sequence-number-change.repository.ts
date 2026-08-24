import { FiscalSequenceNumberChangeRepository } from '../domain/repositories/fiscal-sequence-number-change.repository.interface';
import type { FiscalSequenceNumberChange } from '../domain/entities/fiscal-sequence-number-change.entity';

export class InMemoryFiscalSequenceNumberChangeRepository extends FiscalSequenceNumberChangeRepository {
  readonly changes: FiscalSequenceNumberChange[] = [];

  save(change: FiscalSequenceNumberChange): Promise<void> {
    this.changes.push(change);
    return Promise.resolve();
  }

  listBySequence(sequenceId: string): Promise<FiscalSequenceNumberChange[]> {
    return Promise.resolve(
      this.changes.filter((c) => c.sequenceId === sequenceId),
    );
  }
}
