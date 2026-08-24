import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetDashboardCommissionsDetailsUseCase } from '../../../../application/use-cases/get-dashboard-commissions-details/get-dashboard-commissions-details.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { GetDashboardCommissionsDetailsQueryDto } from './get-dashboard-commissions-details.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class GetDashboardCommissionsDetailsRoute {
  constructor(
    private readonly getDashboardCommissionsDetails: GetDashboardCommissionsDetailsUseCase,
  ) {}

  @Get('commissions/details')
  @ApiOperation({
    summary: 'Detalhe paginado de comissões pagas do dashboard',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: GetDashboardCommissionsDetailsQueryDto,
  ) {
    const result = await this.getDashboardCommissionsDetails.execute({
      storeId,
      startDate: query.startDate,
      endDate: query.endDate,
      professionalId: query.professionalId,
      page: query.page,
      perPage: query.perPage,
    });

    return {
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
        totalNetCents: result.totalNetCents,
      },
    };
  }
}
