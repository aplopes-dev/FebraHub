import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { Budget } from '../../../domain/entities/budget.entity';
import { BudgetItem } from '../../../domain/entities/budget-item.entity';
import { BudgetRepository } from '../../../domain/repositories/budget.repository.interface';
import type { BudgetDetail } from '../../../domain/repositories/budget.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { ValidateBudgetItemReferencesService } from '../../services/validate-budget-item-references.service';
import { SyncBudgetSalesOpportunityService } from '../../services/sync-budget-sales-opportunity.service';
import { resolveBudgetPricing } from '../../mappers/budget-pricing.mapper';
import type { CreateBudgetDto } from '../../dtos/budget.dto';
import { resolveBudgetToothLocationLabel } from '../../../../application/utils/resolve-budget-tooth-location-label';
import { normalizeBudgetItemSessions } from '../../../domain/utils/normalize-budget-item-sessions';

@Injectable()
export class CreateBudgetUseCase implements IUseCase<
  CreateBudgetDto,
  BudgetDetail
> {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly validateItemReferences: ValidateBudgetItemReferencesService,
    private readonly syncSalesOpportunity: SyncBudgetSalesOpportunityService,
  ) {}

  async execute(dto: CreateBudgetDto): Promise<BudgetDetail> {
    await this.assertPatientExists.execute(
      CreateBudgetUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const pricing = resolveBudgetPricing(CreateBudgetUseCase.name, dto.input);
    const items = await this.buildItems(dto.storeId, '', dto.input.items);

    const budget = Budget.create({
      storeId: dto.storeId,
      patientId: dto.patientId,
      description: dto.input.description.trim(),
      date: dto.input.date,
      observations: dto.input.observations.trim(),
      responsibleId: dto.input.responsibleId,
      responsibleName: dto.input.responsibleName.trim(),
      discountType: pricing.discountType,
      discountValue: pricing.discountValue,
      subtotalCents: pricing.subtotalCents,
      finalValueCents: pricing.finalValueCents,
      installmentEnabled: dto.input.installmentEnabled,
      downPaymentCents: dto.input.installmentEnabled
        ? dto.input.downPaymentCents
        : 0,
      installmentsCount: dto.input.installmentEnabled
        ? dto.input.installmentsCount
        : 0,
      status: 'pending',
    });

    const itemsWithBudget = items.map((item) =>
      BudgetItem.create({
        storeId: dto.storeId,
        budgetId: budget.id,
        planId: item.planId,
        treatmentId: item.treatmentId,
        professionalId: item.professionalId,
        professionalName: item.professionalName,
        planName: item.planName,
        treatmentName: item.treatmentName,
        valueCents: item.valueCents,
        locationType: item.locationType,
        locationLabel: item.locationLabel,
        sessionIndex: item.sessionIndex,
        sessionTotal: item.sessionTotal,
        sortOrder: item.sortOrder,
      }),
    );

    const detail = await this.budgetRepository.save({
      budget,
      items: itemsWithBudget,
    });

    try {
      await this.syncSalesOpportunity.onCreated({
        storeId: dto.storeId,
        budgetId: detail.budget.id,
        patientId: dto.patientId,
        description: detail.budget.description,
      });
    } catch (error) {
      await this.budgetRepository.delete(
        dto.storeId,
        dto.patientId,
        detail.budget.id,
      );
      throw error;
    }

    return detail;
  }

  private async buildItems(
    storeId: string,
    budgetId: string,
    items: CreateBudgetDto['input']['items'],
  ) {
    const resolved: Array<{
      storeId: string;
      budgetId: string;
      planId: string;
      treatmentId: string;
      professionalId: string;
      professionalName: string;
      planName: string;
      treatmentName: string;
      valueCents: number;
      locationType: CreateBudgetDto['input']['items'][number]['locationType'];
      locationLabel: string;
      sessionIndex: number | null;
      sessionTotal: number | null;
      sortOrder: number;
    }> = [];
    for (const item of items) {
      const reference = await this.validateItemReferences.resolve(
        CreateBudgetUseCase.name,
        storeId,
        { planId: item.planId, treatmentId: item.treatmentId },
      );
      const sessions = normalizeBudgetItemSessions(item);
      resolved.push({
        storeId,
        budgetId,
        planId: item.planId,
        treatmentId: item.treatmentId,
        professionalId: item.professionalId,
        professionalName: item.professionalName.trim(),
        planName: reference.planName,
        treatmentName: reference.treatmentName,
        valueCents: item.valueCents,
        locationType: item.locationType,
        locationLabel: resolveBudgetToothLocationLabel({
          context: CreateBudgetUseCase.name,
          locationType: item.locationType,
          locationLabel: item.locationLabel,
          treatmentId: item.treatmentId,
          acceptsFaces: reference.acceptsFaces,
        }),
        sessionIndex: sessions.sessionIndex,
        sessionTotal: sessions.sessionTotal,
        sortOrder: item.sortOrder,
      });
    }
    return resolved;
  }
}
