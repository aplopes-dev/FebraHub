import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindCarrierByIdUseCase } from '../../../../application/use-cases/find-carrier-by-id/find-carrier-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CarrierPresenter } from '../shared/carrier.presenter';

@ApiTags('carriers')
@Controller('v1/carriers')
export class FindCarrierByIdRoute {
  constructor(private readonly findCarrierById: FindCarrierByIdUseCase) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Detalhar transportadora',
    description:
      'Devolve a transportadora, inclusive excluída — a aba "Excluídas" da listagem leva até ela.',
  })
  @ApiResponse({ status: 404, description: 'Transportadora não encontrada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const carrier = await this.findCarrierById.execute({
      organizationId,
      id,
    });

    return CarrierPresenter.toHttpSingle(carrier);
  }
}
