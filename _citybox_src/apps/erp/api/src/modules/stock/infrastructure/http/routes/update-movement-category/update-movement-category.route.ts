import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateMovementCategoryUseCase } from '../../../../application/use-cases/update-movement-category/update-movement-category.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { UpdateMovementCategoryHttpDto } from '../shared/movement-category.dto';
import { MovementCategoryPresenter } from '../shared/movement-category.presenter';

@ApiTags('movement-categories')
@Controller('v1/movement-categories')
export class UpdateMovementCategoryRoute {
  constructor(
    private readonly updateMovementCategory: UpdateMovementCategoryUseCase,
  ) {}

  @Patch(':id')
  @RequirePermission('store.stock.manage')
  @ApiOperation({ summary: 'Atualizar categoria de movimentação' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMovementCategoryHttpDto,
  ) {
    const category = await this.updateMovementCategory.execute({
      organizationId,
      id,
      name: dto.name,
      type: dto.type,
      branchIds: dto.branchIds,
    });

    return MovementCategoryPresenter.toHttpSingle(category);
  }
}
