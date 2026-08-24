import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateFinancialCategoryUseCase } from '../../../../application/use-cases/create-financial-category/create-financial-category.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreateFinancialCategoryBodyDto } from './create-financial-category.dto';
import { toFinancialCategoryResponse } from '../shared/financial-category.presenter';

@ApiTags('financial-categories')
@Controller('v1/financial/categories')
@RequirePermission('access', 'Financial')
export class CreateFinancialCategoryRoute {
  constructor(
    private readonly createFinancialCategory: CreateFinancialCategoryUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar categoria financeira' })
  async handle(
    @StoreId() storeId: string,
    @Body() body: CreateFinancialCategoryBodyDto,
  ) {
    const category = await this.createFinancialCategory.execute({
      storeId,
      kind: body.kind,
      name: body.name,
      color: body.color,
    });
    return { data: toFinancialCategoryResponse(category) };
  }
}
