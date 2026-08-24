import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { AppointmentRepository } from '../../../../scheduling/appointments/domain/repositories/appointment.repository.interface';
import {
  civilDayEndUtc,
  civilDayStartUtc,
} from '../../utils/dashboard-patients.dates';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export type ListDashboardCancelledAppointmentTasksDto = {
  storeId: string;
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

export type DashboardCancelledAppointmentTaskItem = {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  professionalId: string;
  appointmentAt: string;
  durationMin: number;
  categoryId: string | null;
  observations: string | null;
  status: 'missed' | 'cancelled_patient' | 'cancelled_pro';
};

export type ListDashboardCancelledAppointmentTasksResult = {
  items: DashboardCancelledAppointmentTaskItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListDashboardCancelledAppointmentTasksUseCase
  implements
    IUseCase<
      ListDashboardCancelledAppointmentTasksDto,
      ListDashboardCancelledAppointmentTasksResult
    >
{
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(
    dto: ListDashboardCancelledAppointmentTasksDto,
  ): Promise<ListDashboardCancelledAppointmentTasksResult> {
    const startDate = dto.startDate?.trim() ?? '';
    const endDate = dto.endDate?.trim() ?? '';
    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 50;

    if (!DATE_ONLY.test(startDate) || !DATE_ONLY.test(endDate)) {
      throw new BadRequestException(
        'startDate e endDate devem estar no formato yyyy-MM-dd.',
      );
    }
    if (endDate < startDate) {
      throw new BadRequestException(
        'endDate deve ser maior ou igual a startDate.',
      );
    }

    const result =
      await this.appointmentRepository.listCancelledAppointmentTasksInRange(
        dto.storeId,
        {
          startAt: civilDayStartUtc(startDate),
          endAt: civilDayEndUtc(endDate),
        },
        {
          skip: (page - 1) * perPage,
          take: perPage,
        },
      );

    return {
      items: result.items.map((item) => ({
        id: item.id,
        patientId: item.patientId,
        patientName: item.patientName,
        patientPhone: item.patientPhone,
        professionalId: item.professionalId,
        appointmentAt: item.startAt.toISOString(),
        durationMin: item.durationMin,
        categoryId: item.categoryId,
        observations: item.notes,
        status: item.status,
      })),
      total: result.total,
      page,
      perPage,
      totalPages: Math.ceil(result.total / perPage) || 0,
    };
  }
}
