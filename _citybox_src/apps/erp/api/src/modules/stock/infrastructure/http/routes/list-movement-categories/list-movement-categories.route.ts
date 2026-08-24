import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListMovementCategoriesUseCase } from '../../../../application/use-cases/list-movement-categories/list-movement-categories.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListMovementCategoriesQueryDto } from '../shared/movement-category.dto';
import { MovementCategoryPresenter } from '../shared/movement-category.presenter';

@ApiTags('movement-categories')
@Controller('v1/movement-categories')
export class ListMovementCategoriesRoute {
  constructor(
    private readonly listMovementCategories: ListMovementCategoriesUseCase,
  ) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Listar categorias de movimentação',
    description:
      'Busca por nome/código; filtro opcional por type; paginação server-side; ordem por código.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListMovementCategoriesQueryDto,
  ) {
    const result = await this.listMovementCategories.execute({
      organizationId,
      search: query.search?.trim() || undefined,
      type: query.type,
      page: query.page,
      perPage: query.perPage,
    });

    return MovementCategoryPresenter.toHttpList(result);
  }
}
