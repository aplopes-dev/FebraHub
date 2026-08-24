import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindFinancialEntryByIdUseCase } from '../../../../application/use-cases/find-financial-entry-by-id/find-financial-entry-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { FinancialEntryPresenter } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial-entries')
export class FindFinancialEntryByIdRoute {
  constructor(
    private readonly findFinancialEntry: FindFinancialEntryByIdUseCase,
  ) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Detalhar lançamento financeiro',
    description: 'Devolve também o excluído — a aba "Excluídos" leva até ele.',
  })
  @ApiResponse({ status: 404, description: 'Lançamento não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const entry = await this.findFinancialEntry.execute({
      organizationId,
      id,
    });
    return FinancialEntryPresenter.toHttpSingle(entry);
  }
}
