import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RestoreFinancialEntryUseCase } from '../../../../application/use-cases/restore-financial-entry/restore-financial-entry.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { FinancialEntryPresenter } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial-entries')
export class RestoreFinancialEntryRoute {
  constructor(
    private readonly restoreFinancialEntry: RestoreFinancialEntryUseCase,
  ) {}

  @Post(':id/restore')
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Restaurar lançamento financeiro excluído',
    description: 'Idempotente: restaurar quem já está ativo devolve 200.',
  })
  @ApiResponse({ status: 404, description: 'Lançamento não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const entry = await this.restoreFinancialEntry.execute({
      organizationId,
      id,
    });
    return FinancialEntryPresenter.toHttpSingle(entry);
  }
}
