import { Module, forwardRef } from '@nestjs/common';

import { FinancialEntriesModule } from '../financial-entries/financial-entries.module';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';
import { ChartOfAccountsModule } from '../chart-of-accounts/chart-of-accounts.module';
import { CostCentersModule } from '../cost-centers/cost-centers.module';
import { CustomersModule } from '../../customers/customers.module';
import { SuppliersModule } from '../../stock/suppliers/suppliers.module';

import { BankStatementRepository } from './domain/repositories/bank-statement.repository.interface';
import { PrismaBankStatementRepository } from './infrastructure/database/prisma-bank-statement.repository';
import { BankStatementTransactionRepository } from './domain/repositories/bank-statement-transaction.repository.interface';
import { PrismaBankStatementTransactionRepository } from './infrastructure/database/prisma-bank-statement-transaction.repository';
import { BankStatementMatchRepository } from './domain/repositories/bank-statement-match.repository.interface';
import { PrismaBankStatementMatchRepository } from './infrastructure/database/prisma-bank-statement-match.repository';

import { ImportBankStatementUseCase } from './application/use-cases/import-bank-statement/import-bank-statement.use-case';
import { PreviewBankStatementUseCase } from './application/use-cases/preview-bank-statement/preview-bank-statement.use-case';
import { ListBankStatementsUseCase } from './application/use-cases/list-bank-statements/list-bank-statements.use-case';
import { FindBankStatementByIdUseCase } from './application/use-cases/find-bank-statement-by-id/find-bank-statement-by-id.use-case';
import { DeleteBankStatementUseCase } from './application/use-cases/delete-bank-statement/delete-bank-statement.use-case';
import { ListStatementTransactionsUseCase } from './application/use-cases/list-statement-transactions/list-statement-transactions.use-case';
import { SuggestMatchesUseCase } from './application/use-cases/suggest-matches/suggest-matches.use-case';
import { SearchEligibleEntriesUseCase } from './application/use-cases/search-eligible-entries/search-eligible-entries.use-case';
import { ReconcileTransactionUseCase } from './application/use-cases/reconcile-transaction/reconcile-transaction.use-case';
import { UndoReconciliationUseCase } from './application/use-cases/undo-reconciliation/undo-reconciliation.use-case';
import { DiscardTransactionUseCase } from './application/use-cases/discard-transaction/discard-transaction.use-case';
import { CreateEntryFromTransactionUseCase } from './application/use-cases/create-entry-from-transaction/create-entry-from-transaction.use-case';

import { ImportBankStatementRoute } from './infrastructure/http/routes/import-bank-statement/import-bank-statement.route';
import { PreviewBankStatementRoute } from './infrastructure/http/routes/preview-bank-statement/preview-bank-statement.route';
import { ListBankStatementsRoute } from './infrastructure/http/routes/list-bank-statements/list-bank-statements.route';
import { FindBankStatementByIdRoute } from './infrastructure/http/routes/find-bank-statement-by-id/find-bank-statement-by-id.route';
import { DeleteBankStatementRoute } from './infrastructure/http/routes/delete-bank-statement/delete-bank-statement.route';
import { ListStatementTransactionsRoute } from './infrastructure/http/routes/list-statement-transactions/list-statement-transactions.route';
import { SuggestMatchesRoute } from './infrastructure/http/routes/suggest-matches/suggest-matches.route';
import { SearchEligibleEntriesRoute } from './infrastructure/http/routes/search-eligible-entries/search-eligible-entries.route';
import { ReconcileTransactionRoute } from './infrastructure/http/routes/reconcile-transaction/reconcile-transaction.route';
import { UndoReconciliationRoute } from './infrastructure/http/routes/undo-reconciliation/undo-reconciliation.route';
import { DiscardTransactionRoute } from './infrastructure/http/routes/discard-transaction/discard-transaction.route';
import { CreateEntryFromTransactionRoute } from './infrastructure/http/routes/create-entry-from-transaction/create-entry-from-transaction.route';

/**
 * Conciliação bancária — importação de extrato OFX e casamento das
 * transações com lançamentos financeiros (`specs/erp/006-bank-reconciliation/`).
 *
 * Importa `FinancialEntriesModule`/`BankAccountsModule` via DI normal — os
 * três são módulos irmãos dentro de `finance/`, sem o histórico de import
 * circular que levou `sales`→`finance` a usar Prisma direto (research.md D2).
 * Controllers/use cases entram incrementalmente por user story.
 *
 * `FinancialEntriesModule` importado com `forwardRef` desde
 * `specs/erp/007-financeiro-ajustes-ui` US10 (`research.md` R9): a partir
 * desta fatia `FinancialEntriesModule` também importa
 * `BankReconciliationModule` (para `DeleteFinancialEntryUseCase` bloquear
 * exclusão de lançamento conciliado) — ciclo real entre módulos irmãos,
 * quebrado com `forwardRef` nos dois lados.
 */
@Module({
  imports: [
    forwardRef(() => FinancialEntriesModule),
    BankAccountsModule,
    ChartOfAccountsModule,
    CostCentersModule,
    CustomersModule,
    SuppliersModule,
  ],
  // Ordem importa: as rotas de caminho fixo antes de `:id` (mesmo cuidado de
  // `bank-accounts.module.ts`).
  controllers: [
    ListBankStatementsRoute,
    PreviewBankStatementRoute,
    ImportBankStatementRoute,
    FindBankStatementByIdRoute,
    DeleteBankStatementRoute,
    ListStatementTransactionsRoute,
    SuggestMatchesRoute,
    SearchEligibleEntriesRoute,
    ReconcileTransactionRoute,
    UndoReconciliationRoute,
    DiscardTransactionRoute,
    CreateEntryFromTransactionRoute,
  ],
  providers: [
    {
      provide: BankStatementRepository,
      useClass: PrismaBankStatementRepository,
    },
    {
      provide: BankStatementTransactionRepository,
      useClass: PrismaBankStatementTransactionRepository,
    },
    {
      provide: BankStatementMatchRepository,
      useClass: PrismaBankStatementMatchRepository,
    },
    ImportBankStatementUseCase,
    PreviewBankStatementUseCase,
    ListBankStatementsUseCase,
    FindBankStatementByIdUseCase,
    DeleteBankStatementUseCase,
    ListStatementTransactionsUseCase,
    SuggestMatchesUseCase,
    SearchEligibleEntriesUseCase,
    ReconcileTransactionUseCase,
    UndoReconciliationUseCase,
    DiscardTransactionUseCase,
    CreateEntryFromTransactionUseCase,
  ],
  exports: [
    BankStatementRepository,
    BankStatementTransactionRepository,
    BankStatementMatchRepository,
  ],
})
export class BankReconciliationModule {}
