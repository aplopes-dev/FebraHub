import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CreateExpenseUseCase } from '../../../../application/use-cases/create-expense/create-expense.use-case';
import { CreateExpenseDto } from './create-expense.dto';
import { CreateExpensePresenter } from './create-expense.presenter';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('v1/finance')
export class CreateExpenseRoute {
  constructor(private readonly createExpense: CreateExpenseUseCase) {}

  @Post('expenses')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('manage', 'Finance')
  @ApiOperation({ summary: 'Criar despesa operacional' })
  async handle(@StoreId() storeId: string, @Body() dto: CreateExpenseDto) {
    const expense = await this.createExpense.execute({ storeId, ...dto });
    return CreateExpensePresenter.toHttp(expense);
  }
}
