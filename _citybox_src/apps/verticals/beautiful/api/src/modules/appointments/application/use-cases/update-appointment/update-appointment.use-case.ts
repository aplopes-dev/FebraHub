import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import {
  MemberRepository,
  memberDisplayName,
} from '../../../../tenancy/domain/repositories/member.repository';
import {
  buildWeekScheduleFromRows,
  type WeekSchedule,
} from '../../../../../shared/domain/work-schedule/work-schedule.types';
import { ServiceRepository } from '../../../../services/domain/repositories/service.repository.interface';
import { AppointmentEntity } from '../../../domain/entities/appointment.entity';
import { AppointmentNotEditableError } from '../../../domain/errors/appointment-not-editable.error';
import { AppointmentNotFoundError } from '../../../domain/errors/appointment-not-found.error';
import { AppointmentSlotTakenError } from '../../../domain/errors/appointment-slot-taken.error';
import { ProfessionalOutsideWorkScheduleError } from '../../../domain/errors/professional-outside-work-schedule.error';
import { ReferencedProfessionalNotFoundError } from '../../../domain/errors/referenced-professional-not-found.error';
import { ReferencedServiceNotFoundError } from '../../../domain/errors/referenced-service-not-found.error';
import { AppointmentCategoryRepository } from '../../../../appointment-categories/domain/repositories/appointment-category.repository.interface';
import { ReferencedAppointmentCategoryNotFoundError } from '../../../domain/errors/referenced-appointment-category-not-found.error';
import { AppointmentRepository } from '../../../domain/repositories/appointment.repository.interface';
import type { AppointmentStatus } from '../../../domain/appointment.types';
import {
  buildOccupancyWindows,
  isRangeWithinWorkIntervals,
  weekdayIdFromDate,
} from '../../utils/appointment-availability';
import { addMinutes, parseWallClock, toIsoDate } from '../../utils/appointment-datetime';

const NON_EDITABLE_STATUSES: AppointmentStatus[] = [
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

export type UpdateAppointmentServiceInput = {
  professionalId: string;
  serviceId: string;
};

export interface UpdateAppointmentInput {
  storeId: string;
  id: string;
  clientNotes?: string | null;
  categoryId?: string | null;
  date: string;
  startTime: string;
  services: UpdateAppointmentServiceInput[];
}

import { FinancialEntryRepository } from '../../../../financial/entries/domain/repositories/financial-entry.repository.interface';
import { parseIsoDateOnly } from '../../../../financial/entries/application/utils/financial-entry.utils';

@Injectable()
export class UpdateAppointmentUseCase implements IUseCase<
  UpdateAppointmentInput,
  AppointmentEntity
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly members: MemberRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly appointmentCategoryRepository: AppointmentCategoryRepository,
    private readonly financialEntryRepository?: FinancialEntryRepository,
  ) {}

  async execute(input: UpdateAppointmentInput): Promise<AppointmentEntity> {
    if (!input.services?.length) {
      throw new ValidatorDomainError({
        internalMessage:
          'UpdateAppointment requires at least one service line.',
        externalMessage: 'Informe ao menos um serviço no agendamento.',
        context: 'Appointments',
      });
    }

    const appointment = await this.appointmentRepository.findById(
      input.storeId,
      input.id,
    );
    if (!appointment) {
      throw new AppointmentNotFoundError(input.id);
    }

    if (NON_EDITABLE_STATUSES.includes(appointment.status)) {
      throw new AppointmentNotEditableError(appointment.id, appointment.status);
    }

    const professionalIds = [
      ...new Set(input.services.map((s) => s.professionalId)),
    ];
    const professionals = await this.members.findSchedulableByIds(
      input.storeId,
      professionalIds,
    );
    if (professionals.length !== professionalIds.length) {
      const found = new Set(professionals.map((p) => p.id));
      const missing = professionalIds.filter((id) => !found.has(id));
      throw new ReferencedProfessionalNotFoundError(missing);
    }
    const professionalById = new Map(professionals.map((p) => [p.id, p]));

    const serviceIds = [...new Set(input.services.map((s) => s.serviceId))];
    const fetchedServices = await Promise.all(
      serviceIds.map((id) =>
        this.serviceRepository.findById(input.storeId, id),
      ),
    );
    const missingServiceIds = serviceIds.filter(
      (_, index) => !fetchedServices[index],
    );
    if (missingServiceIds.length > 0) {
      throw new ReferencedServiceNotFoundError(missingServiceIds);
    }
    const serviceById = new Map(
      fetchedServices.map((service) => [service!.id, service!]),
    );

    const lines = input.services.map((line) => {
      const service = serviceById.get(line.serviceId)!;
      const professional = professionalById.get(line.professionalId)!;
      return {
        professionalId: professional.id,
        professionalName: memberDisplayName(professional),
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        duration: service.durationMinutes,
      };
    });

    const totalDuration = lines.reduce((sum, line) => sum + line.duration, 0);
    const totalPrice = lines.reduce((sum, line) => sum + line.price, 0);
    const startAt = parseWallClock(input.date, input.startTime);
    const endAt = addMinutes(startAt, totalDuration);

    const weekByProfessional = await this.loadWeeks(professionalIds);
    await this.assertProfessionalsAvailable(
      input.storeId,
      appointment.id,
      lines,
      startAt,
      weekByProfessional,
    );

    const clientNotes =
      input.clientNotes === undefined
        ? appointment.clientNotes
        : input.clientNotes?.trim()
          ? input.clientNotes.trim()
          : null;

    let categoryFields: {
      categoryId?: string | null;
      categoryName?: string | null;
      categoryColor?: string | null;
    } = {};
    if (input.categoryId !== undefined) {
      const category = await this.resolveCategory(
        input.storeId,
        input.categoryId,
      );
      categoryFields = {
        categoryId: category?.id ?? null,
        categoryName: category?.name ?? null,
        categoryColor: category?.color ?? null,
      };
    }

    appointment.updateDetails({
      clientNotes,
      ...categoryFields,
      startAt,
      endAt,
      totalPrice,
      services: lines,
    });

    await this.appointmentRepository.save(appointment);

    if (this.financialEntryRepository) {
      const entry = await this.financialEntryRepository.findByAppointmentId(
        input.storeId,
        appointment.id,
      );
      if (entry && entry.status === 'pending') {
        const valueCents = Math.max(0, Math.round(totalPrice * 100));
        const dueDate = parseIsoDateOnly(toIsoDate(startAt));
        const serviceNames =
          lines
            .map((n) => n.serviceName?.trim())
            .filter(Boolean)
            .join(', ') || 'Serviços';
        const clientName = appointment.clientName?.trim();
        const description = clientName
          ? `${clientName} - ${serviceNames}`
          : `${serviceNames}`;

        await this.financialEntryRepository.save(
          entry.withManualUpdate({
            valueCents,
            dueDate,
            description,
          }),
        );
      }
    }

    return appointment;
  }

  private async resolveCategory(storeId: string, categoryId?: string | null) {
    const id = categoryId?.trim() || null;
    if (!id) return null;
    const category = await this.appointmentCategoryRepository.findById(
      storeId,
      id,
    );
    if (!category) throw new ReferencedAppointmentCategoryNotFoundError(id);
    return category;
  }

  private async loadWeeks(
    professionalIds: string[],
  ): Promise<Map<string, WeekSchedule>> {
    const allRows = await Promise.all(
      professionalIds.map((id) => this.members.findWorkIntervals(id)),
    );
    const weekByProfessional = new Map<string, WeekSchedule>();
    professionalIds.forEach((id, index) => {
      weekByProfessional.set(id, buildWeekScheduleFromRows(allRows[index]));
    });
    return weekByProfessional;
  }

  private async assertProfessionalsAvailable(
    storeId: string,
    appointmentId: string,
    lines: Array<{ professionalId: string; duration: number }>,
    appointmentStart: Date,
    weekByProfessional: Map<string, WeekSchedule>,
  ): Promise<void> {
    const windows = buildOccupancyWindows(appointmentStart, lines, addMinutes);

    for (const window of windows) {
      const week = weekByProfessional.get(window.professionalId)!;
      const weekday = weekdayIdFromDate(window.startAt);
      const intervals = week[weekday];

      if (
        !isRangeWithinWorkIntervals(window.startAt, window.endAt, intervals)
      ) {
        throw new ProfessionalOutsideWorkScheduleError(window.professionalId);
      }

      const overlap = await this.appointmentRepository.hasOverlap(
        storeId,
        window.professionalId,
        window.startAt,
        window.endAt,
        appointmentId,
      );
      if (overlap) {
        throw new AppointmentSlotTakenError(window.professionalId);
      }
    }
  }
}
