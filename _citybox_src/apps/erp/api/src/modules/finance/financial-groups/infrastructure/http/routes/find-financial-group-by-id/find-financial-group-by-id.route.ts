import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindFinancialGroupByIdUseCase } from '../../../../application/use-cases/find-financial-group-by-id/find-financial-group-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { FinancialGroupPresenter } from '../shared/financial-group.presenter';

@ApiTags('financial-groups')
@Controller('v1/financial-groups')
export class FindFinancialGroupByIdRoute {
  constructor(private readonly findGroup: FindFinancialGroupByIdUseCase) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Detalhar grupo financeiro',
    description:
      'Devolve também o grupo excluído (a aba "Excluídos" leva até ele).',
  })
  @ApiResponse({ status: 404, description: 'Grupo não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const group = await this.findGroup.execute({ organizationId, id });
    return FinancialGroupPresenter.toHttpSingle(group);
  }
}
