import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateCostCenterUseCase } from '../../../../application/use-cases/create-cost-center/create-cost-center.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CreateCostCenterHttpDto } from '../shared/cost-center.dto';
import { CostCenterPresenter } from '../shared/cost-center.presenter';

@ApiTags('cost-centers')
@Controller('v1/cost-centers')
export class CreateCostCenterRoute {
  constructor(private readonly createCostCenter: CreateCostCenterUseCase) {}

  @Post()
  @RequirePermission('store.finance.manage')
  @ApiOperation({ summary: 'Criar centro de custo' })
  @ApiResponse({ status: 201, description: 'Centro de custo criado' })
  @ApiResponse({ status: 409, description: 'Nome já cadastrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: CreateCostCenterHttpDto,
  ) {
    const costCenter = await this.createCostCenter.execute({
      organizationId,
      name: dto.name,
    });
    return CostCenterPresenter.toHttpSingle(costCenter);
  }
}
