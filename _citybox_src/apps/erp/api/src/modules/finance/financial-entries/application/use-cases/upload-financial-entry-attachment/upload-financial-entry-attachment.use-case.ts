import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../../shared/domain/storage/object-storage.interface';
import { FinancialEntryAttachment } from '../../../domain/entities/financial-entry-attachment.entity';
import { FinancialEntryAttachmentRepository } from '../../../domain/repositories/financial-entry-attachment.repository.interface';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import { AttachmentFileValidator } from '../../../domain/validators/attachment-file.validator';
import { ErpFinanceObjectKeyPolicy } from '../../policies/erp-finance-object-key.policy';
import type { UploadFinancialEntryAttachmentDto } from '../../dtos/financial-entry-attachment.dto';
import { assertFinancialEntryExists } from '../assert-financial-entry-exists';

@Injectable()
export class UploadFinancialEntryAttachmentUseCase implements IUseCase<
  UploadFinancialEntryAttachmentDto,
  FinancialEntryAttachment
> {
  constructor(
    private readonly financialEntryRepository: FinancialEntryRepository,
    private readonly attachmentRepository: FinancialEntryAttachmentRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    dto: UploadFinancialEntryAttachmentDto,
  ): Promise<FinancialEntryAttachment> {
    const entry = await assertFinancialEntryExists(
      this.financialEntryRepository,
      dto.organizationId,
      dto.financialEntryId,
    );

    const { mimeType, extension } = AttachmentFileValidator.validate(
      dto.buffer,
      dto.declaredMimeType,
    );

    // Gerado antes da entidade para poder compor a key do objeto com ele —
    // `Entity` aceitaria um id implícito, mas aí a key só existiria depois.
    const attachmentId = randomUUID();
    const key = ErpFinanceObjectKeyPolicy.financialEntryAttachmentKey(
      dto.organizationId,
      entry.id,
      attachmentId,
      extension,
    );

    await this.storage.put({ key, buffer: dto.buffer, mimeType });

    const attachment = FinancialEntryAttachment.create(
      {
        organizationId: dto.organizationId,
        financialEntryId: entry.id,
        fileName: dto.fileName,
        objectKey: key,
        contentType: mimeType,
        sizeBytes: dto.buffer.length,
      },
      attachmentId,
    );

    return this.attachmentRepository.save(attachment);
  }
}
