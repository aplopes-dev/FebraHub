import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateFinancialEntryUseCase } from '../../../../application/use-cases/create-financial-entry/create-financial-entry.use-case';
import {
  type PermissionUser,
  RequireAnyPermission,
} from '../../../../../../../shared/infra/http/decorators/permissions';
import { CurrentUser } from '../../../../../../../shared/infra/http/decorators/current-user.decorator';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { assertFinancialEntryAction } from '../../../../../../../shared/infra/http/permissions/assert-financial-permission';
import { CreateFinancialEntryBodyDto } from '../shared/financial-entry-body.dto';
import { toFinancialEntryResponseFromEntity } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequireAnyPermission(
  { action: 'create', subject: 'FinancialIncome' },
  { action: 'create', subject: 'FinancialExpense' },
)
export class CreateFinancialEntryRoute {
  constructor(
    private readonly createFinancialEntry: CreateFinancialEntryUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar lançamento financeiro' })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @Body() body: CreateFinancialEntryBodyDto,
  ) {
    assertFinancialEntryAction(user, 'create', body.type);

    const entries = await this.createFinancialEntry.execute({
      storeId,
      ...body,
    });
    return {
      data: entries.map((entry) => toFinancialEntryResponseFromEntity(entry)),
    };
  }
}
