import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateInventoryUseCase } from '../../../../application/use-cases/create-inventory/create-inventory.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  Actor,
  OrganizationId,
} from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { RequestActor } from '../../../../../../shared/infra/tenancy/tenant-context';
import { CreateInventoryHttpDto } from '../shared/inventory.dto';
import { InventoryPresenter } from '../shared/inventory.presenter';

@ApiTags('inventories')
@Controller('v1/stocks')
export class CreateInventoryRoute {
  constructor(private readonly createInventory: CreateInventoryUseCase) {}

  @Post(':stockId/inventories')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('store.stock.manage')
  @ApiOperation({
    summary: 'Criar inventário (já finalizado) e ajustar ledger',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Actor() actor: RequestActor,
    @Param('stockId', ParseUUIDPipe) stockId: string,
    @Body() dto: CreateInventoryHttpDto,
  ) {
    const result = await this.createInventory.execute({
      organizationId,
      stockId,
      name: dto.name,
      createdByUserId: actor.userId,
      lines: dto.lines,
    });

    return InventoryPresenter.toHttpCreated(result);
  }
}
