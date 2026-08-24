import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReconcileTransactionUseCase } from '../../../../application/use-cases/reconcile-transaction/reconcile-transaction.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ReconcileTransactionHttpDto } from '../shared/reconcile-transaction.dto';
import { BankStatementTransactionPresenter } from '../shared/bank-statement-transaction.presenter';
import { BankStatementPresenter } from '../shared/bank-statement.presenter';

@ApiTags('bank-statements')
@Controller('v1/bank-statements/:id/transactions/:transactionId/reconcile')
export class ReconcileTransactionRoute {
  constructor(
    private readonly reconcileTransaction: ReconcileTransactionUseCase,
  ) {}

  @Post()
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary:
      'Conciliar transação (sugestão, busca manual ou soma de N lançamentos)',
  })
  @ApiResponse({ status: 200, description: 'Transação conciliada' })
  @ApiResponse({
    status: 404,
    description: 'Extrato, transação ou lançamento não encontrado',
  })
  @ApiResponse({
    status: 422,
    description:
      'Transação não pendente, lançamento já conciliado, ou soma não fecha',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) bankStatementId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Body() dto: ReconcileTransactionHttpDto,
  ) {
    const result = await this.reconcileTransaction.execute({
      organizationId,
      bankStatementId,
      transactionId,
      financialEntryIds: dto.financialEntryIds,
    });
    return {
      data: BankStatementTransactionPresenter.toHttp(
        result.transaction,
        result.matches,
      ),
      bankStatement: BankStatementPresenter.toHttp(result.bankStatement),
    };
  }
}
