import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteCarrierUseCase } from '../../../../application/use-cases/delete-carrier/delete-carrier.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('carriers')
@Controller('v1/carriers')
export class DeleteCarrierRoute {
  constructor(private readonly deleteCarrier: DeleteCarrierUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('store.stock.manage')
  @ApiOperation({
    summary: 'Excluir transportadora',
    description:
      'Soft-delete: a transportadora sai da aba de ativas, mas os pedidos já registrados continuam apontando para ela.',
  })
  @ApiResponse({ status: 204, description: 'Transportadora excluída' })
  @ApiResponse({ status: 404, description: 'Transportadora não encontrada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteCarrier.execute({ organizationId, id });
  }
}
