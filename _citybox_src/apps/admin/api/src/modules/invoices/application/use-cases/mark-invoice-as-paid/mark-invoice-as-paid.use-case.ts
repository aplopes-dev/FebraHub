import { Injectable, Optional } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { UnitOfWork } from '../../../../../shared/core/unit-of-work';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { Invoice } from '../../../domain/entities/invoice.entity';
import { InvoiceNotFoundError } from '../../../domain/errors/invoice-not-found.error';
import { UnblockStoreUseCase } from '../../../../stores/application/use-cases/unblock-store/unblock-store.use-case';
import { StoreEventsPublisher } from '../../../../../shared/infra/messaging/store-events.publisher';
import { mapStoreToPlatformEvent } from '../../../../../shared/infra/messaging/store-platform-event.mapper';

const BILLING_SYSTEM_ACTOR = 'system:billing';

export interface MarkInvoiceAsPaidDto {
  invoiceId: string;
  method: string;
}

@Injectable()
export class MarkInvoiceAsPaidUseCase implements IUseCase<
  MarkInvoiceAsPaidDto,
  Invoice
> {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly unitOfWork: UnitOfWork,
    @Optional() private readonly unblockStoreUseCase?: UnblockStoreUseCase,
    @Optional() private readonly storeEventsPublisher?: StoreEventsPublisher,
  ) {}

  async execute({ invoiceId, method }: MarkInvoiceAsPaidDto): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundError(MarkInvoiceAsPaidUseCase.name, invoiceId);
    }

    const wasPastDue = invoice.status === 'PAST_DUE';

    invoice.markPaid(method);

    // Fatura paga + loja desbloqueada + evento de reativação commitam juntos: perder o
    // evento aqui deixaria a organização suspensa na vertical mesmo com a dívida quitada.
    await this.unitOfWork.run(async () => {
      await this.invoiceRepository.save(invoice);

      if (wasPastDue && invoice.storeId && this.unblockStoreUseCase) {
        const store = await this.unblockStoreUseCase.execute({
          id: invoice.storeId,
          actor: BILLING_SYSTEM_ACTOR,
        });
        await this.storeEventsPublisher?.publishStoreReactivated(
          mapStoreToPlatformEvent(store),
        );
      }
    });

    return invoice;
  }
}
