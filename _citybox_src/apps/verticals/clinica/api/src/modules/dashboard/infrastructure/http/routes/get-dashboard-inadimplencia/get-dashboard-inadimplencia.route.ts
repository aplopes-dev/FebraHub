import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetDashboardInadimplenciaUseCase } from '../../../../application/use-cases/get-dashboard-inadimplencia/get-dashboard-inadimplencia.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { GetDashboardInadimplenciaQueryDto } from './get-dashboard-inadimplencia.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class GetDashboardInadimplenciaRoute {
  constructor(
    private readonly getDashboardInadimplencia: GetDashboardInadimplenciaUseCase,
  ) {}

  @Get('inadimplencia')
  @ApiOperation({
    summary: 'Agregar inadimplência do dashboard (taxa e totais)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: GetDashboardInadimplenciaQueryDto,
  ) {
    const result = await this.getDashboardInadimplencia.execute({
      storeId,
      periodMode: query.periodMode,
      year: query.year,
      month: query.month,
    });

    return { data: result };
  }
}
