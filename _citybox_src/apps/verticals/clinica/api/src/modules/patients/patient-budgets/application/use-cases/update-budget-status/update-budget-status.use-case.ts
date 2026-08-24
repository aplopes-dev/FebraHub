import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
import { BudgetRepository } from '../../../domain/repositories/budget.repository.interface';
import type { BudgetDetail } from '../../../domain/repositories/budget.repository.interface';
import { BudgetNotFoundError } from '../../../domain/errors/budget-not-found.error';
import { BudgetFrozenError } from '../../../domain/errors/budget-frozen.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { MaterializeBudgetTreatmentsService } from '../../services/materialize-budget-treatments.service';
import { GenerateBudgetFinancialEntriesService } from '../../../../patient-financial-entries/application/services/generate-budget-financial-entries.service';
import { AccrueCommissionsOnBudgetApprovedService } from '../../../../../commissions/accruals/application/services/accrue-commissions-on-budget-approved.service';
import type { UpdateBudgetStatusDto } from '../../dtos/budget.dto';
import { SyncBudgetSalesOpportunityService } from '../../services/sync-budget-sales-opportunity.service';

function parseIsoDateOnly(value: string, context: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid date format: ${value}`,
      externalMessage: 'Informe a data no formato yyyy-MM-dd',
      context,
    });
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid date value: ${value}`,
      externalMessage: 'Informe uma data válida',
      context,
    });
  }

  return date;
}

@Injectable()
export class UpdateBudgetStatusUseCase implements IUseCase<
  UpdateBudgetStatusDto,
  BudgetDetail
> {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly materializeBudgetTreatments: MaterializeBudgetTreatmentsService,
    private readonly generateBudgetFinancialEntries: GenerateBudgetFinancialEntriesService,
    private readonly accrueCommissionsOnBudgetApproved: AccrueCommissionsOnBudgetApprovedService,
    private readonly syncSalesOpportunity: SyncBudgetSalesOpportunityService,
  ) {}

  async execute(dto: UpdateBudgetStatusDto): Promise<BudgetDetail> {
    await this.assertPatientExists.execute(
      UpdateBudgetStatusUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const existing = await this.budgetRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.budgetId,
    );
    if (!existing) {
      throw new BudgetNotFoundError(
        UpdateBudgetStatusUseCase.name,
        dto.budgetId,
      );
    }

    if (existing.budget.status === 'approved') {
      throw new BudgetFrozenError(UpdateBudgetStatusUseCase.name, dto.budgetId);
    }

    const currentStatus = existing.budget.status;
    const isReopen = currentStatus === 'rejected' && dto.status === 'pending';
    const isFromPending =
      currentStatus === 'pending' &&
      (dto.status === 'approved' ||
        dto.status === 'rejected' ||
        dto.status === 'expired');

    if (!isReopen && !isFromPending) {
      throw new ValidatorDomainError({
        internalMessage: `Budget status transition not allowed from ${currentStatus} to ${dto.status}`,
        externalMessage:
          currentStatus === 'rejected'
            ? 'Orçamento reprovado só pode ser reaberto (status pending)'
            : 'Só é possível alterar orçamentos pendentes',
        context: UpdateBudgetStatusUseCase.name,
      });
    }

    if (
      dto.status !== 'approved' &&
      dto.status !== 'rejected' &&
      dto.status !== 'expired' &&
      dto.status !== 'pending'
    ) {
      throw new ValidatorDomainError({
        internalMessage: `Budget status ${dto.status} is not allowed`,
        externalMessage:
          'Status permitido: approved, rejected, expired ou pending',
        context: UpdateBudgetStatusUseCase.name,
      });
    }

    if (dto.status === 'approved' && existing.items.length === 0) {
      throw new ValidatorDomainError({
        internalMessage: 'Cannot approve budget without items',
        externalMessage:
          'Adicione pelo menos um procedimento ao orçamento antes de aprovar',
        context: UpdateBudgetStatusUseCase.name,
      });
    }

    let rejectedAt: Date | null | undefined;
    let rejectionReason: string | null | undefined;

    if (dto.status === 'rejected') {
      const reason = dto.rejectionReason?.trim() ?? '';
      if (!reason) {
        throw new ValidatorDomainError({
          internalMessage: 'rejectionReason is required when rejecting',
          externalMessage: 'Informe o motivo da reprovação',
          context: UpdateBudgetStatusUseCase.name,
        });
      }
      if (reason.length > 255) {
        throw new ValidatorDomainError({
          internalMessage: 'rejectionReason exceeds 255 characters',
          externalMessage: 'O motivo da reprovação deve ter no máximo 255 caracteres',
          context: UpdateBudgetStatusUseCase.name,
        });
      }
      if (!dto.rejectedAt?.trim()) {
        throw new ValidatorDomainError({
          internalMessage: 'rejectedAt is required when rejecting',
          externalMessage: 'Informe a data da reprovação',
          context: UpdateBudgetStatusUseCase.name,
        });
      }

      rejectedAt = parseIsoDateOnly(
        dto.rejectedAt.trim(),
        UpdateBudgetStatusUseCase.name,
      );
      rejectionReason = reason;
    } else if (dto.status === 'pending') {
      rejectedAt = null;
      rejectionReason = null;
    }

    const updated = await this.budgetRepository.updateStatus(
      dto.storeId,
      dto.patientId,
      dto.budgetId,
      dto.status,
      dto.status === 'rejected' || dto.status === 'pending'
        ? { rejectedAt, rejectionReason }
        : undefined,
    );
    if (!updated) {
      throw new BudgetNotFoundError(
        UpdateBudgetStatusUseCase.name,
        dto.budgetId,
      );
    }

    if (dto.status === 'approved') {
      await this.materializeBudgetTreatments.execute({
        storeId: dto.storeId,
        patientId: dto.patientId,
        budgetId: dto.budgetId,
        items: existing.items,
      });

      const dueDate = dto.dueDate
        ? parseIsoDateOnly(dto.dueDate, UpdateBudgetStatusUseCase.name)
        : undefined;

      const installments = dto.installments?.map((row) => ({
        dueDate: parseIsoDateOnly(row.dueDate, UpdateBudgetStatusUseCase.name),
        valueCents: row.valueCents,
      }));

      await this.generateBudgetFinancialEntries.execute({
        storeId: dto.storeId,
        patientId: dto.patientId,
        budget: updated.budget,
        items: existing.items,
        dueDate,
        installments,
      });

      await this.accrueCommissionsOnBudgetApproved.execute({
        storeId: dto.storeId,
        patientId: dto.patientId,
        budgetId: dto.budgetId,
        finalValueCents: updated.budget.finalValueCents,
        responsibleId: updated.budget.responsibleId,
        responsibleName: updated.budget.responsibleName,
        description: updated.budget.description,
        approvedAt: updated.budget.approvedAt ?? new Date(),
      });
    }

    await this.syncSalesOpportunity.onStatusChanged({
      storeId: dto.storeId,
      budgetId: dto.budgetId,
      status: dto.status,
    });

    return updated;
  }
}
