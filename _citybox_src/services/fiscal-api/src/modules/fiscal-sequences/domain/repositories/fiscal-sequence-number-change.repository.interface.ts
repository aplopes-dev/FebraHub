import type { FiscalSequenceNumberChange } from '../entities/fiscal-sequence-number-change.entity';

export abstract class FiscalSequenceNumberChangeRepository {
  abstract save(change: FiscalSequenceNumberChange): Promise<void>;
  /// Consulta do histórico de alterações de uma série (SC-003 "auditoria consultável").
  abstract listBySequence(
    sequenceId: string,
  ): Promise<FiscalSequenceNumberChange[]>;
}
