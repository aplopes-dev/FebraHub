import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateFinancialCategoryUseCase } from '../../../../application/use-cases/update-financial-category/update-financial-category.use-case';
import { RequireAnyPermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdateFinancialCategoryBodyDto } from './update-financial-category.dto';
import { toFinancialCategoryResponse } from '../shared/financial-category.presenter';

@ApiTags('financial-categories')
@Controller('v1/financial/categories')
@RequireAnyPermission({ action: 'create', subject: 'FinancialCategory' })
export class UpdateFinancialCategoryRoute {
  constructor(
    private readonly updateFinancialCategory: UpdateFinancialCategoryUseCase,
  ) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar categoria financeira' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') categoryId: string,
    @Body() body: UpdateFinancialCategoryBodyDto,
  ) {
    const category = await this.updateFinancialCategory.execute({
      storeId,
      categoryId,
      name: body.name,
      color: body.color,
    });
    return { data: toFinancialCategoryResponse(category) };
  }
}
