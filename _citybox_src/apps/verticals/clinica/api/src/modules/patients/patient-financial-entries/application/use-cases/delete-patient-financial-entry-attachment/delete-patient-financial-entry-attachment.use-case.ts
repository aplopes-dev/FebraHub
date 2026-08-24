import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../../shared/domain/storage/object-storage.interface';
import { PatientFinancialEntry } from '../../../domain/entities/patient-financial-entry.entity';
import { PatientFinancialEntryRepository } from '../../../domain/repositories/patient-financial-entry.repository.interface';
import { PatientFinancialEntryNotFoundError } from '../../../domain/errors/patient-financial-entry-not-found.error';
import { PatientFinancialEntryFrozenError } from '../../../domain/errors/patient-financial-entry-frozen.error';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { HydratePatientFinancialDebitDetailService } from '../../services/hydrate-patient-financial-debit-detail.service';

export type DeletePatientFinancialEntryAttachmentDto = {
  storeId: string;
  patientId: string;
  entryId: string;
  attachmentId: string;
};

@Injectable()
export class DeletePatientFinancialEntryAttachmentUseCase
  implements IUseCase<DeletePatientFinancialEntryAttachmentDto, PatientFinancialEntry>
{
  constructor(
    private readonly entryRepository: PatientFinancialEntryRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly hydrateDebitDetail: HydratePatientFinancialDebitDetailService,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    dto: DeletePatientFinancialEntryAttachmentDto,
  ): Promise<PatientFinancialEntry> {
    await this.assertPatientExists.execute(
      DeletePatientFinancialEntryAttachmentUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const existingRaw = await this.entryRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.entryId,
    );
    if (!existingRaw) {
      throw new PatientFinancialEntryNotFoundError(
        DeletePatientFinancialEntryAttachmentUseCase.name,
        dto.entryId,
      );
    }
    if (!existingRaw.isEditablePendingDebit()) {
      throw new PatientFinancialEntryFrozenError(
        DeletePatientFinancialEntryAttachmentUseCase.name,
        dto.entryId,
        existingRaw.status === 'received' ? 'received' : 'not_editable',
      );
    }

    const existing = await this.hydrateDebitDetail.hydrateOne(existingRaw);
    const currentDetail = existing.debitDetail;
    const attachment = currentDetail?.attachments?.find(
      (item) => item.id === dto.attachmentId,
    );
    if (!attachment) {
      throw new ValidatorDomainError({
        internalMessage: `Attachment not found: ${dto.attachmentId}`,
        externalMessage: 'Anexo não encontrado',
        context: DeletePatientFinancialEntryAttachmentUseCase.name,
      });
    }

    try {
      await this.storage.delete(attachment.objectKey);
    } catch {
      // Continua removendo a referência mesmo se o objeto já não existir.
    }

    const attachments = (currentDetail?.attachments ?? []).filter(
      (item) => item.id !== dto.attachmentId,
    );

    const updated = existing.withPendingDebitUpdate({
      valueCents: existing.valueCents,
      debitDetail: {
        observations: currentDetail?.observations ?? '',
        treatments: currentDetail?.treatments ?? [],
        ...(attachments.length > 0 ? { attachments } : {}),
      },
    });

    return this.entryRepository.save(updated);
  }
}
