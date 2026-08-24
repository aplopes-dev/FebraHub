import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatsFinancialEntriesUseCase } from '../../../../application/use-cases/stats-financial-entries/stats-financial-entries.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { StatsFinancialEntriesQueryDto } from './stats-financial-entries.query.dto';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequirePermission('access', 'Financial')
export class StatsFinancialEntriesRoute {
  constructor(
    private readonly statsFinancialEntries: StatsFinancialEntriesUseCase,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas do fluxo de caixa' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: StatsFinancialEntriesQueryDto,
  ) {
    const result = await this.statsFinancialEntries.execute({
      storeId,
      startDate: query.startDate,
      endDate: query.endDate,
    });
    return { data: result.data };
  }
}
