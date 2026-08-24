import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { WhatsappConnectionRepository } from '../../../domain/repositories/whatsapp-connection.repository.interface';
import { WhatsappEventPublisher } from '../../services/whatsapp-event-publisher';

export type DisconnectWhatsappSessionInput = { storeId: string };

@Injectable()
export class DisconnectWhatsappSessionUseCase
  implements IUseCase<DisconnectWhatsappSessionInput, void>
{
  constructor(
    private readonly connectionRepository: WhatsappConnectionRepository,
    private readonly publisher: WhatsappEventPublisher,
  ) {}

  async execute(input: DisconnectWhatsappSessionInput): Promise<void> {
    await this.publisher.publishSessionStop({ storeId: input.storeId });
    await this.connectionRepository.upsertStatus(input.storeId, {
      status: 'disconnected',
      qrBase64: null,
      phoneE164: null,
      lastError: null,
    });
  }
}
