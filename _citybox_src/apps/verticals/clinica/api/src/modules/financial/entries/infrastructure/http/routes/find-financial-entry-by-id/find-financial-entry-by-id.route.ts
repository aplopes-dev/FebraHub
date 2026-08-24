import { Controller, ForbiddenException, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindFinancialEntryByIdUseCase } from '../../../../application/use-cases/find-financial-entry-by-id/find-financial-entry-by-id.use-case';
import type { AuthenticatedUser } from '../../../../../../../shared/infra/http/auth/authenticated-user';
import { CurrentUser } from '../../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  type PermissionUser,
  RequireAnyPermission,
} from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { resolveReadableFinancialEntryTypes } from '../../../../../../../shared/infra/http/permissions/assert-financial-permission';
import { toFinancialEntryResponse } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequireAnyPermission(
  { action: 'read', subject: 'FinancialIncome' },
  { action: 'read', subject: 'FinancialExpense' },
)
export class FindFinancialEntryByIdRoute {
  constructor(
    private readonly findFinancialEntryById: FindFinancialEntryByIdUseCase,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do lançamento financeiro' })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: AuthenticatedUser & PermissionUser,
    @Param('id') entryId: string,
  ) {
    const loaded = await this.findFinancialEntryById.execute({
      storeId,
      entryId,
    });
    const allowed = resolveReadableFinancialEntryTypes(user);
    if (!allowed.includes(loaded.entry.type)) {
      throw new ForbiddenException(
        'Você não tem permissão para visualizar este lançamento',
      );
    }
    return { data: toFinancialEntryResponse(loaded) };
  }
}
