import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeletePatientPrescriptionUseCase } from '../../../../application/use-cases/delete-patient-prescription/delete-patient-prescription.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('patient-prescriptions')
@Controller('v1/patients/:patientId/prescriptions')
@RequirePermission('create', 'PatientPrescription')
export class DeletePatientPrescriptionRoute {
  constructor(
    private readonly deletePatientPrescription: DeletePatientPrescriptionUseCase,
  ) {}

  @Delete(':prescriptionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir receituário do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('prescriptionId') prescriptionId: string,
  ) {
    await this.deletePatientPrescription.execute({
      storeId,
      patientId,
      prescriptionId,
    });
  }
}
