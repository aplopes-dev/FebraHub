import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateBudgetUseCase } from '../../../../application/use-cases/create-budget/create-budget.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpsertBudgetBodyDto } from '../shared/budget-body.dto';
import {
  toBudgetResponse,
  toBudgetUpsertPayload,
} from '../shared/budget-response.mapper';

@ApiTags('patient-budgets')
@Controller('v1/patients/:patientId/budgets')
@RequirePermission('create', 'PatientBudget')
export class CreateBudgetRoute {
  constructor(private readonly createBudget: CreateBudgetUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar orçamento do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Body() body: UpsertBudgetBodyDto,
  ) {
    const detail = await this.createBudget.execute({
      storeId,
      patientId,
      input: toBudgetUpsertPayload(body),
    });
    return { data: toBudgetResponse(detail) };
  }
}
