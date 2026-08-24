import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CommissionAccrual } from '../../../domain/entities/commission-accrual.entity';
import { CommissionAccrualRepository } from '../../../domain/repositories/commission-accrual.repository.interface';
import { CommissionAccrualZodValidator } from '../../../domain/validators/commission-accrual.validator';
import { parseIsoDateOnly } from '../../../../shared/domain/commission-date.utils';
import { resolveCommissionTriggerLabel } from '../../../../shared/domain/commission-enums';
import type { CreateCommissionAccrualDto } from '../../dtos/commission-accrual.dto';

@Injectable()
export class CreateCommissionAccrualUseCase
  implements IUseCase<CreateCommissionAccrualDto, CommissionAccrual>
{
  private readonly validator = CommissionAccrualZodValidator.create();

  constructor(
    private readonly accrualRepository: CommissionAccrualRepository,
  ) {}

  async execute(dto: CreateCommissionAccrualDto): Promise<CommissionAccrual> {
    const validated = this.validator.validate({
      memberId: dto.memberId,
      memberName: dto.memberName,
      ruleId: dto.ruleId,
      paymentTrigger: dto.paymentTrigger,
      planName: dto.planName,
      specialtyName: dto.specialtyName,
      treatmentName: dto.treatmentName,
      patientName: dto.patientName,
      paidValueCents: dto.paidValueCents,
      treatmentCostCents: dto.treatmentCostCents,
      installment: dto.installment,
      commissionCents: dto.commissionCents,
      accruedAt: dto.accruedAt,
      sourceFinancialEntryId: dto.sourceFinancialEntryId,
      sourceBudgetId: dto.sourceBudgetId,
      sourcePatientTreatmentId: dto.sourcePatientTreatmentId,
    });

    const accrual = CommissionAccrual.create({
      storeId: dto.storeId,
      memberId: validated.memberId,
      memberName: validated.memberName.trim(),
      ruleId: validated.ruleId ?? null,
      paymentTrigger: validated.paymentTrigger,
      triggerLabel: resolveCommissionTriggerLabel(validated.paymentTrigger),
      planName: validated.planName?.trim() ?? '',
      specialtyName: validated.specialtyName?.trim() ?? '',
      treatmentName: validated.treatmentName.trim(),
      patientName: validated.patientName.trim(),
      paidValueCents: validated.paidValueCents,
      treatmentCostCents: validated.treatmentCostCents,
      installment: validated.installment ?? null,
      commissionCents: validated.commissionCents,
      accruedAt: parseIsoDateOnly(validated.accruedAt),
      sourceFinancialEntryId: validated.sourceFinancialEntryId ?? null,
      sourceBudgetId: validated.sourceBudgetId ?? null,
      sourcePatientTreatmentId: validated.sourcePatientTreatmentId ?? null,
    });

    return this.accrualRepository.save(accrual);
  }
}
