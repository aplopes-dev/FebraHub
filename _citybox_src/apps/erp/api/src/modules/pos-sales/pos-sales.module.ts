import { Module } from '@nestjs/common';
import { BankReconciliationModule } from '../finance/bank-reconciliation/bank-reconciliation.module';
import { FinancialEntriesModule } from '../finance/financial-entries/financial-entries.module';
import { PaymentMethodsModule } from '../finance/payment-methods/payment-methods.module';
import { PosCashSessionsModule } from '../pos-cash-sessions/pos-cash-sessions.module';
import { PosDeliveryModule } from '../pos-delivery/pos-delivery.module';
import { PosPoliciesModule } from '../pos-policies/pos-policies.module';
import { PosTerminalsModule } from '../pos-terminals/pos-terminals.module';
import { SalesModule } from '../sales/sales.module';
import { StockModule } from '../stock/stock.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { CancelPosSaleUseCase } from './application/use-cases/cancel-pos-sale/cancel-pos-sale.use-case';
import { CreatePosSaleUseCase } from './application/use-cases/create-pos-sale/create-pos-sale.use-case';
import { CancelPosSaleRoute } from './infrastructure/http/routes/cancel-pos-sale/cancel-pos-sale.route';
import { CreatePosSaleRoute } from './infrastructure/http/routes/create-pos-sale/create-pos-sale.route';

@Module({
  imports: [
    SalesModule,
    PosTerminalsModule,
    PosCashSessionsModule,
    PosDeliveryModule,
    PosPoliciesModule,
    PaymentMethodsModule,
    StockModule,
    TenancyModule,
    FinancialEntriesModule,
    BankReconciliationModule,
  ],
  controllers: [CreatePosSaleRoute, CancelPosSaleRoute],
  providers: [CreatePosSaleUseCase, CancelPosSaleUseCase],
})
export class PosSalesModule {}
