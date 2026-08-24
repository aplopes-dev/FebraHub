import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindFinancialEntryByIdUseCase } from '../../../../application/use-cases/find-financial-entry-by-id/find-financial-entry-by-id.use-case';
import { PayFinancialEntryUseCase } from '../../../../application/use-cases/pay-financial-entry/pay-financial-entry.use-case';
import {
  type PermissionUser,
  RequirePermission,
} from '../../../../../../../shared/infra/http/decorators/permissions';
import { CurrentUser } from '../../../../../../../shared/infra/http/decorators/current-user.decorator';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { assertFinancialEntryAction } from '../../../../../../../shared/infra/http/permissions/assert-financial-permission';
import { PayFinancialEntryBodyDto } from '../shared/financial-entry-body.dto';
import { toFinancialEntryResponseFromEntity } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequirePermission('settle', 'FinancialExpense')
export class PayFinancialEntryRoute {
  constructor(
    private readonly findFinancialEntryById: FindFinancialEntryByIdUseCase,
    private readonly payFinancialEntry: PayFinancialEntryUseCase,
  ) {}

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Registrar pagamento de despesa' })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @Param('id') entryId: string,
    @Body() body: PayFinancialEntryBodyDto,
  ) {
    const existing = await this.findFinancialEntryById.execute({
      storeId,
      entryId,
    });
    assertFinancialEntryAction(user, 'settle', existing.entry.type);

    const entry = await this.payFinancialEntry.execute({
      storeId,
      entryId,
      paymentMethod: body.paymentMethod,
      accountId: body.accountId,
      paidValueCents: body.paidValueCents,
      settledAt: body.paidAt,
      paymentType: body.paymentType,
      observation: body.observation,
      checkIssueDate: body.checkIssueDate,
      checkHolderName: body.checkHolderName,
      checkNumber: body.checkNumber,
      checkBank: body.checkBank,
      checkDocument: body.checkDocument,
    });
    return { data: toFinancialEntryResponseFromEntity(entry) };
  }
}
