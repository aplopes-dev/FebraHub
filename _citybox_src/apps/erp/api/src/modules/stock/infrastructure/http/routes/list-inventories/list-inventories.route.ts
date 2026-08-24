import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListInventoriesUseCase } from '../../../../application/use-cases/list-inventories/list-inventories.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListInventoriesQueryDto } from '../shared/inventory.dto';
import { InventoryPresenter } from '../shared/inventory.presenter';

@ApiTags('inventories')
@Controller('v1/stocks')
export class ListInventoriesRoute {
  constructor(private readonly listInventories: ListInventoriesUseCase) {}

  @Get(':stockId/inventories')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar inventários do depósito' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('stockId', ParseUUIDPipe) stockId: string,
    @Query() query: ListInventoriesQueryDto,
  ) {
    const result = await this.listInventories.execute({
      organizationId,
      stockId,
      page: query.page,
      perPage: query.perPage,
    });

    return InventoryPresenter.toHttpList(result);
  }
}
