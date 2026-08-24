import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { AppointmentRepository } from '../../../../scheduling/appointments/domain/repositories/appointment.repository.interface';
import {
  filterAppointmentDetails,
  filterRowsByCategory,
  paginateItems,
  resolveAppointmentsPeriodRange,
} from '../../utils/dashboard-appointments.math';
import type {
  DashboardAppointmentDetailItem,
  DashboardAppointmentGroup,
  DashboardAppointmentsPeriodMode,
} from '../../utils/dashboard-appointments.types';

export type ListDashboardAppointmentsDetailsDto = {
  storeId: string;
  group: DashboardAppointmentGroup;
  periodMode: DashboardAppointmentsPeriodMode;
  year: number;
  month?: number;
  categoryId?: string;
  page?: number;
  perPage?: number;
};

export type ListDashboardAppointmentsDetailsResult = {
  items: DashboardAppointmentDetailItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListDashboardAppointmentsDetailsUseCase implements IUseCase<
  ListDashboardAppointmentsDetailsDto,
  ListDashboardAppointmentsDetailsResult
> {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(
    dto: ListDashboardAppointmentsDetailsDto,
  ): Promise<ListDashboardAppointmentsDetailsResult> {
    if (dto.periodMode === 'monthly' && dto.month == null) {
      throw new BadRequestException(
        'month is required when periodMode is monthly',
      );
    }

    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 20;

    const range = resolveAppointmentsPeriodRange({
      periodMode: dto.periodMode,
      year: dto.year,
      month: dto.month,
    });

    const rows =
      await this.appointmentRepository.listAppointmentsForDashboardInRange(
        dto.storeId,
        {
          startAt: range.startAt,
          endAt: range.endAt,
        },
      );

    const filtered = filterRowsByCategory(rows, dto.categoryId);
    const details = filterAppointmentDetails({
      rows: filtered,
      group: dto.group,
    });

    return paginateItems(details, page, perPage);
  }
}
