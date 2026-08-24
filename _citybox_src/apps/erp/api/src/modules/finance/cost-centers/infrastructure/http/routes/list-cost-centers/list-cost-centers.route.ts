import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListCostCentersUseCase } from '../../../../application/use-cases/list-cost-centers/list-cost-centers.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListCostCentersQueryDto } from '../shared/cost-center.dto';
import { CostCenterPresenter } from '../shared/cost-center.presenter';

@ApiTags('cost-centers')
@Controller('v1/cost-centers')
export class ListCostCentersRoute {
  constructor(private readonly listCostCenters: ListCostCentersUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Listar centros de custo',
    description:
      '`tabCounts` conta o cadastro inteiro da organização, ignorando a busca.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListCostCentersQueryDto,
  ) {
    const result = await this.listCostCenters.execute({
      organizationId,
      tab: query.tab,
      search: query.search?.trim() || undefined,
      page: query.page,
      perPage: query.perPage,
    });
    return CostCenterPresenter.toHttpList(result);
  }
}
