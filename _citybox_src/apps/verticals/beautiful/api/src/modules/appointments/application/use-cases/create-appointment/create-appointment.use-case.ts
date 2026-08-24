import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { ClientEntity } from '../../../../clients/domain/entities/client.entity';
import { ClientNotFoundError } from '../../../../clients/domain/errors/client-not-found.error';
import { ClientRepository } from '../../../../clients/domain/repositories/client.repository.interface';
import {
  MemberRepository,
  memberDisplayName,
} from '../../../../tenancy/domain/repositories/member.repository';
import {
  buildWeekScheduleFromRows,
  type WeekSchedule,
} from '../../../../../shared/domain/work-schedule/work-schedule.types';
import { ServiceRepository } from '../../../../services/domain/repositories/service.repository.interface';
import type { AppointmentStatus } from '../../../domain/appointment.types';
import { AppointmentEntity } from '../../../domain/entities/appointment.entity';
import { AppointmentSlotTakenError } from '../../../domain/errors/appointment-slot-taken.error';
import { ProfessionalOutsideWorkScheduleError } from '../../../domain/errors/professional-outside-work-schedule.error';
import { ReferencedProfessionalNotFoundError } from '../../../domain/errors/referenced-professional-not-found.error';
import { ReferencedServiceNotFoundError } from '../../../domain/errors/referenced-service-not-found.error';
import { AppointmentCategoryRepository } from '../../../../appointment-categories/domain/repositories/appointment-category.repository.interface';
import { ReferencedAppointmentCategoryNotFoundError } from '../../../domain/errors/referenced-appointment-category-not-found.error';
import { AppointmentRepository } from '../../../domain/repositories/appointment.repository.interface';
import {
  buildOccupancyWindows,
  isRangeWithinWorkIntervals,
  weekdayIdFromDate,
} from '../../utils/appointment-availability';
import { addMinutes, parseWallClock, toIsoDate } from '../../utils/appointment-datetime';

export type CreateAppointmentServiceInput = {
  /** Member.id do profissional agendável. */
  professionalId: string;
  serviceId: string;
};

export type CreateAppointmentNewClientInput = {
  name: string;
  phone: string;
};

export interface CreateAppointmentInput {
  storeId: string;
  clientId?: string;
  newClient?: CreateAppointmentNewClientInput;
  categoryId?: string | null;
  clientNotes?: string;
  date: string;
  startTime: string;
  status?: AppointmentStatus;
  services: CreateAppointmentServiceInput[];
}

import { GenerateFinancialEntryOnAppointmentCompleteService } from '../../../../financial/entries/application/services/generate-financial-entry-on-appointment-complete.service';
import { FinancialEntryRepository } from '../../../../financial/entries/domain/repositories/financial-entry.repository.interface';

@Injectable()
export class CreateAppointmentUseCase implements IUseCase<
  CreateAppointmentInput,
  AppointmentEntity
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly clientRepository: ClientRepository,
    private readonly members: MemberRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly appointmentCategoryRepository: AppointmentCategoryRepository,
    private readonly generateFinancialEntryOnComplete?: GenerateFinancialEntryOnAppointmentCompleteService,
    private readonly financialEntryRepository?: FinancialEntryRepository,
  ) {}

  async execute(input: CreateAppointmentInput): Promise<AppointmentEntity> {
    if (!input.services?.length) {
      throw new ValidatorDomainError({
        internalMessage:
          'CreateAppointment requires at least one service line.',
        externalMessage: 'Informe ao menos um serviço no agendamento.',
        context: 'Appointments',
      });
    }

    const hasClientId = Boolean(input.clientId?.trim());
    const hasNewClient = Boolean(input.newClient);
    if (hasClientId === hasNewClient) {
      throw new ValidatorDomainError({
        internalMessage:
          'CreateAppointment requires exactly one of clientId or newClient.',
        externalMessage:
          'Informe um cliente cadastrado ou os dados de um cliente novo.',
        context: 'Appointments',
      });
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
      lines,
      startAt,
      weekByProfessional,
    );

    const client = await this.resolveClient(input);
    const category = await this.resolveCategory(
      input.storeId,
      input.categoryId,
    );

    const appointment = AppointmentEntity.create({
      storeId: input.storeId,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      categoryId: category?.id ?? null,
      categoryName: category?.name ?? null,
      categoryColor: category?.color ?? null,
      clientNotes: input.clientNotes?.trim() || null,
      startAt,
      endAt,
      status: input.status ?? 'SCHEDULED',
      totalPrice,
      services: lines,
    });

    await this.appointmentRepository.save(appointment);

    if (this.generateFinancialEntryOnComplete) {
      const entry = await this.generateFinancialEntryOnComplete.execute({
        storeId: appointment.storeId,
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        clientName: appointment.clientName,
        totalPriceBrl: appointment.totalPrice,
        dueDateIso: toIsoDate(appointment.startAt),
        serviceNames: appointment.services.map(
          (line) => line.serviceName ?? 'Serviço',
        ),
      });

      if (appointment.status === 'CANCELLED' && entry && this.financialEntryRepository) {
        await this.financialEntryRepository.save(entry.withCancelled());
      }
    }

    return appointment;
  }

  private async resolveClient(
    input: CreateAppointmentInput,
  ): Promise<ClientEntity> {
    if (input.newClient) {
      const client = ClientEntity.create({
        storeId: input.storeId,
        name: input.newClient.name.trim(),
        phone: input.newClient.phone.trim(),
      });
      await this.clientRepository.save(client);
      return client;
    }

    const client = await this.clientRepository.findById(
      input.storeId,
      input.clientId!,
    );
    if (!client) {
      throw new ClientNotFoundError(input.clientId!);
    }
    return client;
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
      );
      if (overlap) {
        throw new AppointmentSlotTakenError(window.professionalId);
      }
    }
  }
}
