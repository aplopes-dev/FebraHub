import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindProductionOrderByIdUseCase } from '../../../../application/use-cases/find-production-order-by-id/find-production-order-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ProductionOrderPresenter } from '../shared/production-order.presenter';

@ApiTags('production-orders')
@Controller('v1/production-orders')
export class FindProductionOrderByIdRoute {
  constructor(
    private readonly findProductionOrderById: FindProductionOrderByIdUseCase,
  ) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Detalhar ordem de produção',
    description:
      'Inclui os insumos calculados (BOM × quantidade) para exibição.',
  })
  @ApiResponse({ status: 404, description: 'Ordem de produção não encontrada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.findProductionOrderById.execute({
      organizationId,
      id,
    });

    return ProductionOrderPresenter.toHttpDetail(result);
  }
}
