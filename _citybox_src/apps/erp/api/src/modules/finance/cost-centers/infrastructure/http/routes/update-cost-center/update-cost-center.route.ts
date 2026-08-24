import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateCostCenterUseCase } from '../../../../application/use-cases/update-cost-center/update-cost-center.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { UpdateCostCenterHttpDto } from '../shared/cost-center.dto';
import { CostCenterPresenter } from '../shared/cost-center.presenter';

@ApiTags('cost-centers')
@Controller('v1/cost-centers')
export class UpdateCostCenterRoute {
  constructor(private readonly updateCostCenter: UpdateCostCenterUseCase) {}

  @Put(':id')
  @RequirePermission('store.finance.manage')
  @ApiOperation({ summary: 'Atualizar centro de custo' })
  @ApiResponse({ status: 404, description: 'Centro de custo não encontrado' })
  @ApiResponse({ status: 409, description: 'Nome já cadastrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCostCenterHttpDto,
  ) {
    const costCenter = await this.updateCostCenter.execute({
      organizationId,
      id,
      name: dto.name,
    });
    return CostCenterPresenter.toHttpSingle(costCenter);
  }
}
