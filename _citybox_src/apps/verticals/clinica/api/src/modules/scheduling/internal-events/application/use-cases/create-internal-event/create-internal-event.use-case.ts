import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { InternalEvent } from '../../../domain/entities/internal-event.entity';
import { InternalEventRepository } from '../../../domain/repositories/internal-event.repository.interface';
import type {
  CreateInternalEventDto,
  InternalEventPresentation,
} from '../../dtos/internal-event.dto';
import { toInternalEventPresentation } from '../../dtos/internal-event.dto';
import { normalizeInternalEventRange } from '../../../../shared/domain/internal-event-blocking.utils';
import { DisplaceAppointmentsForCommitmentService } from '../../services/displace-appointments-for-commitment.service';

function parseOptionalDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

@Injectable()
export class CreateInternalEventUseCase implements IUseCase<
  CreateInternalEventDto,
  InternalEventPresentation
> {
  constructor(
    private readonly repository: InternalEventRepository,
    private readonly displaceAppointments: DisplaceAppointmentsForCommitmentService,
  ) {}

  async execute(
    dto: CreateInternalEventDto,
  ): Promise<InternalEventPresentation> {
    const { storeId, input } = dto;
    const allDay = input.allDay ?? false;
    const { startAt, endAt } = normalizeInternalEventRange({
      allDay,
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const title = input.title.trim();

    await this.displaceAppointments.assertNoInProgress({
      context: CreateInternalEventUseCase.name,
      storeId,
      professionalId: input.professionalId,
      rangeStart: startAt,
      rangeEnd: endAt,
    });

    const event = InternalEvent.create({
      storeId,
      professionalId: input.professionalId,
      roomId: input.roomId ?? null,
      title,
      description: input.description?.trim() ?? null,
      allDay,
      startAt,
      endAt,
      recurring: input.recurring ?? false,
      recurrenceType: input.recurrenceType ?? null,
      recurrenceEnd: input.recurrenceEnd ?? null,
      recurrenceEndDate: parseOptionalDateOnly(input.recurrenceEndDate),
      availability: input.availability ?? 'busy',
      privacy: input.privacy ?? 'public',
    });

    const saved = await this.repository.save(event);

    const displacedAppointments = await this.displaceAppointments.displace({
      storeId,
      professionalId: saved.professionalId,
      rangeStart: saved.startAt,
      rangeEnd: saved.endAt,
      commitmentTitle: saved.title,
    });

    return toInternalEventPresentation(saved, displacedAppointments);
  }
}
