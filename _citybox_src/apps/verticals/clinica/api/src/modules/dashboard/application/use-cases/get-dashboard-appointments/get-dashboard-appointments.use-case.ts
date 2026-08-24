import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { AppointmentRepository } from '../../../../scheduling/appointments/domain/repositories/appointment.repository.interface';
import { AppointmentCategoryRepository } from '../../../../scheduling/appointment-categories/domain/repositories/appointment-category.repository.interface';
import {
  buildAppointmentsTimeline,
  filterRowsByCategory,
  resolveAppointmentsPeriodRange,
  summarizeAppointments,
} from '../../utils/dashboard-appointments.math';
import type {
  DashboardAppointmentCategoryItem,
  DashboardAppointmentsPeriodMode,
  DashboardAppointmentsSummary,
  DashboardAppointmentsTimelinePoint,
} from '../../utils/dashboard-appointments.types';

export type GetDashboardAppointmentsDto = {
  storeId: string;
  periodMode: DashboardAppointmentsPeriodMode;
  year: number;
  month?: number;
  categoryId?: string;
};

export type GetDashboardAppointmentsResult = {
  summary: DashboardAppointmentsSummary;
  timeline: DashboardAppointmentsTimelinePoint[];
  categories: DashboardAppointmentCategoryItem[];
  years: number[];
};

@Injectable()
export class GetDashboardAppointmentsUseCase implements IUseCase<
  GetDashboardAppointmentsDto,
  GetDashboardAppointmentsResult
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly appointmentCategoryRepository: AppointmentCategoryRepository,
  ) {}

  async execute(
    dto: GetDashboardAppointmentsDto,
  ): Promise<GetDashboardAppointmentsResult> {
    if (dto.periodMode === 'monthly' && dto.month == null) {
      throw new BadRequestException(
        'month is required when periodMode is monthly',
      );
    }

    const range = resolveAppointmentsPeriodRange({
      periodMode: dto.periodMode,
      year: dto.year,
      month: dto.month,
    });

    const [rows, years, categoryItems] = await Promise.all([
      this.appointmentRepository.listAppointmentsForDashboardInRange(
        dto.storeId,
        {
          startAt: range.startAt,
          endAt: range.endAt,
        },
      ),
      this.appointmentRepository.listAppointmentDashboardYears(dto.storeId),
      this.appointmentCategoryRepository.findMany(dto.storeId, {
        skip: 0,
        take: 500,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
    ]);

    const filtered = filterRowsByCategory(rows, dto.categoryId);
    const summary = summarizeAppointments(filtered);
    const timeline = buildAppointmentsTimeline({
      rows: filtered,
      periodMode: dto.periodMode,
      year: dto.year,
      month: dto.month,
    });

    const categories: DashboardAppointmentCategoryItem[] = categoryItems.map(
      (item) => ({
        id: item.category.id,
        name: item.category.name,
        color: item.category.color,
      }),
    );

    return { summary, timeline, categories, years };
  }
}
