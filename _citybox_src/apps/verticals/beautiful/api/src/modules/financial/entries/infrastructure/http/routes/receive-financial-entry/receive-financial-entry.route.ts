import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReceiveFinancialEntryUseCase } from '../../../../application/use-cases/receive-financial-entry/receive-financial-entry.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ReceiveFinancialEntryBodyDto } from '../shared/financial-entry-body.dto';
import { toFinancialEntryResponseFromEntity } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequirePermission('access', 'Financial')
export class ReceiveFinancialEntryRoute {
  constructor(
    private readonly receiveFinancialEntry: ReceiveFinancialEntryUseCase,
  ) {}

  @Patch(':id/receive')
  @ApiOperation({ summary: 'Registrar recebimento de receita' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') entryId: string,
    @Body() body: ReceiveFinancialEntryBodyDto,
  ) {
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
