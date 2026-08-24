import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UndoReconciliationUseCase } from '../../../../application/use-cases/undo-reconciliation/undo-reconciliation.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { BankStatementTransactionPresenter } from '../shared/bank-statement-transaction.presenter';
import { BankStatementPresenter } from '../shared/bank-statement.presenter';

@ApiTags('bank-statements')
@Controller('v1/bank-statements/:id/transactions/:transactionId/reconcile')
export class UndoReconciliationRoute {
  constructor(private readonly undoReconciliation: UndoReconciliationUseCase) {}

  @Post('undo')
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary:
      'Desfazer a conciliação de uma transação (spec 007-financeiro-ajustes-ui, US10)',
    description:
      'Volta a transação para pendente e remove o vínculo (BankStatementMatch) com o lançamento — libera o lançamento para exclusão se não houver outro pagamento conciliado.',
  })
  @ApiResponse({ status: 200, description: 'Conciliação desfeita' })
  @ApiResponse({
    status: 404,
    description: 'Extrato ou transação não encontrado',
  })
  @ApiResponse({
    status: 422,
    description:
      'Transação não está conciliada (mesmo código dos demais erros de precondição de reconcile-transaction)',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) bankStatementId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ) {
    const result = await this.undoReconciliation.execute({
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
