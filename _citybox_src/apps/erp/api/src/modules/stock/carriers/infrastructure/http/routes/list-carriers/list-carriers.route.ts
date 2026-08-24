import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListCarriersUseCase } from '../../../../application/use-cases/list-carriers/list-carriers.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListCarriersQueryDto } from '../shared/carrier.dto';
import { CarrierPresenter } from '../shared/carrier.presenter';

@ApiTags('carriers')
@Controller('v1/carriers')
export class ListCarriersRoute {
  constructor(private readonly listCarriers: ListCarriersUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Listar transportadoras',
    description:
      'Transportadoras da organização ativa. `tabCounts` conta o cadastro inteiro, ignorando a busca.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListCarriersQueryDto,
  ) {
    const result = await this.listCarriers.execute({
      organizationId,
      search: query.search?.trim() || undefined,
      tab: query.tab,
      page: query.page,
      perPage: query.perPage,
    });

    return CarrierPresenter.toHttpList(result);
  }
}
