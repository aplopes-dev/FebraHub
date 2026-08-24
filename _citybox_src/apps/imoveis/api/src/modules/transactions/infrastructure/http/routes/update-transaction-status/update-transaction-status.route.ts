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
import { UpdateTransactionStatusUseCase } from '../../../../application/use-cases/update-transaction-status/update-transaction-status.use-case';
import { UpdateTransactionStatusDto } from './update-transaction-status.dto';
import { UpdateTransactionStatusPresenter } from './update-transaction-status.presenter';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('v1/transactions')
export class UpdateTransactionStatusRoute {
  constructor(
    private readonly updateTransactionStatus: UpdateTransactionStatusUseCase,
  ) {}

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('manage', 'Transaction')
  @ApiOperation({
    summary: 'Concluir ou cancelar negócio (libera/bloqueia imóvel)',
  })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionStatusDto,
  ) {
    const transaction = await this.updateTransactionStatus.execute({
      storeId,
      id,
      status: dto.status,
      actorName: dto.actorName,
    });
    return UpdateTransactionStatusPresenter.toHttp(transaction);
  }
}
