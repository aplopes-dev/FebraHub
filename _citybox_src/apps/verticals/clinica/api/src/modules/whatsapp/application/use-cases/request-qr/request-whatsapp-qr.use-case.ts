import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { WhatsappConnection } from '../../../domain/entities/whatsapp-connection.entity';
import { WhatsappConnectionRepository } from '../../../domain/repositories/whatsapp-connection.repository.interface';
import { WhatsappEventPublisher } from '../../services/whatsapp-event-publisher';

export type RequestWhatsappQrInput = { storeId: string };

@Injectable()
export class RequestWhatsappQrUseCase
  implements IUseCase<RequestWhatsappQrInput, { status: string }>
{
  constructor(
    private readonly connectionRepository: WhatsappConnectionRepository,
    private readonly publisher: WhatsappEventPublisher,
  ) {}

  async execute(
    input: RequestWhatsappQrInput,
  ): Promise<{ status: string }> {
    const existing = await this.connectionRepository.findByStoreId(
      input.storeId,
    );
    const connection =
      existing ??
      WhatsappConnection.create({
        storeId: input.storeId,
        status: 'qr_pending',
      });

    connection.markQrRequested();
    await this.connectionRepository.save(connection);

    await this.publisher.publishSessionStart({ storeId: input.storeId });

    return { status: 'qr_pending' };
  }
}
