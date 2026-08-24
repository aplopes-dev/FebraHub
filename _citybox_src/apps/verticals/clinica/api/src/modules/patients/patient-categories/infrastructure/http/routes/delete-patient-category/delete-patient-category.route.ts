import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeletePatientCategoryUseCase } from '../../../../application/use-cases/delete-patient-category/delete-patient-category.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('patient-categories')
@Controller('v1/patient-categories')
@RequirePermission('update', 'Category')
export class DeletePatientCategoryRoute {
  constructor(private readonly deleteCategory: DeletePatientCategoryUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir categoria de paciente' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    await this.deleteCategory.execute({ storeId, id });
  }
}
