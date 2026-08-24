import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { SubscriptionRepository } from '../../../../subscriptions/domain/repositories/subscription.repository.interface';
import { StoreRepository } from '../../../../stores/domain/repositories/store.repository.interface';
import { Invoice } from '../../../domain/entities/invoice.entity';

export interface ProcessPaymentCreatedInput {
  payment: {
    id: string;
    customer: string;
    subscription?: string;
    value: number;
    status: string;
    billingType: string;
    dueDate: string;
    invoiceUrl?: string;
  };
}

@Injectable()
export class ProcessPaymentCreatedUseCase implements IUseCase<
  ProcessPaymentCreatedInput,
  Invoice | null
> {
  private readonly logger = new Logger(ProcessPaymentCreatedUseCase.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly storeRepository: StoreRepository,
  ) {}

  async execute(input: ProcessPaymentCreatedInput): Promise<Invoice | null> {
    const { payment } = input;

    // 1. Check if invoice already registered
    const existing = await this.invoiceRepository.findByGatewayPaymentId(
      payment.id,
    );
    if (existing) {
      this.logger.log(`Invoice ${payment.id} already exists. Skipping.`);
      return existing;
    }

    // 2. Resolve a loja pelo customer do PSP. O `gatewayCustomerId` migrou de `Client`
    // para `Store` na Fase 10 — é o único elo entre o webhook e a entidade local.
    const store = await this.storeRepository.findByGatewayCustomerId(
      payment.customer,
    );
    if (!store) {
      this.logger.error(
        `Store not found for gateway customer ID: ${payment.customer}`,
      );
      return null;
    }

    // 3. Find subscription
    let subscription = payment.subscription
      ? await this.subscriptionRepository.findByGatewaySubscriptionId(
          payment.subscription,
        )
      : null;

    if (!subscription) {
      subscription = await this.subscriptionRepository.findActiveByStoreId(
        store.id,
      );
    }

    if (!subscription) {
      // Find any recent subscription to satisfy DB foreign key constraint
      const allSubs = await this.subscriptionRepository.findAll({
        storeId: store.id,
        take: 1,
      });
      subscription = allSubs[0] || null;
    }

    if (!subscription) {
      this.logger.error(
        `Cannot register invoice ${payment.id} because store ${store.id} has no subscriptions.`,
      );
      return null;
    }

    // 4. Try to match with an existing local invoice that doesn't have a gatewayPaymentId yet
    const localInvoices = await this.invoiceRepository.findAll({
      subscriptionId: subscription.id,
      status: ['DRAFT', 'OPEN'],
    });

    const paymentDueDateStr = payment.dueDate.split('T')[0];
    const match = localInvoices.find((inv) => {
      if (inv.gatewayPaymentId) return false;
      const invDueDateStr = inv.dueDate.toISOString().split('T')[0];
      return invDueDateStr === paymentDueDateStr;
    });

    if (match) {
      this.logger.log(
        `Matching local invoice ${match.id} found for due date ${paymentDueDateStr}. Associating gatewayPaymentId ${payment.id}.`,
      );
      match.setGatewayPaymentId(payment.id);
      if (payment.invoiceUrl) {
        match.setInvoiceUrl(payment.invoiceUrl || null);
      }
      if (match.status === 'DRAFT') {
        match.publish();
      }
      return this.invoiceRepository.save(match);
    }

    // 5. Create new local invoice
    this.logger.log(
      `No matching local invoice found. Creating new local invoice for gateway payment ${payment.id}.`,
    );

    const amountCents = Math.round(payment.value * 100);
    const dueDate = new Date(`${paymentDueDateStr}T12:00:00-03:00`);

    const invoice = Invoice.create({
      subscriptionId: subscription.id,
      storeId: store.id,
      amountCents,
      dueDate,
      periodStart: dueDate,
      periodEnd: dueDate,
      status: 'OPEN',
      gatewayPaymentId: payment.id,
      invoiceUrl: payment.invoiceUrl,
      method: payment.billingType,
    });

    return this.invoiceRepository.save(invoice);
  }
}
