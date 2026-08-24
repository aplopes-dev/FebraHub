import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DiscardTransactionUseCase } from '../../../../application/use-cases/discard-transaction/discard-transaction.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { BankStatementTransactionPresenter } from '../shared/bank-statement-transaction.presenter';
import { BankStatementPresenter } from '../shared/bank-statement.presenter';

@ApiTags('bank-statements')
@Controller('v1/bank-statements/:id/transactions/:transactionId')
export class DiscardTransactionRoute {
  constructor(private readonly discardTransaction: DiscardTransactionUseCase) {}

  @Post('discard')
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Excluir uma transação pendente da conciliação (FR-019)',
    description:
      'Move a transação para o grupo Excluídas sem apagá-la. Só permitido enquanto pending — uma transação conciliada precisa de "desfazer" primeiro.',
  })
  @ApiResponse({ status: 200, description: 'Transação excluída' })
  @ApiResponse({
    status: 404,
    description: 'Extrato ou transação não encontrado',
  })
  @ApiResponse({
    status: 422,
    description: 'Transação já foi tratada (conciliada ou já excluída)',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) bankStatementId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ) {
    const result = await this.discardTransaction.execute({
      organizationId,
      bankStatementId,
      transactionId,
    });
    return {
      data: BankStatementTransactionPresenter.toHttp(result.transaction),
      bankStatement: BankStatementPresenter.toHttp(result.bankStatement),
    };
  }
}
