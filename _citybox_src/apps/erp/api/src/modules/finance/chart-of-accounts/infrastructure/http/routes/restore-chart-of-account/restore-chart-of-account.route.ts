import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RestoreChartOfAccountUseCase } from '../../../../application/use-cases/restore-chart-of-account/restore-chart-of-account.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ChartOfAccountPresenter } from '../shared/chart-of-account.presenter';

@ApiTags('chart-of-accounts')
@Controller('v1/chart-of-accounts')
export class RestoreChartOfAccountRoute {
  constructor(private readonly restoreAccount: RestoreChartOfAccountUseCase) {}

  @Post(':id/restore')
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Restaurar conta excluída',
    description: 'Idempotente: restaurar uma conta já ativa devolve 200.',
  })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const item = await this.restoreAccount.execute({ organizationId, id });
    return ChartOfAccountPresenter.toHttpSingle(item);
  }
}
