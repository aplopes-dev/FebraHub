import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { TransactionRepository } from '../../../../../transactions/domain/repositories/transaction.repository.interface';
import { UpdateDealStageUseCase } from '../../../../application/use-cases/update-deal-stage/update-deal-stage.use-case';
import { UpdateDealStageDto } from './update-deal-stage.dto';
import { UpdateDealStagePresenter } from './update-deal-stage.presenter';

@ApiTags('deals')
@ApiBearerAuth()
@Controller('v1/deals')
export class UpdateDealStageRoute {
  constructor(
    private readonly updateDealStage: UpdateDealStageUseCase,
    private readonly transactions: TransactionRepository,
  ) {}

  @Patch(':id/stage')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('manage', 'Lead')
  @ApiOperation({ summary: 'Avançar etapa do funil do negócio' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDealStageDto,
  ) {
    const deal = await this.updateDealStage.execute({
      storeId,
      id,
      stage: dto.stage,
    });
    const linked = await this.transactions.findByDealId(storeId, deal.id);
    let transactionId = linked?.id;
    if (!transactionId) {
      const byLead = await this.transactions.findTransactionIdsByLeadIds(
        storeId,
        [deal.leadId],
      );
      transactionId = byLead.get(deal.leadId);
    }
    return UpdateDealStagePresenter.toHttp(deal, transactionId);
  }
}
