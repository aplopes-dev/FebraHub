import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateFinancialEntryUseCase } from '../../../../application/use-cases/create-financial-entry/create-financial-entry.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreateFinancialEntryBodyDto } from '../shared/financial-entry-body.dto';
import { toFinancialEntryResponseFromEntity } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequirePermission('access', 'Financial')
export class CreateFinancialEntryRoute {
  constructor(
    private readonly createFinancialEntry: CreateFinancialEntryUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar lançamento financeiro' })
  async handle(
    @StoreId() storeId: string,
    @Body() body: CreateFinancialEntryBodyDto,
  ) {
    const entries = await this.createFinancialEntry.execute({
      storeId,
      ...body,
    });
    return {
      data: entries.map((entry) => toFinancialEntryResponseFromEntity(entry)),
    };
  }
}
