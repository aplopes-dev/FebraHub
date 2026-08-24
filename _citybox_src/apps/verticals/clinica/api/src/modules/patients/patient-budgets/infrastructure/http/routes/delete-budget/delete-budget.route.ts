import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeleteBudgetUseCase } from '../../../../application/use-cases/delete-budget/delete-budget.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('patient-budgets')
@Controller('v1/patients/:patientId/budgets')
@RequirePermission('delete', 'PatientBudget')
export class DeleteBudgetRoute {
  constructor(private readonly deleteBudget: DeleteBudgetUseCase) {}

  @Delete(':budgetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir orçamento do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('budgetId') budgetId: string,
  ) {
    await this.deleteBudget.execute({ storeId, patientId, budgetId });
  }
}
