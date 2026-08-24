import type { FiscalSequence } from '../../../fiscal-documents/domain/entities/fiscal-sequence.entity';
import type { FiscalSequenceNumberChange } from '../entities/fiscal-sequence-number-change.entity';

/// Aplica a alteração do número atual **e** grava a auditoria numa **única
/// transação** (spec erp/011, FR-004): um override manual de numeração fiscal
/// nunca pode ficar sem registro. Ver `PrismaSequenceNumberUpdater`.
export abstract class SequenceNumberUpdater {
  abstract applyChange(input: {
    sequence: FiscalSequence;
    newNumber: bigint;
    change: FiscalSequenceNumberChange;
  }): Promise<FiscalSequence>;
}
