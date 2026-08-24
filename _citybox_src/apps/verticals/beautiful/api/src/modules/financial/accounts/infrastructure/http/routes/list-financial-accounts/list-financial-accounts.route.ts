import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListFinancialAccountsUseCase } from '../../../../application/use-cases/list-financial-account/list-financial-accounts.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListFinancialAccountsQueryDto } from './list-financial-accounts.query.dto';
import { toFinancialAccountResponse } from '../shared/financial-account.presenter';

@ApiTags('financial-accounts')
@Controller('v1/financial/accounts')
@RequirePermission('access', 'Financial')
export class ListFinancialAccountsRoute {
  constructor(
    private readonly listFinancialAccounts: ListFinancialAccountsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar contas financeiras' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListFinancialAccountsQueryDto,
  ) {
    const result = await this.listFinancialAccounts.execute({
      storeId,
      includeInactive: query.includeInactive,
    });
    return { data: result.items.map(toFinancialAccountResponse) };
  }
}
