import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindFinancialEntryByIdUseCase } from '../../../../application/use-cases/find-financial-entry-by-id/find-financial-entry-by-id.use-case';
import { UpdateFinancialEntryUseCase } from '../../../../application/use-cases/update-financial-entry/update-financial-entry.use-case';
import {
  type PermissionUser,
  RequireAnyPermission,
} from '../../../../../../../shared/infra/http/decorators/permissions';
import { CurrentUser } from '../../../../../../../shared/infra/http/decorators/current-user.decorator';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { assertFinancialEntryAction } from '../../../../../../../shared/infra/http/permissions/assert-financial-permission';
import { UpdateFinancialEntryBodyDto } from '../shared/financial-entry-body.dto';
import { toFinancialEntryResponseFromEntity } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequireAnyPermission(
  { action: 'update', subject: 'FinancialIncome' },
  { action: 'update', subject: 'FinancialExpense' },
)
export class UpdateFinancialEntryRoute {
  constructor(
    private readonly findFinancialEntryById: FindFinancialEntryByIdUseCase,
    private readonly updateFinancialEntry: UpdateFinancialEntryUseCase,
  ) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar lançamento financeiro pendente' })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @Param('id') entryId: string,
    @Body() body: UpdateFinancialEntryBodyDto,
  ) {
    const existing = await this.findFinancialEntryById.execute({
      storeId,
      entryId,
    });
    assertFinancialEntryAction(user, 'update', existing.entry.type);

    const entry = await this.updateFinancialEntry.execute({
      storeId,
      entryId,
      ...body,
    });
    return { data: toFinancialEntryResponseFromEntity(entry) };
  }
}
