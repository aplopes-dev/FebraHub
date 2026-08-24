import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListDashboardBudgetsUseCase } from '../../../../application/use-cases/list-dashboard-budgets/list-dashboard-budgets.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListDashboardBudgetsQueryDto } from './list-dashboard-budgets.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class ListDashboardBudgetsRoute {
  constructor(
    private readonly listDashboardBudgets: ListDashboardBudgetsUseCase,
  ) {}

  @Get('budgets')
  @ApiOperation({
    summary:
      'Listar orçamentos em aberto e reprovados do dashboard (paginação server-side)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListDashboardBudgetsQueryDto,
  ) {
    const result = await this.listDashboardBudgets.execute({
      storeId,
      ...query,
    });

    return {
      data: result.items,
      meta: {
        total: result.total,
        totalValueCents: result.totalValueCents,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
