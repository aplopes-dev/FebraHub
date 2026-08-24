import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { GetTransactionByIdUseCase } from '../../../../application/use-cases/get-transaction-by-id/get-transaction-by-id.use-case';
import { GetTransactionByIdPresenter } from './get-transaction-by-id.presenter';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('v1/transactions')
export class GetTransactionByIdRoute {
  constructor(private readonly getTransactionById: GetTransactionByIdUseCase) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Transaction')
  @ApiOperation({ summary: 'Detalhe do negócio' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    const transaction = await this.getTransactionById.execute({ storeId, id });
    return GetTransactionByIdPresenter.toHttp(transaction);
  }
}
