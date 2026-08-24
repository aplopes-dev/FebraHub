import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetDashboardSalesGoalsUseCase } from '../../../../application/use-cases/get-dashboard-sales-goals/get-dashboard-sales-goals.use-case';
import { RequireAnyPermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequireAnyPermission(
  { action: 'read', subject: 'Dashboard' },
  { action: 'update', subject: 'Dashboard' },
)
export class GetDashboardSalesGoalsRoute {
  constructor(
    private readonly getDashboardSalesGoals: GetDashboardSalesGoalsUseCase,
  ) {}

  @Get('sales-goals')
  @ApiOperation({
    summary:
      'Meta contínua ativa e realizado desde a criação (orçamentos aprovados; série diária para o gráfico)',
  })
  async handle(@StoreId() storeId: string) {
    const result = await this.getDashboardSalesGoals.execute({ storeId });
    return { data: result };
  }
}
