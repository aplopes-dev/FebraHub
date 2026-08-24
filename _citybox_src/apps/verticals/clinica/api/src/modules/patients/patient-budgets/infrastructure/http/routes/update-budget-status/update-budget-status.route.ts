import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateBudgetStatusUseCase } from '../../../../application/use-cases/update-budget-status/update-budget-status.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdateBudgetStatusBodyDto } from '../shared/budget-body.dto';
import { toBudgetResponse } from '../shared/budget-response.mapper';

@ApiTags('patient-budgets')
@Controller('v1/patients/:patientId/budgets')
@RequirePermission('approve', 'PatientBudget')
export class UpdateBudgetStatusRoute {
  constructor(private readonly updateBudgetStatus: UpdateBudgetStatusUseCase) {}

  @Patch(':budgetId/status')
  @ApiOperation({
    summary:
      'Atualizar status do orçamento (approved/rejected/expired/pending)',
  })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('budgetId') budgetId: string,
    @Body() body: UpdateBudgetStatusBodyDto,
  ) {
    const detail = await this.updateBudgetStatus.execute({
      storeId,
      patientId,
      budgetId,
      status: body.status,
      rejectedAt: body.rejectedAt,
      rejectionReason: body.rejectionReason,
      dueDate: body.dueDate,
      installments: body.installments?.map((row) => ({
        dueDate: row.dueDate,
        valueCents: row.valueCents,
      })),
    });
    return { data: toBudgetResponse(detail) };
  }
}
