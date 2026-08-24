import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetPatientDriveBreadcrumbUseCase } from '../../../../application/use-cases/get-patient-drive-breadcrumb/get-patient-drive-breadcrumb.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { GetPatientDriveBreadcrumbQueryDto } from './get-patient-drive-breadcrumb.query.dto';

@ApiTags('patient-files')
@Controller('v1/patients/:patientId/drive')
@RequirePermission('read', 'PatientFile')
export class GetPatientDriveBreadcrumbRoute {
  constructor(
    private readonly getPatientDriveBreadcrumb: GetPatientDriveBreadcrumbUseCase,
  ) {}

  @Get('breadcrumb')
  @ApiOperation({ summary: 'Obter breadcrumb do drive do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Query() query: GetPatientDriveBreadcrumbQueryDto,
  ) {
    const data = await this.getPatientDriveBreadcrumb.execute({
      storeId,
      patientId,
      folderId: query.folderId ?? null,
    });

    return { data };
  }
}
