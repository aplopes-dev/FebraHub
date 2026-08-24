import { SequenceNumberUpdater } from '../domain/repositories/sequence-number-updater.interface';
import { FiscalSequence } from '../../fiscal-documents/domain/entities/fiscal-sequence.entity';
import type { FiscalSequenceNumberChange } from '../domain/entities/fiscal-sequence-number-change.entity';
import type { InMemoryFiscalSequenceRepository } from '../../fiscal-documents/tests/in-memory-fiscal-sequence.repository';
import type { InMemoryFiscalSequenceNumberChangeRepository } from './in-memory-fiscal-sequence-number-change.repository';

/// Espelha o `PrismaSequenceNumberUpdater` para testes: aplica número + auditoria
/// juntos (in-memory), representando a atomicidade da transação real.
export class InMemorySequenceNumberUpdater extends SequenceNumberUpdater {
  constructor(
    private readonly repo: InMemoryFiscalSequenceRepository,
    private readonly audit: InMemoryFiscalSequenceNumberChangeRepository,
  ) {
    super();
  }

  async applyChange(input: {
    sequence: FiscalSequence;
    newNumber: bigint;
    change: FiscalSequenceNumberChange;
  }): Promise<FiscalSequence> {
    const { sequence, newNumber, change } = input;
    const updated = FiscalSequence.with(
      {
        companyId: sequence.companyId,
        documentType: sequence.documentType,
        series: sequence.series,
        currentNumber: newNumber,
        environment: sequence.environment,
        active: sequence.active,
      },
      sequence.id,
    );
    await this.repo.save(updated);
    await this.audit.save(change);
    return updated;
  }
}
