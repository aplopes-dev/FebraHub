import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePatientToothAnnotationUseCase } from '../../../../application/use-cases/create-tooth-annotation/create-tooth-annotation.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreatePatientToothAnnotationBodyDto } from '../shared/patient-tooth-annotation.http-dto';
import { toPatientToothAnnotationResponse } from '../shared/patient-tooth-annotation-response.mapper';

@ApiTags('patient-tooth-annotations')
@Controller('v1/patients/:patientId/tooth-annotations')
@RequirePermission('manage', 'Patient')
export class CreatePatientToothAnnotationRoute {
  constructor(
    private readonly createToothAnnotation: CreatePatientToothAnnotationUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar anotação clínica em um dente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Body() body: CreatePatientToothAnnotationBodyDto,
  ) {
    const annotation = await this.createToothAnnotation.execute({
      storeId,
      patientId,
      input: body,
    });
    return { data: toPatientToothAnnotationResponse(annotation) };
  }
}
