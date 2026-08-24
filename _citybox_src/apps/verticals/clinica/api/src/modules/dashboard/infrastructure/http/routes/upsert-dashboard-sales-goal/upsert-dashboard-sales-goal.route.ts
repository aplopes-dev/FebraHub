import { Body, Controller, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpsertDashboardSalesGoalUseCase } from '../../../../application/use-cases/upsert-dashboard-sales-goal/upsert-dashboard-sales-goal.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpsertDashboardSalesGoalBodyDto } from './upsert-dashboard-sales-goal.body.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('update', 'Dashboard')
export class UpsertDashboardSalesGoalRoute {
  constructor(
    private readonly upsertDashboardSalesGoal: UpsertDashboardSalesGoalUseCase,
  ) {}

  @Put('sales-goals')
  @ApiOperation({
    summary:
      'Criar ou substituir a meta contínua de vendas (centavos); substituir reinicia o acúmulo',
  })
  async handle(
    @StoreId() storeId: string,
    @Body() body: UpsertDashboardSalesGoalBodyDto,
  ) {
    const result = await this.upsertDashboardSalesGoal.execute({
      storeId,
      goalCents: body.goalCents,
    });
    return { data: result };
  }
}
