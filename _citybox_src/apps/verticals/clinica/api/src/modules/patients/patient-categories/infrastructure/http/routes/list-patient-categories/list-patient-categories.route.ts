import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPatientCategoriesUseCase } from '../../../../application/use-cases/list-patient-categories/list-patient-categories.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientCategoryResponse } from '../shared/patient-category-response.mapper';

@ApiTags('patient-categories')
@Controller('v1/patient-categories')
@RequirePermission('read', 'Category')
export class ListPatientCategoriesRoute {
  constructor(private readonly listCategories: ListPatientCategoriesUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorias de paciente' })
  async handle(@StoreId() storeId: string) {
    const categories = await this.listCategories.execute({ storeId });
    return { data: categories.map(toPatientCategoryResponse) };
  }
}
