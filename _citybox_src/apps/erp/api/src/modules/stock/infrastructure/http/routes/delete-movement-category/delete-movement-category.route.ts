import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteMovementCategoryUseCase } from '../../../../application/use-cases/delete-movement-category/delete-movement-category.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('movement-categories')
@Controller('v1/movement-categories')
export class DeleteMovementCategoryRoute {
  constructor(
    private readonly deleteMovementCategory: DeleteMovementCategoryUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('store.stock.manage')
  @ApiOperation({ summary: 'Excluir categoria de movimentação' })
  @ApiResponse({ status: 204, description: 'Excluída' })
  @ApiResponse({
    status: 409,
    description: 'Categoria de sistema não removível',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteMovementCategory.execute({ organizationId, id });
  }
}
