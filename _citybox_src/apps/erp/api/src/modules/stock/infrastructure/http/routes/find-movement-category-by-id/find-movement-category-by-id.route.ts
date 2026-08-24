import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindMovementCategoryByIdUseCase } from '../../../../application/use-cases/find-movement-category-by-id/find-movement-category-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { MovementCategoryPresenter } from '../shared/movement-category.presenter';

@ApiTags('movement-categories')
@Controller('v1/movement-categories')
export class FindMovementCategoryByIdRoute {
  constructor(
    private readonly findMovementCategoryById: FindMovementCategoryByIdUseCase,
  ) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Detalhe da categoria de movimentação' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const category = await this.findMovementCategoryById.execute({
      organizationId,
      id,
    });
    return MovementCategoryPresenter.toHttpSingle(category);
  }
}
