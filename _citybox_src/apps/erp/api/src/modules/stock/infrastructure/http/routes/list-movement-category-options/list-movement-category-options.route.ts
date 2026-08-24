import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListMovementCategoryOptionsUseCase } from '../../../../application/use-cases/list-movement-category-options/list-movement-category-options.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListMovementCategoryOptionsQueryDto } from '../shared/movement-category.dto';
import { MovementCategoryPresenter } from '../shared/movement-category.presenter';

@ApiTags('movement-categories')
@Controller('v1/movement-categories')
export class ListMovementCategoryOptionsRoute {
  constructor(
    private readonly listOptions: ListMovementCategoryOptionsUseCase,
  ) {}

  @Get('options')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Options de categorias (selects)',
    description: 'Lista enxuta { id, name, type }, filtrável por type.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListMovementCategoryOptionsQueryDto,
  ) {
    const options = await this.listOptions.execute({
      organizationId,
      type: query.type,
    });

    return MovementCategoryPresenter.toHttpOptions(options);
  }
}
