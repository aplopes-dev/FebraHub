import {
  Body,
  Controller,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateEntryFromTransactionUseCase } from '../../../../application/use-cases/create-entry-from-transaction/create-entry-from-transaction.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CreateEntryFromTransactionHttpDto } from '../shared/create-entry-from-transaction.dto';
import { BankStatementTransactionPresenter } from '../shared/bank-statement-transaction.presenter';
import { BankStatementPresenter } from '../shared/bank-statement.presenter';
import { FinancialEntryPresenter } from '../../../../../financial-entries/infrastructure/http/routes/shared/financial-entry.presenter';

@ApiTags('bank-statements')
@Controller('v1/bank-statements/:id/transactions/:transactionId')
export class CreateEntryFromTransactionRoute {
  constructor(
    private readonly createEntryFromTransaction: CreateEntryFromTransactionUseCase,
  ) {}

  @Post('create-entry')
  @HttpCode(201)
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Criar lançamento a partir de uma transação pendente (FR-018)',
    description:
      'Data, valor e sinal vêm sempre da transação — o lançamento nasce pago e já conciliado com ela.',
  })
  @ApiResponse({
    status: 201,
    description: 'Lançamento criado e transação conciliada',
  })
  @ApiResponse({
    status: 404,
    description:
      'Extrato, transação, conta do plano ou centro de custo não encontrado',
  })
  @ApiResponse({
    status: 422,
    description: 'Transação já foi tratada',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) bankStatementId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Body() dto: CreateEntryFromTransactionHttpDto,
  ) {
    const result = await this.createEntryFromTransaction.execute({
      organizationId,
      bankStatementId,
      transactionId,
      description: dto.description ?? '',
      partyName: dto.partyName ?? '',
      customerId: dto.customerId ?? null,
      supplierId: dto.supplierId ?? null,
      categoryName: dto.categoryName ?? '',
      note: dto.note ?? '',
      bankAccountId: dto.bankAccountId,
      chartOfAccountId: dto.chartOfAccountId,
      costCenterId: dto.costCenterId,
    });
    return {
      data: FinancialEntryPresenter.toHttp(result.financialEntry),
      transaction: BankStatementTransactionPresenter.toHttp(
        result.transaction,
        [result.match],
      ),
      bankStatement: BankStatementPresenter.toHttp(result.bankStatement),
    };
  }
}
