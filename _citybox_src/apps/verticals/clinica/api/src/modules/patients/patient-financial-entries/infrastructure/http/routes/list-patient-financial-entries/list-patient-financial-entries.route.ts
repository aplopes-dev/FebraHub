import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPatientFinancialEntriesUseCase } from '../../../../application/use-cases/list-patient-financial-entries/list-patient-financial-entries.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListPatientFinancialEntriesQueryDto } from './list-patient-financial-entries.query.dto';
import { toPatientFinancialEntrySummaryResponse } from '../shared/patient-financial-entry-response.mapper';

@ApiTags('patient-financial-entries')
@Controller('v1/patients/:patientId/financial-entries')
@RequirePermission('manage', 'Patient')
export class ListPatientFinancialEntriesRoute {
  constructor(
    private readonly listPatientFinancialEntries: ListPatientFinancialEntriesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar lançamentos financeiros do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Query() query: ListPatientFinancialEntriesQueryDto,
  ) {
    const result = await this.listPatientFinancialEntries.execute({
      storeId,
      patientId,
      page: query.page,
      perPage: query.perPage,
      search: query.search,
      status: query.status,
      periodFrom: query.periodFrom,
      periodTo: query.periodTo,
      budgetItemId: query.budgetItemId,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      data: result.items.map(toPatientFinancialEntrySummaryResponse),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
        totals: result.totals,
      },
    };
  }
}
