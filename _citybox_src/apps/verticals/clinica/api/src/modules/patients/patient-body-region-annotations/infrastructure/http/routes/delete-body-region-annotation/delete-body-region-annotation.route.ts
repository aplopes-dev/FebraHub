import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeletePatientBodyRegionAnnotationUseCase } from '../../../../application/use-cases/delete-body-region-annotation/delete-body-region-annotation.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('patient-body-region-annotations')
@Controller('v1/patients/:patientId/body-region-annotations')
@RequirePermission('manage', 'Patient')
export class DeletePatientBodyRegionAnnotationRoute {
  constructor(
    private readonly deleteBodyRegionAnnotation: DeletePatientBodyRegionAnnotationUseCase,
  ) {}

  @Delete(':annotationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir anotação clínica de uma região corporal' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('annotationId') annotationId: string,
  ) {
    await this.deleteBodyRegionAnnotation.execute({
      storeId,
      patientId,
      annotationId,
    });
  }
}
