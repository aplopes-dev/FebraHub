import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePatientPrescriptionUseCase } from '../../../../application/use-cases/create-patient-prescription/create-patient-prescription.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpsertPatientPrescriptionBodyDto } from '../shared/patient-prescription-body.dto';
import { toPatientPrescriptionDetailResponse } from '../shared/patient-prescription-response.mapper';

@ApiTags('patient-prescriptions')
@Controller('v1/patients/:patientId/prescriptions')
@RequirePermission('create', 'PatientPrescription')
export class CreatePatientPrescriptionRoute {
  constructor(
    private readonly createPatientPrescription: CreatePatientPrescriptionUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar receituário do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Body() body: UpsertPatientPrescriptionBodyDto,
  ) {
    const prescription = await this.createPatientPrescription.execute({
      storeId,
      patientId,
      input: body,
    });
    return { data: toPatientPrescriptionDetailResponse(prescription) };
  }
}
