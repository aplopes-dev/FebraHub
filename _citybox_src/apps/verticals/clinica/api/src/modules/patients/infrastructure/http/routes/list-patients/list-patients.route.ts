import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPatientsUseCase } from '../../../../application/use-cases/list-patients/list-patients.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListPatientsQueryDto } from './list-patients.query.dto';
import { toPatientResponse } from '../shared/patient-response.mapper';

@ApiTags('patients')
@Controller('v1/patients')
@RequirePermission('access', 'Patient')
export class ListPatientsRoute {
  constructor(private readonly listPatients: ListPatientsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar pacientes' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListPatientsQueryDto,
  ) {
    const result = await this.listPatients.execute({ storeId, ...query });
    return {
      data: result.items.map(toPatientResponse),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
