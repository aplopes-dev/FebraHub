import { Module } from '@nestjs/common';
import { CostCentersModule } from './cost-centers/cost-centers.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { FinancialGroupsModule } from './financial-groups/financial-groups.module';
import { ChartOfAccountsModule } from './chart-of-accounts/chart-of-accounts.module';
import { CardContractsModule } from './card-contracts/card-contracts.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { BankTransfersModule } from './bank-transfers/bank-transfers.module';
import { FinancialEntriesModule } from './financial-entries/financial-entries.module';
import { BankReconciliationModule } from './bank-reconciliation/bank-reconciliation.module';
import { ReportsModule } from './reports/reports.module';

/**
 * Módulo de finanças — cadastros de suporte (centro de custo, forma de
 * pagamento, grupo financeiro, plano de contas, contratos de cartão, contas
 * bancárias) e lançamentos. Cada submódulo é Clean Architecture completa.
 * Ver `AGENTS.md` §9.
 */
@Module({
  imports: [
    CostCentersModule,
    PaymentMethodsModule,
    FinancialGroupsModule,
    ChartOfAccountsModule,
    CardContractsModule,
    BankAccountsModule,
    BankTransfersModule,
    FinancialEntriesModule,
    BankReconciliationModule,
    ReportsModule,
  ],
})
export class FinanceModule {}
