import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { GetDealByIdUseCase } from '../../../../application/use-cases/get-deal-by-id/get-deal-by-id.use-case';
import { TransactionRepository } from '../../../../../transactions/domain/repositories/transaction.repository.interface';
import { GetDealByIdPresenter } from './get-deal-by-id.presenter';

@ApiTags('deals')
@ApiBearerAuth()
@Controller('v1/deals')
export class GetDealByIdRoute {
  constructor(
    private readonly getDealById: GetDealByIdUseCase,
    private readonly transactions: TransactionRepository,
  ) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Lead')
  @ApiOperation({ summary: 'Detalhe do negócio CRM' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    const deal = await this.getDealById.execute({ storeId, id });
    const linked = await this.transactions.findByDealId(storeId, deal.id);
    let transactionId = linked?.id;
    if (!transactionId) {
      const byLead = await this.transactions.findTransactionIdsByLeadIds(
        storeId,
        [deal.leadId],
      );
      transactionId = byLead.get(deal.leadId);
    }
    return GetDealByIdPresenter.toHttp(deal, transactionId);
  }
}
