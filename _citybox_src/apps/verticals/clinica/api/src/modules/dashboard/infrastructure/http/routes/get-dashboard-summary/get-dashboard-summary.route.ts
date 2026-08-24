import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetDashboardSummaryUseCase } from '../../../../application/use-cases/get-dashboard-summary/get-dashboard-summary.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class GetDashboardSummaryRoute {
  constructor(
    private readonly getDashboardSummary: GetDashboardSummaryUseCase,
  ) {}

  @Get('summary')
  @ApiOperation({
    summary:
      'Resumo do dashboard (débitos em atraso, orçamentos abertos/reprovados e aniversariantes)',
  })
  async handle(@StoreId() storeId: string) {
    const result = await this.getDashboardSummary.execute({ storeId });
    return { data: result };
  }
}
