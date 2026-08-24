import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { WhatsappConnection } from '../../../domain/entities/whatsapp-connection.entity';
import { WhatsappConnectionRepository } from '../../../domain/repositories/whatsapp-connection.repository.interface';

export type GetWhatsappSessionInput = { storeId: string };

export type GetWhatsappSessionResult = {
  status: string;
  phoneE164: string | null;
  lastError: string | null;
  qrBase64: string | null;
  updatedAt: string;
};

@Injectable()
export class GetWhatsappSessionUseCase
  implements IUseCase<GetWhatsappSessionInput, GetWhatsappSessionResult>
{
  constructor(
    private readonly connectionRepository: WhatsappConnectionRepository,
  ) {}

  async execute(
    input: GetWhatsappSessionInput,
  ): Promise<GetWhatsappSessionResult> {
    const connection =
      (await this.connectionRepository.findByStoreId(input.storeId)) ??
      WhatsappConnection.create({ storeId: input.storeId });

    return {
      status: connection.status,
      phoneE164: connection.phoneE164,
      lastError: connection.lastError,
      qrBase64:
        connection.status === 'qr_pending' ? connection.qrBase64 : null,
      updatedAt: connection.updatedAt.toISOString(),
    };
  }
}
