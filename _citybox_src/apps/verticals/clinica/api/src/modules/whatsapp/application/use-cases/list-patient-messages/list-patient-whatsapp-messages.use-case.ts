import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { WhatsappMessageRepository } from '../../../domain/repositories/whatsapp-message.repository.interface';
import type {
  WhatsappMessageDirection,
  WhatsappMessageStatus,
} from '../../../domain/whatsapp.types';

export type ListPatientWhatsappMessagesInput = {
  storeId: string;
  patientId: string;
  page?: number;
  perPage?: number;
};

export type PatientWhatsappMessageItem = {
  id: string;
  direction: WhatsappMessageDirection;
  body: string;
  status: WhatsappMessageStatus;
  appointmentId: string | null;
  createdAt: string;
};

@Injectable()
export class ListPatientWhatsappMessagesUseCase
  implements
    IUseCase<
      ListPatientWhatsappMessagesInput,
      {
        items: PatientWhatsappMessageItem[];
        total: number;
        page: number;
        perPage: number;
        totalPages: number;
      }
    >
{
  constructor(
    private readonly messageRepository: WhatsappMessageRepository,
  ) {}

  async execute(input: ListPatientWhatsappMessagesInput) {
    const page = Math.max(1, input.page ?? 1);
    const perPage = Math.min(100, Math.max(1, input.perPage ?? 50));
    const skip = (page - 1) * perPage;

    const { items, total } = await this.messageRepository.listByPatient(
      input.storeId,
      input.patientId,
      { skip, take: perPage },
    );

    return {
      items: items.map((m) => ({
        id: m.id,
        direction: m.direction,
        body: m.body,
        status: m.status,
        appointmentId: m.appointmentId,
        createdAt: m.createdAt.toISOString(),
      })),
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  }
}
