import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetDashboardTicketMedioUseCase } from '../../../../application/use-cases/get-dashboard-ticket-medio/get-dashboard-ticket-medio.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { GetDashboardTicketMedioQueryDto } from './get-dashboard-ticket-medio.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class GetDashboardTicketMedioRoute {
  constructor(
    private readonly getDashboardTicketMedio: GetDashboardTicketMedioUseCase,
  ) {}

  @Get('ticket-medio')
  @ApiOperation({
    summary: 'Agregar ticket médio do dashboard (rendimento e lucratividade)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: GetDashboardTicketMedioQueryDto,
  ) {
    const result = await this.getDashboardTicketMedio.execute({
      storeId,
      periodMode: query.periodMode,
      year: query.year,
      month: query.month,
    });

    return { data: result };
  }
}
