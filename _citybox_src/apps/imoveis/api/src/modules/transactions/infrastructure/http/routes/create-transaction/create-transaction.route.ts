import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CreateTransactionUseCase } from '../../../../application/use-cases/create-transaction/create-transaction.use-case';
import { CreateTransactionDto } from './create-transaction.dto';
import { CreateTransactionPresenter } from './create-transaction.presenter';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('v1/transactions')
export class CreateTransactionRoute {
  constructor(private readonly createTransaction: CreateTransactionUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('manage', 'Transaction')
  @ApiOperation({ summary: 'Criar negócio a partir de um rascunho' })
  async handle(@StoreId() storeId: string, @Body() dto: CreateTransactionDto) {
    const transaction = await this.createTransaction.execute({
      storeId,
      ...dto,
    });
    return CreateTransactionPresenter.toHttp(transaction);
  }
}
