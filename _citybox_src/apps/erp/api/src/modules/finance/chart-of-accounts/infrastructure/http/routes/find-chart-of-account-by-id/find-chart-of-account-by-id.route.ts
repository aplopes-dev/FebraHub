import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindChartOfAccountByIdUseCase } from '../../../../application/use-cases/find-chart-of-account-by-id/find-chart-of-account-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ChartOfAccountPresenter } from '../shared/chart-of-account.presenter';

@ApiTags('chart-of-accounts')
@Controller('v1/chart-of-accounts')
export class FindChartOfAccountByIdRoute {
  constructor(private readonly findAccount: FindChartOfAccountByIdUseCase) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Detalhar conta do plano de contas',
    description: 'Devolve também a conta excluída, para a tela de restauração.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const item = await this.findAccount.execute({ organizationId, id });
    return ChartOfAccountPresenter.toHttpSingle(item);
  }
}
