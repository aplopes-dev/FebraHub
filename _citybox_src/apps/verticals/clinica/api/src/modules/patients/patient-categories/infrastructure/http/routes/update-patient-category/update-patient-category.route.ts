import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdatePatientCategoryUseCase } from '../../../../application/use-cases/update-patient-category/update-patient-category.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdatePatientCategoryDto } from '../shared/patient-category.dto';
import { toPatientCategoryResponse } from '../shared/patient-category-response.mapper';

@ApiTags('patient-categories')
@Controller('v1/patient-categories')
@RequirePermission('update', 'Category')
export class UpdatePatientCategoryRoute {
  constructor(private readonly updateCategory: UpdatePatientCategoryUseCase) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar categoria de paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePatientCategoryDto,
  ) {
    const category = await this.updateCategory.execute({ storeId, id, ...dto });
    return { data: toPatientCategoryResponse(category) };
  }
}
