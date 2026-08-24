import { Body, Controller, ForbiddenException, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindFinancialEntryByIdUseCase } from '../../../../application/use-cases/find-financial-entry-by-id/find-financial-entry-by-id.use-case';
import { ReceiveFinancialEntryUseCase } from '../../../../application/use-cases/receive-financial-entry/receive-financial-entry.use-case';
import {
  type PermissionUser,
  RequireAnyPermission,
} from '../../../../../../../shared/infra/http/decorators/permissions';
import { CurrentUser } from '../../../../../../../shared/infra/http/decorators/current-user.decorator';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  assertCanReceiveIncomeByDueDate,
  assertReceiveSettlementDate,
} from '../../../../../../../shared/infra/http/permissions/assert-financial-permission';
import { ReceiveFinancialEntryBodyDto } from '../shared/financial-entry-body.dto';
import { toFinancialEntryResponseFromEntity } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequireAnyPermission(
  { action: 'settle', subject: 'FinancialIncome' },
  { action: 'settleFuture', subject: 'FinancialIncome' },
  { action: 'settleRetroactive', subject: 'FinancialIncome' },
)
export class ReceiveFinancialEntryRoute {
  constructor(
    private readonly findFinancialEntryById: FindFinancialEntryByIdUseCase,
    private readonly receiveFinancialEntry: ReceiveFinancialEntryUseCase,
  ) {}

  @Patch(':id/receive')
  @ApiOperation({ summary: 'Registrar recebimento de receita' })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @Param('id') entryId: string,
    @Body() body: ReceiveFinancialEntryBodyDto,
  ) {
    const existing = await this.findFinancialEntryById.execute({
      storeId,
      entryId,
    });
    if (existing.entry.type !== 'income') {
      throw new ForbiddenException(
        'Somente receitas podem ser recebidas por esta rota',
      );
    }
    assertCanReceiveIncomeByDueDate(user, existing.entry.dueDate);
    if (body.receivedAt) {
      assertReceiveSettlementDate(user, body.receivedAt);
    }

    const entry = await this.receiveFinancialEntry.execute({
      storeId,
      entryId,
      paymentMethod: body.paymentMethod,
      accountId: body.accountId,
      paidValueCents: body.paidValueCents,
      settledAt: body.receivedAt,
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
