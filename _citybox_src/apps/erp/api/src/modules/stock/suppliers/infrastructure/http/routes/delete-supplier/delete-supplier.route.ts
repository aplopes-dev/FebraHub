import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteSupplierUseCase } from '../../../../application/use-cases/delete-supplier/delete-supplier.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('suppliers')
@Controller('v1/suppliers')
export class DeleteSupplierRoute {
  constructor(private readonly deleteSupplier: DeleteSupplierUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('org.suppliers.manage')
  @ApiOperation({
    summary: 'Excluir fornecedor',
    description:
      'Soft-delete: o fornecedor sai da aba de ativos, mas as compras já registradas continuam apontando para ele.',
  })
  @ApiResponse({ status: 204, description: 'Fornecedor excluído' })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteSupplier.execute({ organizationId, id });
  }
}
