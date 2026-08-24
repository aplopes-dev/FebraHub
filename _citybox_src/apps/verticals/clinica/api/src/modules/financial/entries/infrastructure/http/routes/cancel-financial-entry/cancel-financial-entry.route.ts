import { Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CancelFinancialEntryUseCase } from '../../../../application/use-cases/cancel-financial-entry/cancel-financial-entry.use-case';
import { FindFinancialEntryByIdUseCase } from '../../../../application/use-cases/find-financial-entry-by-id/find-financial-entry-by-id.use-case';
import {
  type AuthenticatedUser,
} from '../../../../../../../shared/infra/http/auth/authenticated-user';
import { CurrentUser } from '../../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  type PermissionUser,
  RequireAnyPermission,
} from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { assertFinancialEntryAction } from '../../../../../../../shared/infra/http/permissions/assert-financial-permission';
import { toFinancialEntryResponseFromEntity } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequireAnyPermission(
  { action: 'settle', subject: 'FinancialIncome' },
  { action: 'settle', subject: 'FinancialExpense' },
  { action: 'delete', subject: 'FinancialIncome' },
  { action: 'delete', subject: 'FinancialExpense' },
)
export class CancelFinancialEntryRoute {
  constructor(
    private readonly findFinancialEntryById: FindFinancialEntryByIdUseCase,
    private readonly cancelFinancialEntry: CancelFinancialEntryUseCase,
  ) {}

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar lançamento financeiro' })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() actor: AuthenticatedUser & PermissionUser,
    @Param('id') entryId: string,
  ) {
    const existing = await this.findFinancialEntryById.execute({
      storeId,
      entryId,
    });
    // Cancelar liquidação ≈ settle; se só tem delete, também permite.
    try {
      assertFinancialEntryAction(actor, 'settle', existing.entry.type);
    } catch {
      assertFinancialEntryAction(actor, 'delete', existing.entry.type);
    }

    const entry = await this.cancelFinancialEntry.execute({
      storeId,
      entryId,
      actor,
    });
    return { data: toFinancialEntryResponseFromEntity(entry) };
  }
}
