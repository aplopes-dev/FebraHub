import { Controller, Delete, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeleteFinancialCategoryUseCase } from '../../../../application/use-cases/delete-financial-category/delete-financial-category.use-case';
import { RequireAnyPermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('financial-categories')
@Controller('v1/financial/categories')
@RequireAnyPermission({ action: 'delete', subject: 'FinancialCategory' })
export class DeleteFinancialCategoryRoute {
  constructor(
    private readonly deleteFinancialCategory: DeleteFinancialCategoryUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir categoria financeira' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') categoryId: string,
  ): Promise<void> {
    await this.deleteFinancialCategory.execute({ storeId, categoryId });
  }
}
