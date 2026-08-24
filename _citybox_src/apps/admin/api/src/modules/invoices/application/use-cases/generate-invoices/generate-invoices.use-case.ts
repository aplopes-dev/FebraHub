import { Injectable, Logger, Optional } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { UnitOfWork } from '../../../../../shared/core/unit-of-work';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { SubscriptionRepository } from '../../../../subscriptions/domain/repositories/subscription.repository.interface';
import { Invoice } from '../../../domain/entities/invoice.entity';
import { BlockStoreUseCase } from '../../../../stores/application/use-cases/block-store/block-store.use-case';
import { StoreEventsPublisher } from '../../../../../shared/infra/messaging/store-events.publisher';
import { mapStoreToPlatformEvent } from '../../../../../shared/infra/messaging/store-platform-event.mapper';

const BILLING_SYSTEM_ACTOR = 'system:billing';

export interface GenerateInvoicesDto {
  referenceDate?: string;
}

export interface GenerateInvoicesResult {
  generatedCount: number;
  skippedCount: number;
}

@Injectable()
export class GenerateInvoicesUseCase implements IUseCase<
  GenerateInvoicesDto,
  GenerateInvoicesResult
> {
  private readonly logger = new Logger(GenerateInvoicesUseCase.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly unitOfWork: UnitOfWork,
    @Optional() private readonly blockStoreUseCase?: BlockStoreUseCase,
    @Optional() private readonly storeEventsPublisher?: StoreEventsPublisher,
  ) {}

  async execute(dto?: GenerateInvoicesDto): Promise<GenerateInvoicesResult> {
    this.logger.log('Starting invoice generation job...');

    const refDate = dto?.referenceDate
      ? new Date(dto.referenceDate)
      : new Date();
    const startOfPeriod = new Date(
      refDate.getFullYear(),
      refDate.getMonth(),
      refDate.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfPeriod = new Date(
      refDate.getFullYear(),
      refDate.getMonth(),
      refDate.getDate(),
      23,
      59,
      59,
      999,
    );

    this.logger.log(
      `Filtering subscriptions with cycle starting between ${startOfPeriod.toISOString()} and ${endOfPeriod.toISOString()}`,
    );

    // Find subscriptions starting their cycle in this window (ACTIVE, TRIALING, PAST_DUE)
    const subscriptions = await this.subscriptionRepository.findAll({
      status: ['ACTIVE', 'TRIALING', 'PAST_DUE'],
      periodStartFrom: startOfPeriod,
      periodStartTo: endOfPeriod,
    });

    let generatedCount = 0;
    let skippedCount = 0;

    for (const sub of subscriptions) {
      try {
        // Check if an invoice has already been generated for this subscription's current period
        const existingInvoice =
          await this.invoiceRepository.findBySubscriptionAndPeriod(
            sub.id,
            sub.currentPeriodStart,
            sub.currentPeriodEnd,
          );

        if (existingInvoice) {
          this.logger.debug(
            `Invoice already exists for subscription ${sub.id} in period ${sub.currentPeriodStart.toISOString()} - ${sub.currentPeriodEnd.toISOString()}`,
          );
          skippedCount++;
          continue;
        }

        // Create new invoice for the subscription's current period
        const amountCents = sub.priceCents ?? 0;

        const invoice = Invoice.create({
          subscriptionId: sub.id,
          storeId: sub.storeId,
          amountCents,
          currency: 'BRL',
          status: 'DRAFT',
          dueDate: sub.currentPeriodStart,
          periodStart: sub.currentPeriodStart,
          periodEnd: sub.currentPeriodEnd,
        });

        // Transition from DRAFT to OPEN
        invoice.publish();

        await this.invoiceRepository.save(invoice);

        this.logger.log(
          `Generated invoice ${invoice.id} for subscription ${sub.id} (amount: ${amountCents} cents)`,
        );
        generatedCount++;
      } catch (error) {
        const err = error as Error;
        this.logger.error(
          `Failed to generate invoice for subscription ${sub.id}: ${err.message}`,
          err.stack,
        );
      }
    }

    this.logger.log(
      `Invoice generation job finished. Generated: ${generatedCount}, Skipped: ${skippedCount}`,
    );

    await this.suspendStoresWithOverdueInvoices();

    return {
      generatedCount,
      skippedCount,
    };
  }

  /** FR-013/US4: fatura `OPEN` que passou do vencimento vira `PAST_DUE` e suspende a loja. */
  private async suspendStoresWithOverdueInvoices(): Promise<void> {
    if (!this.blockStoreUseCase) return;

    const openInvoices = await this.invoiceRepository.findAll({
      status: ['OPEN'],
    });

    for (const invoice of openInvoices) {
      if (!invoice.checkPastDue()) continue;

      // Fatura PAST_DUE + loja bloqueada + evento de suspensão commitam juntos.
      // Suspender sem emitir o evento deixaria a vertical liberando acesso a um
      // inadimplente — o enforcement lá é local, baseado só neste evento.
      await this.unitOfWork.run(async () => {
        await this.invoiceRepository.save(invoice);

        if (invoice.storeId) {
          const store = await this.blockStoreUseCase!.execute({
            id: invoice.storeId,
            actor: BILLING_SYSTEM_ACTOR,
          });
          await this.storeEventsPublisher?.publishStoreSuspended(
            mapStoreToPlatformEvent(store, undefined, {
              reason: 'invoice_past_due',
            }),
          );
        }
      });
    }
  }
}
