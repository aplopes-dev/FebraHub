import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindBudgetByIdUseCase } from '../../../../application/use-cases/find-budget-by-id/find-budget-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toBudgetResponse } from '../shared/budget-response.mapper';

@ApiTags('patient-budgets')
@Controller('v1/patients/:patientId/budgets')
@RequirePermission('read', 'PatientBudget')
export class FindBudgetByIdRoute {
  constructor(private readonly findBudget: FindBudgetByIdUseCase) {}

  @Get(':budgetId')
  @ApiOperation({ summary: 'Obter orçamento do paciente por id' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('budgetId') budgetId: string,
  ) {
    const detail = await this.findBudget.execute({
      storeId,
      patientId,
      budgetId,
    });
    return { data: toBudgetResponse(detail) };
  }
}
