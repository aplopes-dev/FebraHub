import { Controller, Delete, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeleteFinancialAccountUseCase } from '../../../../application/use-cases/delete-financial-account/delete-financial-account.use-case';
import { RequireAnyPermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('financial-accounts')
@Controller('v1/financial/accounts')
@RequireAnyPermission({ action: 'delete', subject: 'FinancialAccount' })
export class DeleteFinancialAccountRoute {
  constructor(
    private readonly deleteFinancialAccount: DeleteFinancialAccountUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir conta financeira' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') accountId: string,
  ): Promise<void> {
    await this.deleteFinancialAccount.execute({ storeId, accountId });
  }
}
