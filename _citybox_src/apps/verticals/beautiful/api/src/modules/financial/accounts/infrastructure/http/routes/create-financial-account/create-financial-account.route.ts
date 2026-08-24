import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateFinancialAccountUseCase } from '../../../../application/use-cases/create-financial-account/create-financial-account.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreateFinancialAccountBodyDto } from './create-financial-account.dto';
import { toFinancialAccountResponse } from '../shared/financial-account.presenter';

@ApiTags('financial-accounts')
@Controller('v1/financial/accounts')
@RequirePermission('access', 'Financial')
export class CreateFinancialAccountRoute {
  constructor(
    private readonly createFinancialAccount: CreateFinancialAccountUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar conta financeira' })
  async handle(
    @StoreId() storeId: string,
    @Body() body: CreateFinancialAccountBodyDto,
  ) {
    const account = await this.createFinancialAccount.execute({
      storeId,
      name: body.name,
      type: body.type,
    });
    return { data: toFinancialAccountResponse(account) };
  }
}
