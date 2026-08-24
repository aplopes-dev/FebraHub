import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import {
  InternalEventNotFoundError,
  InternalEventRepository,
} from '../../../domain/repositories/internal-event.repository.interface';
import type {
  UpdateInternalEventDto,
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
export class UpdateInternalEventUseCase implements IUseCase<
  UpdateInternalEventDto,
  InternalEventPresentation
> {
  constructor(
    private readonly repository: InternalEventRepository,
    private readonly displaceAppointments: DisplaceAppointmentsForCommitmentService,
  ) {}

  async execute(
    dto: UpdateInternalEventDto,
  ): Promise<InternalEventPresentation> {
    const event = await this.repository.findById(dto.storeId, dto.id);
    if (!event) {
      throw new InternalEventNotFoundError(
        UpdateInternalEventUseCase.name,
        dto.id,
      );
    }

    const { input } = dto;
    const allDay = input.allDay ?? event.allDay;
    const shouldNormalizeRange =
      input.allDay !== undefined ||
      input.startDate !== undefined ||
      input.endDate !== undefined;

    const normalizedRange = shouldNormalizeRange
      ? normalizeInternalEventRange({
          allDay,
          startDate: input.startDate ?? event.startAt.toISOString(),
          endDate: input.endDate ?? event.endAt.toISOString(),
        })
      : null;

    const nextStartAt = normalizedRange?.startAt ?? event.startAt;
    const nextEndAt = normalizedRange?.endAt ?? event.endAt;
    const nextProfessionalId = event.professionalId;
    const nextTitle =
      input.title !== undefined ? input.title.trim() : event.title;

    await this.displaceAppointments.assertNoInProgress({
      context: UpdateInternalEventUseCase.name,
      storeId: dto.storeId,
      professionalId: nextProfessionalId,
      rangeStart: nextStartAt,
      rangeEnd: nextEndAt,
    });

    event.update({
      roomId: input.roomId,
      title: input.title,
      description: input.description,
      allDay: input.allDay,
      startAt: normalizedRange?.startAt,
      endAt: normalizedRange?.endAt,
      recurring: input.recurring,
      recurrenceType: input.recurrenceType,
      recurrenceEnd: input.recurrenceEnd,
      recurrenceEndDate:
        input.recurrenceEndDate !== undefined
          ? parseOptionalDateOnly(input.recurrenceEndDate)
          : undefined,
      availability: input.availability,
      privacy: input.privacy,
    });

    const saved = await this.repository.save(event);

    const displacedAppointments = await this.displaceAppointments.displace({
      storeId: dto.storeId,
      professionalId: saved.professionalId,
      rangeStart: saved.startAt,
      rangeEnd: saved.endAt,
      commitmentTitle: nextTitle || saved.title,
    });

    return toInternalEventPresentation(saved, displacedAppointments);
  }
}
