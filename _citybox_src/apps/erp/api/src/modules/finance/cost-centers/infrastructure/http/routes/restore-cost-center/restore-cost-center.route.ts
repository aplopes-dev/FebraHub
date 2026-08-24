import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RestoreCostCenterUseCase } from '../../../../application/use-cases/restore-cost-center/restore-cost-center.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CostCenterPresenter } from '../shared/cost-center.presenter';

@ApiTags('cost-centers')
@Controller('v1/cost-centers')
export class RestoreCostCenterRoute {
  constructor(private readonly restoreCostCenter: RestoreCostCenterUseCase) {}

  @Post(':id/restore')
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Restaurar centro de custo excluído',
    description: 'Idempotente: restaurar quem já está ativo devolve 200.',
  })
  @ApiResponse({ status: 404, description: 'Centro de custo não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const costCenter = await this.restoreCostCenter.execute({
      organizationId,
      id,
    });
    return CostCenterPresenter.toHttpSingle(costCenter);
  }
}
