import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeleteFinancialEntryUseCase } from '../../../../application/use-cases/delete-financial-entry/delete-financial-entry.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequirePermission('access', 'Financial')
export class DeleteFinancialEntryRoute {
  constructor(
    private readonly deleteFinancialEntry: DeleteFinancialEntryUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir lançamento financeiro' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') entryId: string,
  ): Promise<void> {
    await this.deleteFinancialEntry.execute({ storeId, entryId });
  }
}
