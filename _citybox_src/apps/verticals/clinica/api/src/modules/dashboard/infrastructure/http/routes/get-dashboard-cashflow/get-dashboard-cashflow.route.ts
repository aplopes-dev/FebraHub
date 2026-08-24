import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetDashboardCashflowUseCase } from '../../../../application/use-cases/get-dashboard-cashflow/get-dashboard-cashflow.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { GetDashboardCashflowQueryDto } from './get-dashboard-cashflow.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class GetDashboardCashflowRoute {
  constructor(
    private readonly getDashboardCashflow: GetDashboardCashflowUseCase,
  ) {}

  @Get('cashflow')
  @ApiOperation({
    summary: 'Agregar receitas x despesas do dashboard (paid + forecast)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: GetDashboardCashflowQueryDto,
  ) {
    const result = await this.getDashboardCashflow.execute({
      storeId,
      periodMode: query.periodMode,
      year: query.year,
      month: query.month,
    });

    return { data: result };
  }
}
