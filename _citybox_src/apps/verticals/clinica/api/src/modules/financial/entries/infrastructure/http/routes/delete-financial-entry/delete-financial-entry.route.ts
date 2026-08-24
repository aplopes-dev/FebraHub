import { Controller, Delete, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeleteFinancialEntryUseCase } from '../../../../application/use-cases/delete-financial-entry/delete-financial-entry.use-case';
import { FindFinancialEntryByIdUseCase } from '../../../../application/use-cases/find-financial-entry-by-id/find-financial-entry-by-id.use-case';
import {
  type PermissionUser,
  RequireAnyPermission,
} from '../../../../../../../shared/infra/http/decorators/permissions';
import { CurrentUser } from '../../../../../../../shared/infra/http/decorators/current-user.decorator';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { assertFinancialEntryAction } from '../../../../../../../shared/infra/http/permissions/assert-financial-permission';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequireAnyPermission(
  { action: 'delete', subject: 'FinancialIncome' },
  { action: 'delete', subject: 'FinancialExpense' },
)
export class DeleteFinancialEntryRoute {
  constructor(
    private readonly findFinancialEntryById: FindFinancialEntryByIdUseCase,
    private readonly deleteFinancialEntry: DeleteFinancialEntryUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir lançamento financeiro' })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @Param('id') entryId: string,
  ): Promise<void> {
    const existing = await this.findFinancialEntryById.execute({
      storeId,
      entryId,
    });
    assertFinancialEntryAction(user, 'delete', existing.entry.type);
    await this.deleteFinancialEntry.execute({ storeId, entryId });
  }
}
