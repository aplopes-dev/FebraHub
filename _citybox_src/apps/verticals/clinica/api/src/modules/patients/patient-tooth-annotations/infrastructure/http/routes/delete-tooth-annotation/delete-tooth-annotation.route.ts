import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeletePatientToothAnnotationUseCase } from '../../../../application/use-cases/delete-tooth-annotation/delete-tooth-annotation.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('patient-tooth-annotations')
@Controller('v1/patients/:patientId/tooth-annotations')
@RequirePermission('manage', 'Patient')
export class DeletePatientToothAnnotationRoute {
  constructor(
    private readonly deleteToothAnnotation: DeletePatientToothAnnotationUseCase,
  ) {}

  @Delete(':annotationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir anotação clínica de um dente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('annotationId') annotationId: string,
  ) {
    await this.deleteToothAnnotation.execute({
      storeId,
      patientId,
      annotationId,
    });
  }
}
