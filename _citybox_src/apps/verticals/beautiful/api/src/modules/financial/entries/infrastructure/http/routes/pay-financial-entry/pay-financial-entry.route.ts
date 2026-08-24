import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PayFinancialEntryUseCase } from '../../../../application/use-cases/pay-financial-entry/pay-financial-entry.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { PayFinancialEntryBodyDto } from '../shared/financial-entry-body.dto';
import { toFinancialEntryResponseFromEntity } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequirePermission('access', 'Financial')
export class PayFinancialEntryRoute {
  constructor(private readonly payFinancialEntry: PayFinancialEntryUseCase) {}

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Registrar pagamento de despesa' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') entryId: string,
    @Body() body: PayFinancialEntryBodyDto,
  ) {
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
