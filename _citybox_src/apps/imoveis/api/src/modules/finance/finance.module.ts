import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infra/prisma/prisma.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { CommissionConfigRepository } from './domain/repositories/commission-config.repository.interface';
import { ExpenseRepository } from './domain/repositories/expense.repository.interface';
import { PrismaCommissionConfigRepository } from './infrastructure/database/prisma-commission-config.repository';
import { PrismaExpenseRepository } from './infrastructure/database/prisma-expense.repository';
import { GetCommissionConfigRoute } from './infrastructure/http/routes/get-commission-config/get-commission-config.route';
import { PutCommissionConfigRoute } from './infrastructure/http/routes/put-commission-config/put-commission-config.route';
import { ListExpensesRoute } from './infrastructure/http/routes/list-expenses/list-expenses.route';
import { CreateExpenseRoute } from './infrastructure/http/routes/create-expense/create-expense.route';
import { DeleteExpenseRoute } from './infrastructure/http/routes/delete-expense/delete-expense.route';
import { GetFinancialSummaryRoute } from './infrastructure/http/routes/get-financial-summary/get-financial-summary.route';
import { ListPersonalCommissionsRoute } from './infrastructure/http/routes/list-personal-commissions/list-personal-commissions.route';
import { ListRentalPayoutsRoute } from './infrastructure/http/routes/list-rental-payouts/list-rental-payouts.route';
import { GetCommissionConfigUseCase } from './application/use-cases/get-commission-config/get-commission-config.use-case';
import { PutCommissionConfigUseCase } from './application/use-cases/put-commission-config/put-commission-config.use-case';
import { ListExpensesUseCase } from './application/use-cases/list-expenses/list-expenses.use-case';
import { CreateExpenseUseCase } from './application/use-cases/create-expense/create-expense.use-case';
import { DeleteExpenseUseCase } from './application/use-cases/delete-expense/delete-expense.use-case';
import { GetFinancialSummaryUseCase } from './application/use-cases/get-financial-summary/get-financial-summary.use-case';
import { ListPersonalCommissionsUseCase } from './application/use-cases/list-personal-commissions/list-personal-commissions.use-case';
import { ListRentalPayoutsUseCase } from './application/use-cases/list-rental-payouts/list-rental-payouts.use-case';

@Module({
  imports: [PrismaModule, forwardRef(() => TransactionsModule)],
  controllers: [
    GetCommissionConfigRoute,
    PutCommissionConfigRoute,
    ListExpensesRoute,
    CreateExpenseRoute,
    DeleteExpenseRoute,
    GetFinancialSummaryRoute,
    ListPersonalCommissionsRoute,
    ListRentalPayoutsRoute,
  ],
  providers: [
    {
      provide: CommissionConfigRepository,
      useClass: PrismaCommissionConfigRepository,
    },
    { provide: ExpenseRepository, useClass: PrismaExpenseRepository },
    GetCommissionConfigUseCase,
    PutCommissionConfigUseCase,
    ListExpensesUseCase,
    CreateExpenseUseCase,
    DeleteExpenseUseCase,
    GetFinancialSummaryUseCase,
    ListPersonalCommissionsUseCase,
    ListRentalPayoutsUseCase,
  ],
  exports: [
    CommissionConfigRepository,
    ExpenseRepository,
    GetFinancialSummaryUseCase,
  ],
})
export class FinanceModule {}
