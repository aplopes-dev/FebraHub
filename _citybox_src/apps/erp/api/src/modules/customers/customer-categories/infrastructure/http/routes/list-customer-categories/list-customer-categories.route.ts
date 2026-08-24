import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListCustomerCategoriesUseCase } from '../../../../application/use-cases/list-customer-categories/list-customer-categories.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListCustomerCategoriesQueryDto } from '../shared/customer-category.dto';
import { CustomerCategoryPresenter } from '../shared/customer-category.presenter';

@ApiTags('customer-categories')
@Controller('v1/customer-categories')
export class ListCustomerCategoriesRoute {
  constructor(private readonly listCategories: ListCustomerCategoriesUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Listar categorias de cliente',
    description:
      '`customerCount` conta clientes ativos (não excluídos) vinculados.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListCustomerCategoriesQueryDto,
  ) {
    const result = await this.listCategories.execute({
      organizationId,
      search: query.search?.trim() || undefined,
      page: query.page,
      perPage: query.perPage,
    });
    return CustomerCategoryPresenter.toHttpList(result);
  }
}
