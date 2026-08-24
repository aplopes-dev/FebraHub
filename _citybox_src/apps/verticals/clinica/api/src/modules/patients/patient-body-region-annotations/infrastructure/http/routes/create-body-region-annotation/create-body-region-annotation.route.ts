import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePatientBodyRegionAnnotationUseCase } from '../../../../application/use-cases/create-body-region-annotation/create-body-region-annotation.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreatePatientBodyRegionAnnotationBodyDto } from '../shared/patient-body-region-annotation.http-dto';
import { toPatientBodyRegionAnnotationResponse } from '../shared/patient-body-region-annotation-response.mapper';

@ApiTags('patient-body-region-annotations')
@Controller('v1/patients/:patientId/body-region-annotations')
@RequirePermission('manage', 'Patient')
export class CreatePatientBodyRegionAnnotationRoute {
  constructor(
    private readonly createBodyRegionAnnotation: CreatePatientBodyRegionAnnotationUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar anotação clínica em uma região corporal' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Body() body: CreatePatientBodyRegionAnnotationBodyDto,
  ) {
    const annotation = await this.createBodyRegionAnnotation.execute({
      storeId,
      patientId,
      input: body,
    });
    return { data: toPatientBodyRegionAnnotationResponse(annotation) };
  }
}
