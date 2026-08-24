import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CancelStockTransferUseCase } from '../../../../application/use-cases/cancel-stock-transfer/cancel-stock-transfer.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  Actor,
  OrganizationId,
} from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { RequestActor } from '../../../../../../shared/infra/tenancy/tenant-context';
import { StockTransferPresenter } from '../shared/stock-transfer.presenter';

@ApiTags('stock-transfers')
@Controller('v1/stock-transfers')
export class CancelStockTransferRoute {
  constructor(
    private readonly cancelStockTransfer: CancelStockTransferUseCase,
  ) {}

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('store.stock.manage')
  @ApiOperation({ summary: 'Cancelar transferência (estorno no ledger)' })
  async handle(
    @OrganizationId() organizationId: string,
    @Actor() actor: RequestActor,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.cancelStockTransfer.execute({
      organizationId,
      id,
      createdByUserId: actor.userId,
    });

    return StockTransferPresenter.toHttpCancelled(result.transfer);
  }
}
