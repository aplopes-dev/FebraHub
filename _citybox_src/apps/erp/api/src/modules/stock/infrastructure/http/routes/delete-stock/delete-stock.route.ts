import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteStockUseCase } from '../../../../application/use-cases/delete-stock/delete-stock.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('stocks')
@Controller('v1/stocks')
export class DeleteStockRoute {
  constructor(private readonly deleteStock: DeleteStockUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('store.stock.manage')
  @ApiOperation({ summary: 'Excluir depósito' })
  @ApiResponse({ status: 204, description: 'Excluído' })
  @ApiResponse({ status: 409, description: 'Estoque padrão não removível' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteStock.execute({ organizationId, id });
  }
}
