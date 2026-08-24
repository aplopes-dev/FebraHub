import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientFinancialEntry } from '../../../domain/entities/patient-financial-entry.entity';
import type { PatientFinancialDebitDetail } from '../../../domain/entities/patient-financial-entry.entity';
import { PatientFinancialEntryRepository } from '../../../domain/repositories/patient-financial-entry.repository.interface';
import { PatientFinancialEntryNotFoundError } from '../../../domain/errors/patient-financial-entry-not-found.error';
import { PatientFinancialEntryFrozenError } from '../../../domain/errors/patient-financial-entry-frozen.error';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
import { parseUpdatePendingDebitInput } from '../../../domain/validators/patient-financial-entry.zod.validator';
import { formatCentsToBrl } from '../../utils/patient-financial-entry.utils';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { HydratePatientFinancialDebitDetailService } from '../../services/hydrate-patient-financial-debit-detail.service';
import type { UpdatePatientFinancialEntryDto } from '../../dtos/patient-financial-entry.dto';

@Injectable()
export class UpdatePatientFinancialEntryUseCase implements IUseCase<
  UpdatePatientFinancialEntryDto,
  PatientFinancialEntry
> {
  constructor(
    private readonly entryRepository: PatientFinancialEntryRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly hydrateDebitDetail: HydratePatientFinancialDebitDetailService,
  ) {}

  async execute(
    dto: UpdatePatientFinancialEntryDto,
  ): Promise<PatientFinancialEntry> {
    await this.assertPatientExists.execute(
      UpdatePatientFinancialEntryUseCase.name,
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
        UpdatePatientFinancialEntryUseCase.name,
        dto.entryId,
      );
    }

    if (!existingRaw.isEditablePendingDebit()) {
      throw new PatientFinancialEntryFrozenError(
        UpdatePatientFinancialEntryUseCase.name,
        dto.entryId,
        existingRaw.status === 'received' ? 'received' : 'not_editable',
      );
    }

    const existing = await this.hydrateDebitDetail.hydrateOne(existingRaw);
    const input = parseUpdatePendingDebitInput(
      UpdatePatientFinancialEntryUseCase.name,
      dto.input,
    );

    const currentDetail: PatientFinancialDebitDetail = existing.debitDetail ?? {
      observations: '',
      treatments: [],
      attachments: [],
    };

    let nextDetail: PatientFinancialDebitDetail;
    let valueCents: number;

    if (input.treatments && input.treatments.length > 0) {
      if (currentDetail.treatments.length === 0) {
        throw new ValidatorDomainError({
          internalMessage: 'Entry has no treatments to update',
          externalMessage:
            'Este lançamento não possui procedimentos para editar valor/dentista.',
          context: UpdatePatientFinancialEntryUseCase.name,
        });
      }

      const updatesById = new Map(
        input.treatments.map((treatment) => [treatment.id, treatment]),
      );

      const nextTreatments = currentDetail.treatments.map((treatment) => {
        const patch = updatesById.get(treatment.id);
        if (!patch) {
          return treatment;
        }

        return {
          ...treatment,
          professionalId: patch.professionalId,
          value: formatCentsToBrl(patch.valueCents),
        };
      });

      for (const patch of input.treatments) {
        if (!currentDetail.treatments.some((row) => row.id === patch.id)) {
          throw new ValidatorDomainError({
            internalMessage: `Unknown treatment row id: ${patch.id}`,
            externalMessage: 'Procedimento do débito inválido',
            context: UpdatePatientFinancialEntryUseCase.name,
          });
        }
      }

      valueCents = input.treatments.reduce(
        (sum, treatment) => sum + treatment.valueCents,
        0,
      );
      // Se o patch não cobre todas as linhas, soma os valores já formatados das demais.
      if (input.treatments.length < nextTreatments.length) {
        valueCents = nextTreatments.reduce((sum, treatment) => {
          const patch = updatesById.get(treatment.id);
          if (patch) {
            return sum + patch.valueCents;
          }
          const parsed = Number.parseFloat(
            treatment.value.replace(/\./g, '').replace(',', '.'),
          );
          return sum + Math.round((Number.isFinite(parsed) ? parsed : 0) * 100);
        }, 0);
      }

      nextDetail = {
        observations: input.observations,
        treatments: nextTreatments,
        ...(currentDetail.attachments?.length
          ? { attachments: currentDetail.attachments }
          : {}),
      };
    } else {
      valueCents = input.valueCents!;
      nextDetail = {
        observations: input.observations,
        treatments: currentDetail.treatments,
        ...(currentDetail.attachments?.length
          ? { attachments: currentDetail.attachments }
          : {}),
      };
    }

    const updated = existing.withPendingDebitUpdate({
      valueCents,
      debitDetail: nextDetail,
    });

    return this.entryRepository.save(updated);
  }
}
