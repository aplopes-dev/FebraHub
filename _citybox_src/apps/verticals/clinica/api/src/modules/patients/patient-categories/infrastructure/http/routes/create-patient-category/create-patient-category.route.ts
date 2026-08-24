import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePatientCategoryUseCase } from '../../../../application/use-cases/create-patient-category/create-patient-category.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreatePatientCategoryDto } from '../shared/patient-category.dto';
import { toPatientCategoryResponse } from '../shared/patient-category-response.mapper';

@ApiTags('patient-categories')
@Controller('v1/patient-categories')
@RequirePermission('create', 'Category')
export class CreatePatientCategoryRoute {
  constructor(private readonly createCategory: CreatePatientCategoryUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar categoria de paciente' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: CreatePatientCategoryDto,
  ) {
    const category = await this.createCategory.execute({ storeId, ...dto });
    return { data: toPatientCategoryResponse(category) };
  }
}
