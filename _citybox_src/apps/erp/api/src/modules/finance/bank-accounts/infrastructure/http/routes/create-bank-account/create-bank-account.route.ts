import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateBankAccountUseCase } from '../../../../application/use-cases/create-bank-account/create-bank-account.use-case';
import { FindBankAccountByIdUseCase } from '../../../../application/use-cases/find-bank-account-by-id/find-bank-account-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { BankAccountWritableHttpDto } from '../shared/bank-account.dto';
import { BankAccountPresenter } from '../shared/bank-account.presenter';

@ApiTags('bank-accounts')
@Controller('v1/bank-accounts')
export class CreateBankAccountRoute {
  constructor(
    private readonly createBankAccount: CreateBankAccountUseCase,
    private readonly findBankAccountById: FindBankAccountByIdUseCase,
  ) {}

  @Post()
  @RequirePermission('store.finance.manage')
  @ApiOperation({ summary: 'Criar conta bancária' })
  @ApiResponse({ status: 201, description: 'Conta bancária criada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: BankAccountWritableHttpDto,
  ) {
    const bankAccount = await this.createBankAccount.execute({
      organizationId,
      name: dto.name,
      bankName: dto.bankName,
      bankCode: dto.bankCode,
      openingBalanceCents: dto.openingBalanceCents,
      openedAt: new Date(dto.openedAt),
      branchIds: dto.branchIds,
    });
    // Reconsulta pelo saldo calculado em vez de assumir `openingBalanceCents`
    // — mesma fonte de verdade da listagem/detalhe (FR-004), sem duplicar a
    // lógica de agregação aqui.
    const withBalance = await this.findBankAccountById.execute({
      organizationId,
      id: bankAccount.id,
    });
    return BankAccountPresenter.toHttpSingle(withBalance);
  }
}
