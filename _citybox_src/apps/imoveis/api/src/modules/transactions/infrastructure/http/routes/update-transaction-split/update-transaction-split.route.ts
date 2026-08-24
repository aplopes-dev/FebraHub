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
import { UpdateTransactionSplitUseCase } from '../../../../application/use-cases/update-transaction-split/update-transaction-split.use-case';
import { UpdateTransactionSplitDto } from './update-transaction-split.dto';
import { UpdateTransactionSplitPresenter } from './update-transaction-split.presenter';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('v1/transactions')
export class UpdateTransactionSplitRoute {
  constructor(
    private readonly updateTransactionSplit: UpdateTransactionSplitUseCase,
  ) {}

  @Patch(':id/split')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('manage', 'Transaction')
  @ApiOperation({ summary: 'Atualizar split de comissões' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionSplitDto,
  ) {
    const transaction = await this.updateTransactionSplit.execute({
      storeId,
      id,
      ...dto,
    });
    return UpdateTransactionSplitPresenter.toHttp(transaction);
  }
}
