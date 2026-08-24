import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { BudgetRepository } from '../../../domain/repositories/budget.repository.interface';
import { BudgetNotFoundError } from '../../../domain/errors/budget-not-found.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { SyncBudgetSalesOpportunityService } from '../../services/sync-budget-sales-opportunity.service';
import type { DeleteBudgetDto } from '../../dtos/budget.dto';

@Injectable()
export class DeleteBudgetUseCase implements IUseCase<DeleteBudgetDto, void> {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly syncSalesOpportunity: SyncBudgetSalesOpportunityService,
  ) {}

  async execute(dto: DeleteBudgetDto): Promise<void> {
    await this.assertPatientExists.execute(
      DeleteBudgetUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const existing = await this.budgetRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.budgetId,
    );
    if (!existing) {
      throw new BudgetNotFoundError(DeleteBudgetUseCase.name, dto.budgetId);
    }

    existing.budget.assertMutable(DeleteBudgetUseCase.name, dto.budgetId);
    await this.syncSalesOpportunity.onDeleted(dto.storeId, dto.budgetId);
    await this.budgetRepository.delete(
      dto.storeId,
      dto.patientId,
      dto.budgetId,
    );
  }
}
