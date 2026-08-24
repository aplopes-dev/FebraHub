import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  FiscalSequenceRepository,
  type FiscalSequenceKey,
} from '../../domain/repositories/fiscal-sequence.repository.interface';
import {
  FiscalSequence,
  type FiscalSequenceProps,
} from '../../domain/entities/fiscal-sequence.entity';
import type {
  FiscalDocumentEnvironment,
  FiscalDocumentType,
} from '../../domain/entities/fiscal-document.entity';

type FiscalSequenceRow = {
  id: string;
  companyId: string;
  documentType: string;
  series: string;
  currentNumber: bigint;
  environment: string;
  active: boolean;
};

@Injectable()
export class PrismaFiscalSequenceRepository extends FiscalSequenceRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByKey(key: FiscalSequenceKey): Promise<FiscalSequence | null> {
    const row = await this.prisma.fiscalSequence.findUnique({
      where: {
        companyId_documentType_series_environment: {
          companyId: key.companyId,
          documentType: key.documentType,
          series: key.series,
          environment: key.environment,
        },
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async save(sequence: FiscalSequence): Promise<FiscalSequence> {
    const row = await this.prisma.fiscalSequence.upsert({
      where: { id: sequence.id },
      create: {
        id: sequence.id,
        companyId: sequence.companyId,
        documentType: sequence.documentType,
        series: sequence.series,
        currentNumber: sequence.currentNumber,
        environment: sequence.environment,
        active: sequence.active,
      },
      update: {
        currentNumber: sequence.currentNumber,
        active: sequence.active,
      },
    });
    return this.toEntity(row);
  }

  async findAllByCompany(
    companyId: string,
    environment?: FiscalDocumentEnvironment,
  ): Promise<FiscalSequence[]> {
    const rows = await this.prisma.fiscalSequence.findMany({
      where: { companyId, ...(environment ? { environment } : {}) },
      orderBy: [{ documentType: 'asc' }, { series: 'asc' }],
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findById(id: string): Promise<FiscalSequence | null> {
    const row = await this.prisma.fiscalSequence.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.fiscalSequence.delete({ where: { id } });
  }

  private toEntity(row: FiscalSequenceRow): FiscalSequence {
    const props: FiscalSequenceProps = {
      companyId: row.companyId,
      documentType: row.documentType as FiscalDocumentType,
      series: row.series,
      currentNumber: row.currentNumber,
      environment: row.environment as FiscalDocumentEnvironment,
      active: row.active,
    };
    return FiscalSequence.with(props, row.id);
  }
}
