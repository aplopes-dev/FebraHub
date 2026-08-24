import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListSuppliersUseCase } from '../../../../application/use-cases/list-suppliers/list-suppliers.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListSuppliersQueryDto } from '../shared/supplier.dto';
import { SupplierPresenter } from '../shared/supplier.presenter';

@ApiTags('suppliers')
@Controller('v1/suppliers')
export class ListSuppliersRoute {
  constructor(private readonly listSuppliers: ListSuppliersUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Listar fornecedores',
    description:
      'Fornecedores da organização ativa. `tabCounts` conta o cadastro inteiro, ignorando a busca.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListSuppliersQueryDto,
  ) {
    const result = await this.listSuppliers.execute({
      organizationId,
      search: query.search?.trim() || undefined,
      tab: query.tab,
      page: query.page,
      perPage: query.perPage,
    });

    return SupplierPresenter.toHttpList(result);
  }
}
