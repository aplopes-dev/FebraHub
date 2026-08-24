import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListFinancialEntriesUseCase } from '../../../../application/use-cases/list-financial-entries/list-financial-entries.use-case';
import type { AuthenticatedUser } from '../../../../../../../shared/infra/http/auth/authenticated-user';
import { CurrentUser } from '../../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  type PermissionUser,
  RequireAnyPermission,
} from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { constrainFinancialEntryTypesCsv } from '../../../../../../../shared/infra/http/permissions/assert-financial-permission';
import { ListFinancialEntriesQueryDto } from './list-financial-entries.query.dto';
import { toFinancialEntryResponse } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequireAnyPermission(
  { action: 'read', subject: 'FinancialIncome' },
  { action: 'read', subject: 'FinancialExpense' },
)
export class ListFinancialEntriesRoute {
  constructor(
    private readonly listFinancialEntries: ListFinancialEntriesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar lançamentos financeiros' })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: AuthenticatedUser & PermissionUser,
    @Query() query: ListFinancialEntriesQueryDto,
  ) {
    const types = constrainFinancialEntryTypesCsv(user, query.types);
    const result = await this.listFinancialEntries.execute({
      storeId,
      ...query,
      types,
    });
    return {
      data: result.items.map((item) => toFinancialEntryResponse(item)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
