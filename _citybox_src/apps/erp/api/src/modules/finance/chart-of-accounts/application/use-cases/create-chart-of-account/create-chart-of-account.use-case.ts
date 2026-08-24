import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialGroupRepository } from '../../../../financial-groups/domain/repositories/financial-group.repository.interface';
import { ChartOfAccount } from '../../../domain/entities/chart-of-account.entity';
import { ChartOfAccountRepository } from '../../../domain/repositories/chart-of-account.repository.interface';
import { ChartOfAccountNameTakenError } from '../../../domain/errors/chart-of-account-name-taken.error';
import { assertFinancialGroupExists } from '../assert-financial-group-exists';
import type {
  ChartOfAccountListItem,
  CreateChartOfAccountDto,
} from '../../dtos/chart-of-account.dto';

@Injectable()
export class CreateChartOfAccountUseCase implements IUseCase<
  CreateChartOfAccountDto,
  ChartOfAccountListItem
> {
  constructor(
    private readonly accountRepository: ChartOfAccountRepository,
    private readonly financialGroupRepository: FinancialGroupRepository,
  ) {}

  async execute(
    input: CreateChartOfAccountDto,
  ): Promise<ChartOfAccountListItem> {
    const name = input.name.trim();
    const existing = await this.accountRepository.findByName(
      input.organizationId,
      name,
    );
    if (existing) throw new ChartOfAccountNameTakenError(name);

    const group = await assertFinancialGroupExists(
      this.financialGroupRepository,
      input.organizationId,
      input.financialGroupId,
    );

    const account = await this.accountRepository.save(
      ChartOfAccount.create({
        organizationId: input.organizationId,
        name,
        financialGroupId: input.financialGroupId,
        availableForPdv: input.availableForPdv ?? false,
      }),
    );

    return {
      account,
      financialGroupName: group.name,
      financialGroupType: group.type,
    };
  }
}
