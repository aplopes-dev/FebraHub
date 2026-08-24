import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPatientPrescriptionsUseCase } from '../../../../application/use-cases/list-patient-prescriptions/list-patient-prescriptions.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientPrescriptionSummaryResponse } from '../shared/patient-prescription-response.mapper';
import { ListPatientPrescriptionsQueryDto } from './list-patient-prescriptions.query.dto';

@ApiTags('patient-prescriptions')
@Controller('v1/patients/:patientId/prescriptions')
@RequirePermission('create', 'PatientPrescription')
export class ListPatientPrescriptionsRoute {
  constructor(
    private readonly listPatientPrescriptions: ListPatientPrescriptionsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar receituários do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Query() query: ListPatientPrescriptionsQueryDto,
  ) {
    const result = await this.listPatientPrescriptions.execute({
      storeId,
      patientId,
      ...query,
    });

    return {
      data: result.items.map(toPatientPrescriptionSummaryResponse),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
