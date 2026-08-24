import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ListExpensesUseCase } from '../../../../application/use-cases/list-expenses/list-expenses.use-case';
import { ListExpensesPresenter } from './list-expenses.presenter';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('v1/finance')
export class ListExpensesRoute {
  constructor(private readonly listExpenses: ListExpensesUseCase) {}

  @Get('expenses')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Finance')
  @ApiOperation({ summary: 'Listar despesas operacionais' })
  async handle(@StoreId() storeId: string) {
    const expenses = await this.listExpenses.execute({ storeId });
    return ListExpensesPresenter.toHttp(expenses);
  }
}
