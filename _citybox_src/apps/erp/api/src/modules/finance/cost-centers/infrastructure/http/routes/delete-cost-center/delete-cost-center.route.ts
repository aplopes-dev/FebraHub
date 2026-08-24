import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteCostCenterUseCase } from '../../../../application/use-cases/delete-cost-center/delete-cost-center.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('cost-centers')
@Controller('v1/cost-centers')
export class DeleteCostCenterRoute {
  constructor(private readonly deleteCostCenter: DeleteCostCenterUseCase) {}

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Excluir centro de custo',
    description:
      'Soft-delete: lançamentos já registrados continuam apontando para ele.',
  })
  @ApiResponse({ status: 204, description: 'Centro de custo excluído' })
  @ApiResponse({ status: 404, description: 'Centro de custo não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteCostCenter.execute({ organizationId, id });
  }
}
