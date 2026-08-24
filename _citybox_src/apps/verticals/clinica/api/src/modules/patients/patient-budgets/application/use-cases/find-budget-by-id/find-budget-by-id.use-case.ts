import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { BudgetRepository } from '../../../domain/repositories/budget.repository.interface';
import type { BudgetDetail } from '../../../domain/repositories/budget.repository.interface';
import { BudgetNotFoundError } from '../../../domain/errors/budget-not-found.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type { FindBudgetByIdDto } from '../../dtos/budget.dto';

@Injectable()
export class FindBudgetByIdUseCase implements IUseCase<
  FindBudgetByIdDto,
  BudgetDetail
> {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(dto: FindBudgetByIdDto): Promise<BudgetDetail> {
    await this.assertPatientExists.execute(
      FindBudgetByIdUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const detail = await this.budgetRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.budgetId,
    );
    if (!detail) {
      throw new BudgetNotFoundError(FindBudgetByIdUseCase.name, dto.budgetId);
    }
    return detail;
  }
}
