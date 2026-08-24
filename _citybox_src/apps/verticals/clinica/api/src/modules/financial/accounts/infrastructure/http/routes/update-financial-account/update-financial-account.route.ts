import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateFinancialAccountUseCase } from '../../../../application/use-cases/update-financial-account/update-financial-account.use-case';
import { RequireAnyPermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdateFinancialAccountBodyDto } from './update-financial-account.dto';
import { toFinancialAccountResponse } from '../shared/financial-account.presenter';

@ApiTags('financial-accounts')
@Controller('v1/financial/accounts')
@RequireAnyPermission({ action: 'create', subject: 'FinancialAccount' })
export class UpdateFinancialAccountRoute {
  constructor(
    private readonly updateFinancialAccount: UpdateFinancialAccountUseCase,
  ) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar conta financeira' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') accountId: string,
    @Body() body: UpdateFinancialAccountBodyDto,
  ) {
    const account = await this.updateFinancialAccount.execute({
      storeId,
      accountId,
      name: body.name,
      type: body.type,
      isActive: body.isActive,
    });
    return { data: toFinancialAccountResponse(account) };
  }
}
