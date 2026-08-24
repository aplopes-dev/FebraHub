import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../../shared/domain/storage/object-storage.interface';
import { FinancialEntryAttachmentNotFoundError } from '../../../domain/errors/financial-entry-attachment-not-found.error';
import { FinancialEntryAttachmentRepository } from '../../../domain/repositories/financial-entry-attachment.repository.interface';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import type { DeleteFinancialEntryAttachmentDto } from '../../dtos/financial-entry-attachment.dto';
import { assertFinancialEntryExists } from '../assert-financial-entry-exists';

@Injectable()
export class DeleteFinancialEntryAttachmentUseCase implements IUseCase<
  DeleteFinancialEntryAttachmentDto,
  void
> {
  constructor(
    private readonly financialEntryRepository: FinancialEntryRepository,
    private readonly attachmentRepository: FinancialEntryAttachmentRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(dto: DeleteFinancialEntryAttachmentDto): Promise<void> {
    const entry = await assertFinancialEntryExists(
      this.financialEntryRepository,
      dto.organizationId,
      dto.financialEntryId,
    );

    const attachment = await this.attachmentRepository.findById(
      dto.organizationId,
      entry.id,
      dto.attachmentId,
    );
    if (!attachment) {
      throw new FinancialEntryAttachmentNotFoundError(dto.attachmentId);
    }

    await this.storage.delete(attachment.objectKey);
    await this.attachmentRepository.delete(
      dto.organizationId,
      entry.id,
      dto.attachmentId,
    );
  }
}
