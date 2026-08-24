import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateMovementCategoryUseCase } from '../../../../application/use-cases/create-movement-category/create-movement-category.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CreateMovementCategoryHttpDto } from '../shared/movement-category.dto';
import { MovementCategoryPresenter } from '../shared/movement-category.presenter';

@ApiTags('movement-categories')
@Controller('v1/movement-categories')
export class CreateMovementCategoryRoute {
  constructor(
    private readonly createMovementCategory: CreateMovementCategoryUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('store.stock.manage')
  @ApiOperation({ summary: 'Cadastrar categoria de movimentação' })
  @ApiResponse({ status: 201, description: 'Categoria criada' })
  @ApiResponse({ status: 404, description: 'Unidade informada não existe' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: CreateMovementCategoryHttpDto,
  ) {
    const category = await this.createMovementCategory.execute({
      organizationId,
      name: dto.name,
      type: dto.type,
      branchIds: dto.branchIds,
    });

    return MovementCategoryPresenter.toHttpSingle(category);
  }
}
