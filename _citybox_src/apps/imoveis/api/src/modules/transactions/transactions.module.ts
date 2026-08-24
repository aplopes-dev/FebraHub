import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infra/prisma/prisma.module';
import { FinanceModule } from '../finance/finance.module';
import { LeadsModule } from '../leads/leads.module';
import { PropertiesModule } from '../properties/properties.module';
import { DealsModule } from '../deals/deals.module';
import { TransactionRepository } from './domain/repositories/transaction.repository.interface';
import { PrismaTransactionRepository } from './infrastructure/database/prisma-transaction.repository';
import { ListTransactionsRoute } from './infrastructure/http/routes/list-transactions/list-transactions.route';
import { GetTransactionsReportRoute } from './infrastructure/http/routes/get-transactions-report/get-transactions-report.route';
import { ListTransactionDocumentsRoute } from './infrastructure/http/routes/list-transaction-documents/list-transaction-documents.route';
import { GetTransactionByIdRoute } from './infrastructure/http/routes/get-transaction-by-id/get-transaction-by-id.route';
import { CreateTransactionRoute } from './infrastructure/http/routes/create-transaction/create-transaction.route';
import { UpdateTransactionSplitRoute } from './infrastructure/http/routes/update-transaction-split/update-transaction-split.route';
import { UpdateRentalPayoutRoute } from './infrastructure/http/routes/update-rental-payout/update-rental-payout.route';
import { UpdateTransactionStatusRoute } from './infrastructure/http/routes/update-transaction-status/update-transaction-status.route';
import { ListTransactionsUseCase } from './application/use-cases/list-transactions/list-transactions.use-case';
import { GetTransactionByIdUseCase } from './application/use-cases/get-transaction-by-id/get-transaction-by-id.use-case';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction/create-transaction.use-case';
import { UpdateTransactionSplitUseCase } from './application/use-cases/update-transaction-split/update-transaction-split.use-case';
import { UpdateRentalPayoutUseCase } from './application/use-cases/update-rental-payout/update-rental-payout.use-case';
import { UpdateTransactionStatusUseCase } from './application/use-cases/update-transaction-status/update-transaction-status.use-case';
import { GetTransactionsReportUseCase } from './application/use-cases/get-transactions-report/get-transactions-report.use-case';
import { ListTransactionDocumentsUseCase } from './application/use-cases/list-transaction-documents/list-transaction-documents.use-case';

@Module({
  imports: [
    PrismaModule,
    PropertiesModule,
    forwardRef(() => LeadsModule),
    forwardRef(() => DealsModule),
    // Circular: o financeiro agrega transações e a criação de transação lê a
    // configuração de comissão.
    forwardRef(() => FinanceModule),
  ],
  controllers: [
    ListTransactionsRoute,
    // `report` precisa vir antes de `:id` — ver comentário na route.
    GetTransactionsReportRoute,
    ListTransactionDocumentsRoute,
    GetTransactionByIdRoute,
    CreateTransactionRoute,
    UpdateTransactionSplitRoute,
    UpdateRentalPayoutRoute,
    UpdateTransactionStatusRoute,
  ],
  providers: [
    { provide: TransactionRepository, useClass: PrismaTransactionRepository },
    ListTransactionsUseCase,
    GetTransactionByIdUseCase,
    CreateTransactionUseCase,
    UpdateTransactionSplitUseCase,
    UpdateRentalPayoutUseCase,
    UpdateTransactionStatusUseCase,
    GetTransactionsReportUseCase,
    ListTransactionDocumentsUseCase,
  ],
  exports: [TransactionRepository],
})
export class TransactionsModule {}
