import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { SubscriptionRepository } from '../../../../subscriptions/domain/repositories/subscription.repository.interface';
import { Subscription } from '../../../../subscriptions/domain/entities/subscription.entity';
import { StoreRepository } from '../../../../stores/domain/repositories/store.repository.interface';
import { Invoice } from '../../../domain/entities/invoice.entity';
import { generateManualInvoice } from '../../../../subscriptions/application/utils/generate-upfront-invoices';
import { StoreNotFoundError } from '../../../../stores/domain/errors/store-not-found.error';
import { SubscriptionNotFoundError } from '../../../../subscriptions/domain/errors/subscription-not-found.error';
import {
  PAYMENT_GATEWAY,
  PaymentGateway,
} from '../../../../payment-gateway/domain/providers/payment-gateway.interface';
import { PaymentMethod } from '../../../../payment-gateway/domain/enums/payment-method.enum';
import type { CreateManualInvoiceDto } from './create-manual-invoice.dto';

@Injectable()
export class CreateManualInvoiceUseCase implements IUseCase<
  CreateManualInvoiceDto,
  Invoice
> {
  private readonly logger = new Logger(CreateManualInvoiceUseCase.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly storeRepository: StoreRepository,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async execute(dto: CreateManualInvoiceDto): Promise<Invoice> {
    const store = await this.storeRepository.findById(dto.storeId);
    if (!store) {
      throw new StoreNotFoundError(
        CreateManualInvoiceUseCase.name,
        dto.storeId,
      );
    }

    let subscription: Subscription | null = null;
    if (dto.subscriptionId) {
      subscription = await this.subscriptionRepository.findById(
        dto.subscriptionId,
      );
    } else {
      subscription = await this.subscriptionRepository.findActiveByStoreId(
        dto.storeId,
      );
    }

    if (!subscription) {
      throw new SubscriptionNotFoundError(
        CreateManualInvoiceUseCase.name,
        dto.subscriptionId || `active for store ${dto.storeId}`,
      );
    }

    // Parseia strings "YYYY-MM-DD" para data local de forma segura contra timezone offsets
    const pStart = new Date(`${dto.periodStart}T00:00:00`);
    const pEnd = new Date(`${dto.periodEnd}T23:59:59.999`);

    const invoice = generateManualInvoice({
      subscriptionId: subscription.id,
      storeId: store.id,
      amountCents: dto.amountCents,
      periodStart: pStart,
      periodEnd: pEnd,
      dayOfMonth: subscription.dayOfMonth,
      referenceDate: new Date(),
      notes: dto.notes,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Registra a cobrança avulsa no Asaas (se a loja já tiver customer no PSP).
    // Quando não tem, a fatura fica só local — o registro no PSP acontece no primeiro
    // faturamento que criar o customer.
    if (store.gatewayCustomerId) {
      try {
        const gatewayInvoice = await this.paymentGateway.createInvoice({
          gatewayCustomerId: store.gatewayCustomerId,
          value: dto.amountCents / 100,
          billingType: PaymentMethod.UNDEFINED,
          dueDate: savedInvoice.dueDate,
          description:
            dto.notes || `Fatura manual - ${subscription.planName ?? 'Plano'}`,
        });

        let localStatus: 'DRAFT' | 'OPEN' | 'PAID' | 'PAST_DUE' | 'VOID' =
          'OPEN';
        if (String(gatewayInvoice.status) === 'PAID') {
          localStatus = 'PAID';
        } else if (String(gatewayInvoice.status) === 'OVERDUE') {
          localStatus = 'PAST_DUE';
        } else if (
          String(gatewayInvoice.status) === 'CANCELLED' ||
          String(gatewayInvoice.status) === 'REFUNDED'
        ) {
          localStatus = 'VOID';
        }

        savedInvoice.setGatewayPaymentId(gatewayInvoice.gatewayPaymentId);
        if (gatewayInvoice.invoiceUrl) {
          savedInvoice.setInvoiceUrl(gatewayInvoice.invoiceUrl || null);
        }

        if (localStatus === 'PAID') {
          savedInvoice.markPaid(gatewayInvoice.billingType);
        }

        await this.invoiceRepository.save(savedInvoice);

        this.logger.log(
          `Cobrança avulsa ${savedInvoice.id} registrada no Asaas com gatewayPaymentId ${gatewayInvoice.gatewayPaymentId}`,
        );
      } catch (error) {
        const err = error as Error;
        this.logger.error(
          `Erro ao registrar fatura ${savedInvoice.id} no Asaas: ${err.message}`,
          err.stack,
        );
      }
    }

    return savedInvoice;
  }
}
