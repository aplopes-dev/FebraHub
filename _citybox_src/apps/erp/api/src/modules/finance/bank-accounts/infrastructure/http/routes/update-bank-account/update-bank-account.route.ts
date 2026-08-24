import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateBankAccountUseCase } from '../../../../application/use-cases/update-bank-account/update-bank-account.use-case';
import { FindBankAccountByIdUseCase } from '../../../../application/use-cases/find-bank-account-by-id/find-bank-account-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { BankAccountWritableHttpDto } from '../shared/bank-account.dto';
import { BankAccountPresenter } from '../shared/bank-account.presenter';

@ApiTags('bank-accounts')
@Controller('v1/bank-accounts')
export class UpdateBankAccountRoute {
  constructor(
    private readonly updateBankAccount: UpdateBankAccountUseCase,
    private readonly findBankAccountById: FindBankAccountByIdUseCase,
  ) {}

  @Put(':id')
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Atualizar conta bancária',
    description: 'Semântica PUT: campo omitido é limpo.',
  })
  @ApiResponse({ status: 404, description: 'Conta bancária não encontrada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BankAccountWritableHttpDto,
  ) {
    await this.updateBankAccount.execute({
      organizationId,
      id,
      name: dto.name,
      bankName: dto.bankName,
      bankCode: dto.bankCode,
      openingBalanceCents: dto.openingBalanceCents,
      openedAt: new Date(dto.openedAt),
      branchIds: dto.branchIds,
    });
    // Reconsulta pelo saldo calculado — editar `openingBalanceCents` pode ter
    // mudado o saldo, e outras movimentações (transferências, pagamentos)
    // podem já existir na conta (FR-004).
    const withBalance = await this.findBankAccountById.execute({
      organizationId,
      id,
    });
    return BankAccountPresenter.toHttpSingle(withBalance);
  }
}
