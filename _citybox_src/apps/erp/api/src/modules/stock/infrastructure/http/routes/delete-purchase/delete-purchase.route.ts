import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeletePurchaseUseCase } from '../../../../application/use-cases/delete-purchase/delete-purchase.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('purchases')
@Controller('v1/purchases')
export class DeletePurchaseRoute {
  constructor(private readonly deletePurchase: DeletePurchaseUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('store.stock.manage')
  @ApiOperation({
    summary: 'Excluir compra',
    description:
      'Soft-delete: sai da aba de ativas. Não estorna o movimento de entrada já gerado. Restauração via POST :id/restore.',
  })
  @ApiResponse({ status: 204, description: 'Compra excluída' })
  @ApiResponse({ status: 404, description: 'Compra não encontrada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deletePurchase.execute({ organizationId, id });
  }
}
