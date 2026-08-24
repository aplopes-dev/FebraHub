import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetBillingKpisUseCase } from '../../../../application/use-cases/get-billing-kpis/get-billing-kpis.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { GetBillingKpisQueryDto } from './get-billing-kpis.query';

@ApiTags('billing')
@Controller('v1/billing')
@RequirePermission('platform.admin')
export class GetBillingKpisRoute {
  constructor(private readonly getBillingKpis: GetBillingKpisUseCase) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Obter KPIs financeiros de faturamento' })
  async handle(@Query() query: GetBillingKpisQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    return this.getBillingKpis.execute({
      startDate,
      endDate,
    });
  }
}
