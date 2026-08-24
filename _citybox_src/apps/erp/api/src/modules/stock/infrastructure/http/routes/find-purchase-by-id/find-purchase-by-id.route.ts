import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindPurchaseByIdUseCase } from '../../../../application/use-cases/find-purchase-by-id/find-purchase-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PurchasePresenter } from '../shared/purchase.presenter';

@ApiTags('purchases')
@Controller('v1/purchases')
export class FindPurchaseByIdRoute {
  constructor(private readonly findPurchaseById: FindPurchaseByIdUseCase) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Detalhar compra',
    description:
      'Devolve a compra, inclusive excluída — a aba "Excluídas" da listagem leva até ela.',
  })
  @ApiResponse({ status: 404, description: 'Compra não encontrada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const detail = await this.findPurchaseById.execute({
      organizationId,
      id,
    });

    return PurchasePresenter.toHttpDetail(detail);
  }
}
