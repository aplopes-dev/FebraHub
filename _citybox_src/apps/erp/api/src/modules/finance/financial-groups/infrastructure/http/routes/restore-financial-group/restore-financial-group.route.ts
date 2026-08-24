import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RestoreFinancialGroupUseCase } from '../../../../application/use-cases/restore-financial-group/restore-financial-group.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { FinancialGroupPresenter } from '../shared/financial-group.presenter';

@ApiTags('financial-groups')
@Controller('v1/financial-groups')
export class RestoreFinancialGroupRoute {
  constructor(private readonly restoreGroup: RestoreFinancialGroupUseCase) {}

  @Post(':id/restore')
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Restaurar grupo financeiro excluído',
    description: 'Idempotente: restaurar quem já está ativo devolve 200.',
  })
  @ApiResponse({ status: 404, description: 'Grupo não encontrado' })
  @ApiResponse({ status: 409, description: 'Nome já usado por outro grupo' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const group = await this.restoreGroup.execute({ organizationId, id });
    return FinancialGroupPresenter.toHttpSingle(group);
  }
}
