import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListChartOfAccountsUseCase } from '../../../../application/use-cases/list-chart-of-accounts/list-chart-of-accounts.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListChartOfAccountsQueryDto } from '../shared/chart-of-account.dto';
import { ChartOfAccountPresenter } from '../shared/chart-of-account.presenter';

@ApiTags('chart-of-accounts')
@Controller('v1/chart-of-accounts')
export class ListChartOfAccountsRoute {
  constructor(private readonly listAccounts: ListChartOfAccountsUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Listar contas do plano de contas',
    description:
      'Contas da organização ativa, com nome e tipo do grupo financeiro. `tabCounts` conta o cadastro inteiro, ignorando a busca.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListChartOfAccountsQueryDto,
  ) {
    const result = await this.listAccounts.execute({
      organizationId,
      search: query.search?.trim() || undefined,
      tab: query.tab,
      page: query.page,
      perPage: query.perPage,
    });

    return ChartOfAccountPresenter.toHttpList(result);
  }
}
