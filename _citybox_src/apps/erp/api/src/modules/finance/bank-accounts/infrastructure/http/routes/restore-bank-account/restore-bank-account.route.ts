import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RestoreBankAccountUseCase } from '../../../../application/use-cases/restore-bank-account/restore-bank-account.use-case';
import { FindBankAccountByIdUseCase } from '../../../../application/use-cases/find-bank-account-by-id/find-bank-account-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { BankAccountPresenter } from '../shared/bank-account.presenter';

@ApiTags('bank-accounts')
@Controller('v1/bank-accounts')
export class RestoreBankAccountRoute {
  constructor(
    private readonly restoreBankAccount: RestoreBankAccountUseCase,
    private readonly findBankAccountById: FindBankAccountByIdUseCase,
  ) {}

  @Post(':id/restore')
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Restaurar conta bancária excluída',
    description: 'Idempotente: restaurar quem já está ativa devolve 200.',
  })
  @ApiResponse({ status: 404, description: 'Conta bancária não encontrada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.restoreBankAccount.execute({ organizationId, id });
    const withBalance = await this.findBankAccountById.execute({
      organizationId,
      id,
    });
    return BankAccountPresenter.toHttpSingle(withBalance);
  }
}
