import { Inject, Injectable } from '@nestjs/common';
import type { ProviderType } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { calculatePaymentAmounts } from './payment-fees.util.js';

@Injectable()
export class PaymentEntriesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async recordCapture(input: {
    tenantId: string;
    paymentId: string;
    chargeId: string;
    provider: ProviderType;
    grossAmount: number;
    providerReference?: string;
    occurredAt?: Date;
  }) {
    const existing = await this.prisma.db.paymentEntry.findFirst({
      where: { paymentId: input.paymentId, entryType: 'CAPTURE' },
    });
    if (existing) return existing;

    const amounts = calculatePaymentAmounts(input.grossAmount, input.provider);
    const occurredAt = input.occurredAt ?? new Date();

    await this.prisma.db.payment.update({
      where: { id: input.paymentId },
      data: {
        grossAmount: amounts.grossAmount,
        feeAmount: amounts.feeAmount,
        netAmount: amounts.netAmount,
      },
    });

    return this.prisma.db.paymentEntry.create({
      data: {
        tenantId: input.tenantId,
        paymentId: input.paymentId,
        chargeId: input.chargeId,
        provider: input.provider,
        entryType: 'CAPTURE',
        grossAmount: amounts.grossAmount,
        feeAmount: amounts.feeAmount,
        netAmount: amounts.netAmount,
        providerReference: input.providerReference,
        occurredAt,
      },
    });
  }
}
