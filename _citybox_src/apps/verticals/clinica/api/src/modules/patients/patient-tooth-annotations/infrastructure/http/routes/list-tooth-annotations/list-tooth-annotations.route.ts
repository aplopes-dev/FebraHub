import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPatientToothAnnotationsUseCase } from '../../../../application/use-cases/list-tooth-annotations/list-tooth-annotations.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListPatientToothAnnotationsQueryDto } from '../shared/patient-tooth-annotation.http-dto';
import { toPatientToothAnnotationResponse } from '../shared/patient-tooth-annotation-response.mapper';

@ApiTags('patient-tooth-annotations')
@Controller('v1/patients/:patientId/tooth-annotations')
@RequirePermission('manage', 'Patient')
export class ListPatientToothAnnotationsRoute {
  constructor(
    private readonly listToothAnnotations: ListPatientToothAnnotationsUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar anotações clínicas dos dentes do paciente',
  })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Query() query: ListPatientToothAnnotationsQueryDto,
  ) {
    const items = await this.listToothAnnotations.execute({
      storeId,
      patientId,
      toothNumber: query.toothNumber,
    });

    return {
      data: items.map(toPatientToothAnnotationResponse),
    };
  }
}
