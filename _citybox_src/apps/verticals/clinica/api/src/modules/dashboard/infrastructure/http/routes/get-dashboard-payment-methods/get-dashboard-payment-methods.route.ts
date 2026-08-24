import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetDashboardPaymentMethodsUseCase } from '../../../../application/use-cases/get-dashboard-payment-methods/get-dashboard-payment-methods.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { GetDashboardPaymentMethodsQueryDto } from './get-dashboard-payment-methods.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class GetDashboardPaymentMethodsRoute {
  constructor(
    private readonly getDashboardPaymentMethods: GetDashboardPaymentMethodsUseCase,
  ) {}

  @Get('payment-methods')
  @ApiOperation({
    summary: 'Agregar recebimentos do dashboard por meio de pagamento',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: GetDashboardPaymentMethodsQueryDto,
  ) {
    const result = await this.getDashboardPaymentMethods.execute({
      storeId,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    return { data: result };
  }
}
