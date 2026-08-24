import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindBankAccountByIdUseCase } from '../../../../application/use-cases/find-bank-account-by-id/find-bank-account-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { BankAccountPresenter } from '../shared/bank-account.presenter';

@ApiTags('bank-accounts')
@Controller('v1/bank-accounts')
export class FindBankAccountByIdRoute {
  constructor(private readonly findBankAccount: FindBankAccountByIdUseCase) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Detalhar conta bancária',
    description: 'Devolve também a excluída — a aba "Excluídas" leva até ela.',
  })
  @ApiResponse({ status: 404, description: 'Conta bancária não encontrada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const bankAccount = await this.findBankAccount.execute({
      organizationId,
      id,
    });
    return BankAccountPresenter.toHttpSingle(bankAccount);
  }
}
