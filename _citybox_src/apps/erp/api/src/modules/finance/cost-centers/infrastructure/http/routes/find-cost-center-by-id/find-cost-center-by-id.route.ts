import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindCostCenterByIdUseCase } from '../../../../application/use-cases/find-cost-center-by-id/find-cost-center-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CostCenterPresenter } from '../shared/cost-center.presenter';

@ApiTags('cost-centers')
@Controller('v1/cost-centers')
export class FindCostCenterByIdRoute {
  constructor(private readonly findCostCenter: FindCostCenterByIdUseCase) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Detalhar centro de custo',
    description: 'Devolve também o excluído — a aba "Excluídos" leva até ele.',
  })
  @ApiResponse({ status: 404, description: 'Centro de custo não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const costCenter = await this.findCostCenter.execute({
      organizationId,
      id,
    });
    return CostCenterPresenter.toHttpSingle(costCenter);
  }
}
