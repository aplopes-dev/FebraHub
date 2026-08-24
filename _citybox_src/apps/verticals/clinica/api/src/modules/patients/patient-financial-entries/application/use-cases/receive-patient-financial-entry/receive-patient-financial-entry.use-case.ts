import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientFinancialEntry } from '../../../domain/entities/patient-financial-entry.entity';
import { PatientFinancialEntryRepository } from '../../../domain/repositories/patient-financial-entry.repository.interface';
import { PatientFinancialEntryNotFoundError } from '../../../domain/errors/patient-financial-entry-not-found.error';
import { PatientFinancialEntryFrozenError } from '../../../domain/errors/patient-financial-entry-frozen.error';
import { parseReceiveFinancialEntryInput } from '../../../domain/validators/patient-financial-entry.zod.validator';
import { buildReceiveDetailSnapshot } from '../../utils/patient-financial-entry.utils';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type { ReceivePatientFinancialEntryDto } from '../../dtos/patient-financial-entry.dto';
import { AccrueCommissionsOnDebitReceivedService } from '../../../../../commissions/accruals/application/services/accrue-commissions-on-debit-received.service';

@Injectable()
export class ReceivePatientFinancialEntryUseCase implements IUseCase<
  ReceivePatientFinancialEntryDto,
  PatientFinancialEntry
> {
  constructor(
    private readonly entryRepository: PatientFinancialEntryRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly accrueCommissionsOnDebitReceived: AccrueCommissionsOnDebitReceivedService,
  ) {}

  async execute(
    dto: ReceivePatientFinancialEntryDto,
  ): Promise<PatientFinancialEntry> {
    await this.assertPatientExists.execute(
      ReceivePatientFinancialEntryUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const existing = await this.entryRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.entryId,
    );

    if (!existing) {
      throw new PatientFinancialEntryNotFoundError(
        ReceivePatientFinancialEntryUseCase.name,
        dto.entryId,
      );
    }

    if (existing.status === 'received') {
      throw new PatientFinancialEntryFrozenError(
        ReceivePatientFinancialEntryUseCase.name,
        dto.entryId,
        'received',
      );
    }

    const input = parseReceiveFinancialEntryInput(
      ReceivePatientFinancialEntryUseCase.name,
      dto.input,
    );
    const receiveDetail = buildReceiveDetailSnapshot(input);
    const updated = existing.withReceived(input.receivedAt, receiveDetail);

    const saved = await this.entryRepository.save(updated);

    await this.accrueCommissionsOnDebitReceived.execute({
      storeId: saved.storeId,
      financialEntryId: saved.id,
      source: saved.source,
      patientId: saved.patientId,
      budgetId: saved.budgetId,
      description: saved.name,
      valueCents: saved.valueCents,
      paidValueCents: receiveDetail.paidValueCents,
      paidAt: input.receivedAt,
      installmentIndex: saved.installmentIndex,
      installmentNumber:
        saved.installmentIndex !== null && saved.installmentIndex > 0
          ? saved.installmentIndex
          : null,
      totalInstallments: null,
      debitDetail: saved.debitDetail as Record<string, unknown> | null,
    });

    return saved;
  }
}
