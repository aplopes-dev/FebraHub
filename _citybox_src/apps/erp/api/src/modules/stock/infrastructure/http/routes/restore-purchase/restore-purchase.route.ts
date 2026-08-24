import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RestorePurchaseUseCase } from '../../../../application/use-cases/restore-purchase/restore-purchase.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PurchasePresenter } from '../shared/purchase.presenter';

@ApiTags('purchases')
@Controller('v1/purchases')
export class RestorePurchaseRoute {
  constructor(private readonly restorePurchase: RestorePurchaseUseCase) {}

  @Post(':id/restore')
  @RequirePermission('store.stock.manage')
  @ApiOperation({
    summary: 'Restaurar compra excluída',
    description:
      'Limpa deletedAt e devolve a compra à aba Ativas. Não cria nem estorna movimento de estoque.',
  })
  @ApiResponse({ status: 404, description: 'Compra não encontrada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const purchase = await this.restorePurchase.execute({
      organizationId,
      id,
    });
    return PurchasePresenter.toHttpSingle(purchase);
  }
}
