import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateBudgetUseCase } from '../../../../application/use-cases/update-budget/update-budget.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpsertBudgetBodyDto } from '../shared/budget-body.dto';
import {
  toBudgetResponse,
  toBudgetUpsertPayload,
} from '../shared/budget-response.mapper';

@ApiTags('patient-budgets')
@Controller('v1/patients/:patientId/budgets')
@RequirePermission('update', 'PatientBudget')
export class UpdateBudgetRoute {
  constructor(private readonly updateBudget: UpdateBudgetUseCase) {}

  @Put(':budgetId')
  @ApiOperation({ summary: 'Atualizar orçamento do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('budgetId') budgetId: string,
    @Body() body: UpsertBudgetBodyDto,
  ) {
    const detail = await this.updateBudget.execute({
      storeId,
      patientId,
      budgetId,
      input: toBudgetUpsertPayload(body),
    });
    return { data: toBudgetResponse(detail) };
  }
}
