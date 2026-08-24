import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListFinancialEntriesUseCase } from '../../../../application/use-cases/list-financial-entries/list-financial-entries.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListFinancialEntriesQueryDto } from './list-financial-entries.query.dto';
import { toFinancialEntryResponse } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequirePermission('access', 'Financial')
export class ListFinancialEntriesRoute {
  constructor(
    private readonly listFinancialEntries: ListFinancialEntriesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar lançamentos financeiros' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListFinancialEntriesQueryDto,
  ) {
    const result = await this.listFinancialEntries.execute({
      storeId,
      ...query,
    });
    return {
      data: result.items.map((item) => toFinancialEntryResponse(item)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
