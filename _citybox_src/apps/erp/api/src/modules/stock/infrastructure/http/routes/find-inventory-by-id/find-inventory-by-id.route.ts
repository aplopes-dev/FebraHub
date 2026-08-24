import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindInventoryByIdUseCase } from '../../../../application/use-cases/find-inventory-by-id/find-inventory-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { InventoryPresenter } from '../shared/inventory.presenter';

@ApiTags('inventories')
@Controller('v1/inventories')
export class FindInventoryByIdRoute {
  constructor(private readonly findInventoryById: FindInventoryByIdUseCase) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Detalhe do inventário' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const detail = await this.findInventoryById.execute({
      organizationId,
      id,
    });

    return InventoryPresenter.toHttpDetail(detail);
  }
}
