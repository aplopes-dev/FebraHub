import { Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CancelFinancialEntryUseCase } from '../../../../application/use-cases/cancel-financial-entry/cancel-financial-entry.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toFinancialEntryResponseFromEntity } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequirePermission('access', 'Financial')
export class CancelFinancialEntryRoute {
  constructor(
    private readonly cancelFinancialEntry: CancelFinancialEntryUseCase,
  ) {}

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar lançamento financeiro' })
  async handle(@StoreId() storeId: string, @Param('id') entryId: string) {
    const entry = await this.cancelFinancialEntry.execute({
      storeId,
      entryId,
    });
    return { data: toFinancialEntryResponseFromEntity(entry) };
  }
}
