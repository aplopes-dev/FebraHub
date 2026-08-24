import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RestoreSupplierUseCase } from '../../../../application/use-cases/restore-supplier/restore-supplier.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { SupplierPresenter } from '../shared/supplier.presenter';

@ApiTags('suppliers')
@Controller('v1/suppliers')
export class RestoreSupplierRoute {
  constructor(private readonly restoreSupplier: RestoreSupplierUseCase) {}

  @Post(':id/restore')
  @RequirePermission('org.suppliers.manage')
  @ApiOperation({ summary: 'Restaurar fornecedor excluído' })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const supplier = await this.restoreSupplier.execute({ organizationId, id });
    return SupplierPresenter.toHttpSingle(supplier);
  }
}
