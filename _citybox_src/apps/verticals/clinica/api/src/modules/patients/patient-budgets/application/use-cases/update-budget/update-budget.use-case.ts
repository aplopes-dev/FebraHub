import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { BudgetItem } from '../../../domain/entities/budget-item.entity';
import { BudgetRepository } from '../../../domain/repositories/budget.repository.interface';
import type { BudgetDetail } from '../../../domain/repositories/budget.repository.interface';
import { BudgetNotFoundError } from '../../../domain/errors/budget-not-found.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { ValidateBudgetItemReferencesService } from '../../services/validate-budget-item-references.service';
import { resolveBudgetPricing } from '../../mappers/budget-pricing.mapper';
import type { UpdateBudgetDto } from '../../dtos/budget.dto';
import { resolveBudgetToothLocationLabel } from '../../../../application/utils/resolve-budget-tooth-location-label';
import { normalizeBudgetItemSessions } from '../../../domain/utils/normalize-budget-item-sessions';

@Injectable()
export class UpdateBudgetUseCase implements IUseCase<
  UpdateBudgetDto,
  BudgetDetail
> {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly validateItemReferences: ValidateBudgetItemReferencesService,
  ) {}

  async execute(dto: UpdateBudgetDto): Promise<BudgetDetail> {
    await this.assertPatientExists.execute(
      UpdateBudgetUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const existing = await this.budgetRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.budgetId,
    );
    if (!existing) {
      throw new BudgetNotFoundError(UpdateBudgetUseCase.name, dto.budgetId);
    }

    existing.budget.assertMutable(UpdateBudgetUseCase.name, dto.budgetId);

    const pricing = resolveBudgetPricing(UpdateBudgetUseCase.name, dto.input);
    existing.budget.update({
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
    });

    const items = await this.buildItems(
      dto.storeId,
      dto.budgetId,
      dto.input.items,
    );
    const itemsWithBudget = items.map((item) =>
      BudgetItem.create({
        storeId: dto.storeId,
        budgetId: dto.budgetId,
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

    return this.budgetRepository.save({
      budget: existing.budget,
      items: itemsWithBudget,
    });
  }

  private async buildItems(
    storeId: string,
    budgetId: string,
    items: UpdateBudgetDto['input']['items'],
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
      locationType: UpdateBudgetDto['input']['items'][number]['locationType'];
      locationLabel: string;
      sessionIndex: number | null;
      sessionTotal: number | null;
      sortOrder: number;
    }> = [];
    for (const item of items) {
      const reference = await this.validateItemReferences.resolve(
        UpdateBudgetUseCase.name,
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
          context: UpdateBudgetUseCase.name,
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
