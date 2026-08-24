import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { DeleteExpenseUseCase } from '../../../../application/use-cases/delete-expense/delete-expense.use-case';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('v1/finance')
export class DeleteExpenseRoute {
  constructor(private readonly deleteExpense: DeleteExpenseUseCase) {}

  @Delete('expenses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('manage', 'Finance')
  @ApiOperation({ summary: 'Excluir despesa operacional' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    await this.deleteExpense.execute({ storeId, id });
  }
}
