import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindSupplierByIdUseCase } from '../../../../application/use-cases/find-supplier-by-id/find-supplier-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { SupplierPresenter } from '../shared/supplier.presenter';

@ApiTags('suppliers')
@Controller('v1/suppliers')
export class FindSupplierByIdRoute {
  constructor(private readonly findSupplierById: FindSupplierByIdUseCase) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Detalhar fornecedor',
    description:
      'Devolve o fornecedor, inclusive excluído — a aba "Excluídos" da listagem leva até ele.',
  })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const supplier = await this.findSupplierById.execute({
      organizationId,
      id,
    });

    return SupplierPresenter.toHttpSingle(supplier);
  }
}
