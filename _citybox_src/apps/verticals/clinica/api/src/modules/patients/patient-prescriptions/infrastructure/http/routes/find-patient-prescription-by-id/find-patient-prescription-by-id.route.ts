import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindPatientPrescriptionByIdUseCase } from '../../../../application/use-cases/find-patient-prescription-by-id/find-patient-prescription-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientPrescriptionDetailResponse } from '../shared/patient-prescription-response.mapper';

@ApiTags('patient-prescriptions')
@Controller('v1/patients/:patientId/prescriptions')
@RequirePermission('create', 'PatientPrescription')
export class FindPatientPrescriptionByIdRoute {
  constructor(
    private readonly findPatientPrescriptionById: FindPatientPrescriptionByIdUseCase,
  ) {}

  @Get(':prescriptionId')
  @ApiOperation({ summary: 'Detalhar receituário do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('prescriptionId') prescriptionId: string,
  ) {
    const prescription = await this.findPatientPrescriptionById.execute({
      storeId,
      patientId,
      prescriptionId,
    });
    return { data: toPatientPrescriptionDetailResponse(prescription) };
  }
}
