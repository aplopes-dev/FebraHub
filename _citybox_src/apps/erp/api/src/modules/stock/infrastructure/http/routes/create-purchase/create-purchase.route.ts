import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePurchaseUseCase } from '../../../../application/use-cases/create-purchase/create-purchase.use-case';
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
export class CreatePurchaseRoute {
  constructor(private readonly createPurchase: CreatePurchaseUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('store.stock.manage')
  @ApiOperation({
    summary: 'Registrar compra',
    description:
      'Se a entrega já vier recebida (`deliveryStatus=received`) com linhas recebidas, gera automaticamente 1 movimento de entrada no estoque.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Actor() actor: RequestActor,
    @Body() dto: PurchaseWritableHttpDto,
  ) {
    const purchase = await this.createPurchase.execute({
      organizationId,
      createdByUserId: actor.userId,
      ...toPurchaseWritableInput(dto),
    });

    return PurchasePresenter.toHttpSingle(purchase);
  }
}
