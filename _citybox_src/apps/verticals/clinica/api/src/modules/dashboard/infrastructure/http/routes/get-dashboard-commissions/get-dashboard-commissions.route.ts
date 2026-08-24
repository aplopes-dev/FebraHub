import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetDashboardCommissionsUseCase } from '../../../../application/use-cases/get-dashboard-commissions/get-dashboard-commissions.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { GetDashboardCommissionsQueryDto } from './get-dashboard-commissions.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class GetDashboardCommissionsRoute {
  constructor(
    private readonly getDashboardCommissions: GetDashboardCommissionsUseCase,
  ) {}

  @Get('commissions')
  @ApiOperation({
    summary:
      'Agregar comissões pagas do dashboard (total, breakdowns, ranking)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: GetDashboardCommissionsQueryDto,
  ) {
    const result = await this.getDashboardCommissions.execute({
      storeId,
      periodMode: query.periodMode,
      year: query.year,
      month: query.month,
    });

    return { data: result };
  }
}
