import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  FinancialEntryAttachment,
  type FinancialEntryAttachmentProps,
} from '../../domain/entities/financial-entry-attachment.entity';
import { FinancialEntryAttachmentRepository } from '../../domain/repositories/financial-entry-attachment.repository.interface';

type FinancialEntryAttachmentRow = {
  id: string;
  organizationId: string;
  financialEntryId: string;
  fileName: string;
  objectKey: string;
  contentType: string;
  sizeBytes: number;
  createdAt: Date;
};

@Injectable()
export class PrismaFinancialEntryAttachmentRepository extends FinancialEntryAttachmentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    financialEntryId: string,
    id: string,
  ): Promise<FinancialEntryAttachment | null> {
    const row = await this.prisma.scoped.financialEntryAttachment.findFirst({
      where: { id, organizationId, financialEntryId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAllByFinancialEntry(
    organizationId: string,
    financialEntryId: string,
  ): Promise<FinancialEntryAttachment[]> {
    const rows = await this.prisma.scoped.financialEntryAttachment.findMany({
      where: { organizationId, financialEntryId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async save(
    attachment: FinancialEntryAttachment,
  ): Promise<FinancialEntryAttachment> {
    const row = await this.prisma.scoped.financialEntryAttachment.create({
      data: {
        id: attachment.id,
        organizationId: attachment.organizationId,
        financialEntryId: attachment.financialEntryId,
        fileName: attachment.fileName,
        objectKey: attachment.objectKey,
        contentType: attachment.contentType,
        sizeBytes: attachment.sizeBytes,
        createdAt: attachment.createdAt,
      },
    });
    return this.toEntity(row);
  }

  async delete(
    organizationId: string,
    financialEntryId: string,
    id: string,
  ): Promise<void> {
    await this.prisma.scoped.financialEntryAttachment.deleteMany({
      where: { id, organizationId, financialEntryId },
    });
  }

  private toEntity(row: FinancialEntryAttachmentRow): FinancialEntryAttachment {
    const props: FinancialEntryAttachmentProps = {
      organizationId: row.organizationId,
      financialEntryId: row.financialEntryId,
      fileName: row.fileName,
      objectKey: row.objectKey,
      contentType: row.contentType,
      sizeBytes: row.sizeBytes,
      createdAt: row.createdAt,
    };
    return FinancialEntryAttachment.with(props, row.id);
  }
}
