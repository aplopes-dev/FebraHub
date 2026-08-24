import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindFinancialEntryByIdUseCase } from '../../../../application/use-cases/find-financial-entry-by-id/find-financial-entry-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toFinancialEntryResponse } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequirePermission('access', 'Financial')
export class FindFinancialEntryByIdRoute {
  constructor(
    private readonly findFinancialEntryById: FindFinancialEntryByIdUseCase,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do lançamento financeiro' })
  async handle(@StoreId() storeId: string, @Param('id') entryId: string) {
    const loaded = await this.findFinancialEntryById.execute({
      storeId,
      entryId,
    });
    return { data: toFinancialEntryResponse(loaded) };
  }
}
