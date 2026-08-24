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
import { AddProductionHistoryCommentUseCase } from '../../../../application/use-cases/add-production-history-comment/add-production-history-comment.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  Actor,
  OrganizationId,
} from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { RequestActor } from '../../../../../../shared/infra/tenancy/tenant-context';
import { AddProductionHistoryCommentHttpDto } from '../shared/production-order.dto';
import { ProductionOrderPresenter } from '../shared/production-order.presenter';
import { resolveActorName } from '../shared/resolve-actor-name';

@ApiTags('production-orders')
@Controller('v1/production-orders')
export class AddProductionHistoryCommentRoute {
  constructor(
    private readonly addProductionHistoryComment: AddProductionHistoryCommentUseCase,
  ) {}

  @Post(':id/history')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('store.stock.manage')
  @ApiOperation({ summary: 'Adicionar comentário ao histórico da ordem' })
  async handle(
    @OrganizationId() organizationId: string,
    @Actor() actor: RequestActor,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() dto: AddProductionHistoryCommentHttpDto,
  ) {
    const entry = await this.addProductionHistoryComment.execute({
      organizationId,
      orderId,
      description: dto.description,
      userName: resolveActorName(actor),
    });

    return ProductionOrderPresenter.toHttpHistoryItem(entry);
  }
}
