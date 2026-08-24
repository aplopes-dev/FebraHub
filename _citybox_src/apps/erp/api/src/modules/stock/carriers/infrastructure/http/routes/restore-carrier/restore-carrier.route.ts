import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RestoreCarrierUseCase } from '../../../../application/use-cases/restore-carrier/restore-carrier.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CarrierPresenter } from '../shared/carrier.presenter';

@ApiTags('carriers')
@Controller('v1/carriers')
export class RestoreCarrierRoute {
  constructor(private readonly restoreCarrier: RestoreCarrierUseCase) {}

  @Post(':id/restore')
  @RequirePermission('store.stock.manage')
  @ApiOperation({ summary: 'Restaurar transportadora excluída' })
  @ApiResponse({ status: 404, description: 'Transportadora não encontrada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const carrier = await this.restoreCarrier.execute({ organizationId, id });
    return CarrierPresenter.toHttpSingle(carrier);
  }
}
