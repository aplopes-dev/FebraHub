import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPatientBodyRegionAnnotationsUseCase } from '../../../../application/use-cases/list-body-region-annotations/list-body-region-annotations.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListPatientBodyRegionAnnotationsQueryDto } from '../shared/patient-body-region-annotation.http-dto';
import { toPatientBodyRegionAnnotationResponse } from '../shared/patient-body-region-annotation-response.mapper';

@ApiTags('patient-body-region-annotations')
@Controller('v1/patients/:patientId/body-region-annotations')
@RequirePermission('manage', 'Patient')
export class ListPatientBodyRegionAnnotationsRoute {
  constructor(
    private readonly listBodyRegionAnnotations: ListPatientBodyRegionAnnotationsUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar anotações clínicas das regiões corporais do paciente',
  })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Query() query: ListPatientBodyRegionAnnotationsQueryDto,
  ) {
    const items = await this.listBodyRegionAnnotations.execute({
      storeId,
      patientId,
      bodyRegionId: query.bodyRegionId,
    });

    return {
      data: items.map(toPatientBodyRegionAnnotationResponse),
    };
  }
}
