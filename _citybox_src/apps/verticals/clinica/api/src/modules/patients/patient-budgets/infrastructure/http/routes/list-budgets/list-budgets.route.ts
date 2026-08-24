import { Controller, Get, Param, Query } from '@nestjs/common';

import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ListBudgetsUseCase } from '../../../../application/use-cases/list-budgets/list-budgets.use-case';

import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';

import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';

import { toBudgetSummaryResponse } from '../shared/budget-response.mapper';

import { ListBudgetsQueryDto } from './list-budgets.query.dto';

@ApiTags('patient-budgets')
@Controller('v1/patients/:patientId/budgets')
@RequirePermission('read', 'PatientBudget')
export class ListBudgetsRoute {
  constructor(private readonly listBudgets: ListBudgetsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar orçamentos do paciente' })
  async handle(
    @StoreId() storeId: string,

    @Param('patientId') patientId: string,

    @Query() query: ListBudgetsQueryDto,
  ) {
    const result = await this.listBudgets.execute({
      storeId,
      patientId,
      ...query,
    });

    return {
      data: result.items.map(toBudgetSummaryResponse),

      meta: {
        total: result.total,

        page: result.page,

        perPage: result.perPage,

        totalPages: result.totalPages,
      },
    };
  }
}
