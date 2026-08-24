import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialEntry } from '../../../../financial-entries/domain/entities/financial-entry.entity';
import { FinancialEntryRepository } from '../../../../financial-entries/domain/repositories/financial-entry.repository.interface';
import { ChartOfAccountRepository } from '../../../../chart-of-accounts/domain/repositories/chart-of-account.repository.interface';
import { CostCenterRepository } from '../../../../cost-centers/domain/repositories/cost-center.repository.interface';
import { BankAccountRepository } from '../../../../bank-accounts/domain/repositories/bank-account.repository.interface';
import { CustomerRepository } from '../../../../../customers/domain/repositories/customer.repository.interface';
import { SupplierRepository } from '../../../../../stock/suppliers/domain/repositories/supplier.repository.interface';
import { assertChartOfAccountExists } from '../../../../financial-entries/application/use-cases/assert-chart-of-account-exists';
import { assertCostCenterExists } from '../../../../financial-entries/application/use-cases/assert-cost-center-exists';
import { assertBankAccountExists } from '../../../../financial-entries/application/use-cases/assert-bank-account-exists';
import { assertCustomerExists } from '../../../../financial-entries/application/use-cases/assert-customer-exists';
import { assertSupplierExists } from '../../../../financial-entries/application/use-cases/assert-supplier-exists';
import { BankStatementRepository } from '../../../domain/repositories/bank-statement.repository.interface';
import { BankStatementTransactionRepository } from '../../../domain/repositories/bank-statement-transaction.repository.interface';
import { BankStatementMatchRepository } from '../../../domain/repositories/bank-statement-match.repository.interface';
import { BankStatementMatch } from '../../../domain/entities/bank-statement-match.entity';
import { BankStatementNotFoundError } from '../../../domain/errors/bank-statement-not-found.error';
import { BankStatementTransactionNotFoundError } from '../../../domain/errors/bank-statement-transaction-not-found.error';
import { BankStatementTransactionNotPendingError } from '../../../domain/errors/bank-statement-transaction-not-pending.error';
import type {
  CreateEntryFromTransactionDto,
  CreateEntryFromTransactionResult,
} from '../../dtos/create-entry-from-transaction.dto';

/**
 * Cria um lançamento financeiro a partir de uma transação pendente do
 * extrato — já nasce pago/recebido e conciliado com ela numa única operação
 * (FR-018, research.md D9). Data, valor e sinal vêm sempre da transação,
 * nunca do formulário — só campos descritivos são editáveis.
 */
@Injectable()
export class CreateEntryFromTransactionUseCase implements IUseCase<
  CreateEntryFromTransactionDto,
  CreateEntryFromTransactionResult
> {
  constructor(
    private readonly bankStatementRepository: BankStatementRepository,
    private readonly bankStatementTransactionRepository: BankStatementTransactionRepository,
    private readonly bankStatementMatchRepository: BankStatementMatchRepository,
    private readonly financialEntryRepository: FinancialEntryRepository,
    private readonly chartOfAccountRepository: ChartOfAccountRepository,
    private readonly costCenterRepository: CostCenterRepository,
    private readonly bankAccountRepository: BankAccountRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly supplierRepository: SupplierRepository,
  ) {}

  async execute(
    input: CreateEntryFromTransactionDto,
  ): Promise<CreateEntryFromTransactionResult> {
    const bankStatement = await this.bankStatementRepository.findById(
      input.organizationId,
      input.bankStatementId,
    );
    if (!bankStatement) {
      throw new BankStatementNotFoundError(input.bankStatementId);
    }

    const transaction = await this.bankStatementTransactionRepository.findById(
      input.organizationId,
      input.transactionId,
    );
    if (!transaction || transaction.bankStatementId !== input.bankStatementId) {
      throw new BankStatementTransactionNotFoundError(input.transactionId);
    }
    if (transaction.status !== 'pending') {
      throw new BankStatementTransactionNotPendingError(transaction.id);
    }

    const chartOfAccountId = await assertChartOfAccountExists(
      this.chartOfAccountRepository,
      input.organizationId,
      input.chartOfAccountId,
    );
    const costCenterId = await assertCostCenterExists(
      this.costCenterRepository,
      input.organizationId,
      input.costCenterId,
    );
    // `bankAccountId` obrigatório aqui (diferente do uso opcional em
    // create-financial-entry) — o `@IsUUID()` do HTTP DTO já garante que não
    // chega vazio; `assertBankAccountExists` devolve `null` só quando a
    // entrada é vazia, então o resultado é sempre string neste fluxo.
    const bankAccountId = (await assertBankAccountExists(
      this.bankAccountRepository,
      input.organizationId,
      input.bankAccountId,
    )) as string;
    // Spec erp/031 D2 — mutuamente exclusivos; `FinancialEntry.create()`
    // também confere isso (defesa em profundidade), mas o existence-check
    // roda antes para devolver um 404 mais específico que um conflito genérico.
    const customerId = await assertCustomerExists(
      this.customerRepository,
      input.organizationId,
      input.customerId,
    );
    const supplierId = await assertSupplierExists(
      this.supplierRepository,
      input.organizationId,
      input.supplierId,
    );

    // Data/valor/sinal vêm sempre da transação — nunca do corpo da requisição
    // (contracts/bank-statement-transaction.contract.md).
    const operation = transaction.kind === 'credit' ? 'receivable' : 'payable';

    const entry = FinancialEntry.create({
      organizationId: input.organizationId,
      operation,
      description: input.description,
      amountCents: transaction.amountCents,
      feesCents: 0,
      finesCents: 0,
      competenceDate: transaction.postedAt,
      dueDate: transaction.postedAt,
      partyName: input.partyName,
      customerId,
      supplierId,
      bankAccountId,
      categoryName: input.categoryName,
      note: input.note,
      allocations: [
        {
          chartOfAccountId,
          costCenterId,
          amountCents: transaction.amountCents,
          percentage: 100,
        },
      ],
    });

    const paymentId = randomUUID();
    const entryWithPayment = entry.addPayment({
      id: paymentId,
      amountCents: transaction.amountCents,
      paidAt: transaction.postedAt,
      paymentMethod: 'conciliacao_bancaria',
      cardBrand: null,
    });
    const savedEntry =
      await this.financialEntryRepository.save(entryWithPayment);

    const match = BankStatementMatch.create(
      {
        organizationId: input.organizationId,
        bankStatementTransactionId: transaction.id,
        financialEntryId: savedEntry.id,
        financialEntryPaymentId: paymentId,
        amountCents: transaction.amountCents,
      },
      randomUUID(),
    );
    await this.bankStatementMatchRepository.saveMany([match]);

    const reconciledTransaction = transaction.reconcile();
    await this.bankStatementTransactionRepository.save(reconciledTransaction);

    const counts =
      await this.bankStatementTransactionRepository.countByStatement(
        input.organizationId,
        input.bankStatementId,
      );
    const updatedStatement = bankStatement.withRecalculatedCounts(counts);
    await this.bankStatementRepository.save(updatedStatement);

    return {
      bankStatement: updatedStatement,
      transaction: reconciledTransaction,
      financialEntry: savedEntry,
      match,
    };
  }
}
