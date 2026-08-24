import { Module, forwardRef } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ListInvoicesRoute } from './infrastructure/http/routes/list-invoices/list-invoices.route';
import { FindInvoiceByIdRoute } from './infrastructure/http/routes/find-invoice-by-id/find-invoice-by-id.route';
import { MarkInvoiceAsPaidRoute } from './infrastructure/http/routes/mark-invoice-as-paid/mark-invoice-as-paid.route';
import { GetBillingKpisRoute } from './infrastructure/http/routes/get-billing-kpis/get-billing-kpis.route';
import { GenerateInvoicesJobRoute } from './infrastructure/http/routes/generate-invoices-job/generate-invoices-job.route';
import { ListInvoicesUseCase } from './application/use-cases/list-invoices/list-invoices.use-case';
import { FindInvoiceByIdUseCase } from './application/use-cases/find-invoice-by-id/find-invoice-by-id.use-case';
import { MarkInvoiceAsPaidUseCase } from './application/use-cases/mark-invoice-as-paid/mark-invoice-as-paid.use-case';
import { GetBillingKpisUseCase } from './application/use-cases/get-billing-kpis/get-billing-kpis.use-case';
import { GenerateInvoicesUseCase } from './application/use-cases/generate-invoices/generate-invoices.use-case';
import { PrismaInvoiceRepository } from './infrastructure/database/prisma-invoice.repository';
import { InvoiceRepository } from './domain/repositories/invoice.repository.interface';
import { CreateManualInvoiceRoute } from './infrastructure/http/routes/create-manual-invoice/create-manual-invoice.route';
import { CreateManualInvoiceUseCase } from './application/use-cases/create-manual-invoice/create-manual-invoice.use-case';
import { PaymentGatewayModule } from '../payment-gateway/payment-gateway.module';
import { StoresModule } from '../stores/stores.module';
import { ProcessPaymentCreatedUseCase } from './application/use-cases/process-payment-created/process-payment-created.use-case';
import { ProcessPaymentUpdatedUseCase } from './application/use-cases/process-payment-updated/process-payment-updated.use-case';
import { ProcessPaymentPaidUseCase } from './application/use-cases/process-payment-paid/process-payment-paid.use-case';
import { ProcessPaymentOverdueUseCase } from './application/use-cases/process-payment-overdue/process-payment-overdue.use-case';
import { GetInvoicePaymentDetailsRoute } from './infrastructure/http/routes/get-invoice-payment-details/get-invoice-payment-details.route';
import { GetInvoicePaymentDetailsUseCase } from './application/use-cases/get-invoice-payment-details/get-invoice-payment-details.use-case';
import { GetInvoicesStatsRoute } from './infrastructure/http/routes/get-invoices-stats/get-invoices-stats.route';
import { GetInvoicesStatsUseCase } from './application/use-cases/get-invoices-stats/get-invoices-stats.use-case';

@Module({
  imports: [
    SubscriptionsModule,
    forwardRef(() => PaymentGatewayModule),
    forwardRef(() => StoresModule),
  ],
  controllers: [
    ListInvoicesRoute,
    GetInvoicesStatsRoute,
    FindInvoiceByIdRoute,
    MarkInvoiceAsPaidRoute,
    GetBillingKpisRoute,
    GenerateInvoicesJobRoute,
    CreateManualInvoiceRoute,
    GetInvoicePaymentDetailsRoute,
  ],
  providers: [
    { provide: InvoiceRepository, useClass: PrismaInvoiceRepository },
    ListInvoicesUseCase,
    GetInvoicesStatsUseCase,
    FindInvoiceByIdUseCase,
    MarkInvoiceAsPaidUseCase,
    GetBillingKpisUseCase,
    GenerateInvoicesUseCase,
    CreateManualInvoiceUseCase,
    GetInvoicePaymentDetailsUseCase,
    ProcessPaymentCreatedUseCase,
    ProcessPaymentUpdatedUseCase,
    ProcessPaymentPaidUseCase,
    ProcessPaymentOverdueUseCase,
  ],
  exports: [
    InvoiceRepository,
    ProcessPaymentCreatedUseCase,
    ProcessPaymentUpdatedUseCase,
    ProcessPaymentPaidUseCase,
    ProcessPaymentOverdueUseCase,
  ],
})
export class InvoicesModule {}
