import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { SequenceNumberUpdater } from '../../domain/repositories/sequence-number-updater.interface';
import { FiscalSequence } from '../../../fiscal-documents/domain/entities/fiscal-sequence.entity';
import type { FiscalSequenceNumberChange } from '../../domain/entities/fiscal-sequence-number-change.entity';

/// Aplica a alteração do número e grava a auditoria numa **única transação**
/// (achado database-reviewer, HIGH): um override manual de numeração fiscal não
/// pode ficar sem registro. Mesmo padrão de `$transaction` já usado na fila de
/// contingência de NFC-e.
@Injectable()
export class PrismaSequenceNumberUpdater extends SequenceNumberUpdater {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async applyChange(input: {
    sequence: FiscalSequence;
    newNumber: bigint;
    change: FiscalSequenceNumberChange;
  }): Promise<FiscalSequence> {
    const { sequence, newNumber, change } = input;

    await this.prisma.$transaction(async (tx) => {
      await tx.fiscalSequence.update({
        where: { id: sequence.id },
        data: { currentNumber: newNumber },
      });
      await tx.fiscalSequenceNumberChange.create({
        data: {
          id: change.id,
          sequenceId: change.sequenceId,
          companyId: change.companyId,
          previousNumber: change.previousNumber,
          newNumber: change.newNumber,
          changedByUserId: change.changedByUserId,
          changedByActor: change.changedByActor,
          changedAt: change.changedAt,
        },
      });
    });

    return FiscalSequence.with(
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
  }
}
