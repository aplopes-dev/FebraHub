import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialGroupRepository } from '../../../../financial-groups/domain/repositories/financial-group.repository.interface';
import { ChartOfAccountRepository } from '../../../domain/repositories/chart-of-account.repository.interface';
import { ChartOfAccountNotFoundError } from '../../../domain/errors/chart-of-account-not-found.error';
import { ChartOfAccountNameTakenError } from '../../../domain/errors/chart-of-account-name-taken.error';
import { assertFinancialGroupExists } from '../assert-financial-group-exists';
import type {
  ChartOfAccountListItem,
  UpdateChartOfAccountDto,
} from '../../dtos/chart-of-account.dto';

@Injectable()
export class UpdateChartOfAccountUseCase implements IUseCase<
  UpdateChartOfAccountDto,
  ChartOfAccountListItem
> {
  constructor(
    private readonly accountRepository: ChartOfAccountRepository,
    private readonly financialGroupRepository: FinancialGroupRepository,
  ) {}

  async execute(
    input: UpdateChartOfAccountDto,
  ): Promise<ChartOfAccountListItem> {
    const account = await this.accountRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!account) throw new ChartOfAccountNotFoundError(input.id);

    const name = input.name.trim();
    const existing = await this.accountRepository.findByName(
      input.organizationId,
      name,
    );
    if (existing && existing.id !== account.id) {
      throw new ChartOfAccountNameTakenError(name);
    }

    const group = await assertFinancialGroupExists(
      this.financialGroupRepository,
      input.organizationId,
      input.financialGroupId,
    );

    const saved = await this.accountRepository.save(
      account.update({
        name,
        financialGroupId: input.financialGroupId,
        availableForPdv: input.availableForPdv,
      }),
    );

    return {
      account: saved,
      financialGroupName: group.name,
      financialGroupType: group.type,
    };
  }
}
