import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateFinancialEntryUseCase } from '../../../../application/use-cases/update-financial-entry/update-financial-entry.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdateFinancialEntryBodyDto } from '../shared/financial-entry-body.dto';
import { toFinancialEntryResponseFromEntity } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequirePermission('access', 'Financial')
export class UpdateFinancialEntryRoute {
  constructor(
    private readonly updateFinancialEntry: UpdateFinancialEntryUseCase,
  ) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar lançamento financeiro pendente' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') entryId: string,
    @Body() body: UpdateFinancialEntryBodyDto,
  ) {
    const entry = await this.updateFinancialEntry.execute({
      storeId,
      entryId,
      ...body,
    });
    return { data: toFinancialEntryResponseFromEntity(entry) };
  }
}
