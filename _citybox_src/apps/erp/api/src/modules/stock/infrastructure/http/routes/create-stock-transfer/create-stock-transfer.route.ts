import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateStockTransferUseCase } from '../../../../application/use-cases/create-stock-transfer/create-stock-transfer.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  Actor,
  OrganizationId,
} from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { RequestActor } from '../../../../../../shared/infra/tenancy/tenant-context';
import { CreateStockTransferHttpDto } from '../shared/stock-transfer.dto';
import { StockTransferPresenter } from '../shared/stock-transfer.presenter';

@ApiTags('stock-transfers')
@Controller('v1/stock-transfers')
export class CreateStockTransferRoute {
  constructor(
    private readonly createStockTransfer: CreateStockTransferUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('store.stock.manage')
  @ApiOperation({ summary: 'Criar transferência entre depósitos' })
  async handle(
    @OrganizationId() organizationId: string,
    @Actor() actor: RequestActor,
    @Body() dto: CreateStockTransferHttpDto,
  ) {
    const transfer = await this.createStockTransfer.execute({
      organizationId,
      fromStockId: dto.fromStockId,
      toStockId: dto.toStockId,
      operatedAt: new Date(dto.operatedAt),
      carrierId: dto.carrierId,
      responsibleName: dto.responsibleName,
      notes: dto.notes,
      createdByUserId: actor.userId,
      lines: dto.lines,
    });

    return StockTransferPresenter.toHttpCreated(transfer);
  }
}
