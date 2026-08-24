import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { FiscalSequenceNumberChangeRepository } from '../../domain/repositories/fiscal-sequence-number-change.repository.interface';
import { FiscalSequenceNumberChange } from '../../domain/entities/fiscal-sequence-number-change.entity';

type Row = {
  id: string;
  sequenceId: string;
  companyId: string;
  previousNumber: bigint;
  newNumber: bigint;
  changedByUserId: string;
  changedByActor: string | null;
  changedAt: Date;
};

@Injectable()
export class PrismaFiscalSequenceNumberChangeRepository extends FiscalSequenceNumberChangeRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async save(change: FiscalSequenceNumberChange): Promise<void> {
    await this.prisma.fiscalSequenceNumberChange.create({
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
  }

  async listBySequence(
    sequenceId: string,
  ): Promise<FiscalSequenceNumberChange[]> {
    const rows = await this.prisma.fiscalSequenceNumberChange.findMany({
      where: { sequenceId },
      orderBy: { changedAt: 'desc' },
    });
    return rows.map((row: Row) => this.toEntity(row));
  }

  private toEntity(row: Row): FiscalSequenceNumberChange {
    return new FiscalSequenceNumberChange(
      {
        sequenceId: row.sequenceId,
        companyId: row.companyId,
        previousNumber: row.previousNumber,
        newNumber: row.newNumber,
        changedByUserId: row.changedByUserId,
        changedByActor: row.changedByActor,
        changedAt: row.changedAt,
      },
      row.id,
    );
  }
}
