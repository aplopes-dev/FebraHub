import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdatePatientPrescriptionUseCase } from '../../../../application/use-cases/update-patient-prescription/update-patient-prescription.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpsertPatientPrescriptionBodyDto } from '../shared/patient-prescription-body.dto';
import { toPatientPrescriptionDetailResponse } from '../shared/patient-prescription-response.mapper';

@ApiTags('patient-prescriptions')
@Controller('v1/patients/:patientId/prescriptions')
@RequirePermission('create', 'PatientPrescription')
export class UpdatePatientPrescriptionRoute {
  constructor(
    private readonly updatePatientPrescription: UpdatePatientPrescriptionUseCase,
  ) {}

  @Put(':prescriptionId')
  @ApiOperation({ summary: 'Atualizar receituário do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('prescriptionId') prescriptionId: string,
    @Body() body: UpsertPatientPrescriptionBodyDto,
  ) {
    const prescription = await this.updatePatientPrescription.execute({
      storeId,
      patientId,
      prescriptionId,
      input: body,
    });
    return { data: toPatientPrescriptionDetailResponse(prescription) };
  }
}
