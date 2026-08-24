import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdatePurchaseUseCase } from '../../../../application/use-cases/update-purchase/update-purchase.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  Actor,
  OrganizationId,
} from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { RequestActor } from '../../../../../../shared/infra/tenancy/tenant-context';
import {
  PurchaseWritableHttpDto,
  toPurchaseWritableInput,
} from '../shared/purchase.dto';
import { PurchasePresenter } from '../shared/purchase.presenter';

@ApiTags('purchases')
@Controller('v1/purchases')
export class UpdatePurchaseRoute {
  constructor(private readonly updatePurchase: UpdatePurchaseUseCase) {}

  @Put(':id')
  @RequirePermission('store.stock.manage')
  @ApiOperation({
    summary: 'Atualizar compra',
    description:
      'Semântica de PUT: substitui todas as linhas. Se ainda não houver movimento de entrada e a compra passar a `received` com linhas recebidas, gera o movimento — nunca uma segunda vez.',
  })
  @ApiResponse({
    status: 404,
    description: 'Compra, estoque ou fornecedor não encontrado',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Actor() actor: RequestActor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PurchaseWritableHttpDto,
  ) {
    const purchase = await this.updatePurchase.execute({
      organizationId,
      id,
      createdByUserId: actor.userId,
      ...toPurchaseWritableInput(dto),
    });

    return PurchasePresenter.toHttpSingle(purchase);
  }
}
