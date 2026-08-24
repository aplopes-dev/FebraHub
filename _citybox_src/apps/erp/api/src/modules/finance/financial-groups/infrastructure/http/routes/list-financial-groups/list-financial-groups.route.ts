import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListFinancialGroupsUseCase } from '../../../../application/use-cases/list-financial-groups/list-financial-groups.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListFinancialGroupsQueryDto } from '../shared/financial-group.dto';
import { FinancialGroupPresenter } from '../shared/financial-group.presenter';

@ApiTags('financial-groups')
@Controller('v1/financial-groups')
export class ListFinancialGroupsRoute {
  constructor(private readonly listGroups: ListFinancialGroupsUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Listar grupos financeiros',
    description:
      'Grupos da organização ativa. `tabCounts` conta o cadastro inteiro, ignorando busca e filtro de tipo.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListFinancialGroupsQueryDto,
  ) {
    const result = await this.listGroups.execute({
      organizationId,
      search: query.search?.trim() || undefined,
      tab: query.tab,
      type: query.type,
      page: query.page,
      perPage: query.perPage,
    });

    return FinancialGroupPresenter.toHttpList(result);
  }
}
