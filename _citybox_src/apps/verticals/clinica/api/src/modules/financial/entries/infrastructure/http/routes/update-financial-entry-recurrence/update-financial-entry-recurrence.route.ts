import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateFinancialEntryRecurrenceUseCase } from '../../../../application/use-cases/update-financial-entry-recurrence/update-financial-entry-recurrence.use-case';
import { RequireAnyPermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdateFinancialEntryRecurrenceBodyDto } from '../shared/financial-entry-body.dto';
import { toFinancialEntryResponseFromEntity } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequireAnyPermission(
  { action: 'update', subject: 'FinancialIncome' },
  { action: 'update', subject: 'FinancialExpense' },
)
export class UpdateFinancialEntryRecurrenceRoute {
  constructor(
    private readonly updateFinancialEntryRecurrence: UpdateFinancialEntryRecurrenceUseCase,
  ) {}

  @Patch('recurrence/:groupId')
  @ApiOperation({ summary: 'Atualizar grupo de recorrência' })
  async handle(
    @StoreId() storeId: string,
    @Param('groupId') groupId: string,
    @Body() body: UpdateFinancialEntryRecurrenceBodyDto,
  ) {
    const result = await this.updateFinancialEntryRecurrence.execute({
      storeId,
      groupId,
      scope: body.scope,
      entryId: body.entryId,
      description: body.description,
      valueCents: body.valueCents,
    });
    return {
      data: {
        count: result.count,
        entries: result.entries.map((entry) =>
          toFinancialEntryResponseFromEntity(entry),
        ),
      },
    };
  }
}
