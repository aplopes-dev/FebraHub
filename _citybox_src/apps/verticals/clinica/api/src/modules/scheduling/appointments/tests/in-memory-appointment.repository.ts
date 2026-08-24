import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  BLOCKING_APPOINTMENT_STATUSES,
  TERMINAL_APPOINTMENT_STATUSES,
} from '../../shared/domain/appointment-types';
import { Appointment } from '../domain/entities/appointment.entity';
import {
  AppointmentRepository,
  type AppointmentCalendarCriteria,
  type AppointmentDashboardListItem,
  type AppointmentDetail,
  type AppointmentListCriteria,
  type CancelledAppointmentTasksListResult,
  type SaveAppointmentOptions,
} from '../domain/repositories/appointment.repository.interface';

const CANCELLED_TASK_STATUSES = [
  'missed',
  'cancelled_patient',
  'cancelled_pro',
] as const;

/* In-memory stubs implement async interfaces without I/O. */
/* eslint-disable @typescript-eslint/require-await */

@Injectable()
export class InMemoryAppointmentRepository extends AppointmentRepository {
  private readonly rows = new Map<string, AppointmentDetail>();

  seed(detail: AppointmentDetail): void {
    this.rows.set(detail.appointment.id, detail);
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<AppointmentDetail | null> {
    const row = this.rows.get(id);
    return row && row.appointment.storeId === storeId ? row : null;
  }

  async findMany(
    storeId: string,
    criteria: AppointmentListCriteria,
  ): Promise<AppointmentDetail[]> {
    return [...this.rows.values()]
      .filter((row) => row.appointment.storeId === storeId)
      .filter((row) => {
        if (
          criteria.patientId &&
          row.appointment.patientId !== criteria.patientId
        ) {
          return false;
        }
        if (criteria.status && row.appointment.status !== criteria.status) {
          return false;
        }
        if (criteria.professionalIds?.length) {
          if (
            !criteria.professionalIds.includes(row.appointment.professionalId)
          ) {
            return false;
          }
        }
        if (criteria.search) {
          const term = criteria.search.toLowerCase();
          if (!row.patientName.toLowerCase().includes(term)) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          a.appointment.startAt.getTime() - b.appointment.startAt.getTime(),
      )
      .slice(criteria.skip, criteria.skip + criteria.take);
  }

  async count(
    storeId: string,
    criteria: Omit<AppointmentListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    const items = await this.findMany(storeId, {
      ...criteria,
      skip: 0,
      take: Number.MAX_SAFE_INTEGER,
    });
    return items.length;
  }

  async findForCalendar(
    storeId: string,
    criteria: AppointmentCalendarCriteria,
  ): Promise<AppointmentDetail[]> {
    const rangeStart = new Date(`${criteria.startDate}T00:00:00.000Z`);
    const rangeEnd = new Date(`${criteria.endDate}T23:59:59.999Z`);
    return [...this.rows.values()].filter((row) => {
      if (row.appointment.storeId !== storeId) return false;
      if (criteria.professionalIds?.length) {
        if (
          !criteria.professionalIds.includes(row.appointment.professionalId)
        ) {
          return false;
        }
      }
      return (
        row.appointment.startAt < rangeEnd && row.appointment.endAt > rangeStart
      );
    });
  }

  async findBlockingByProfessionalAndRange(
    storeId: string,
    professionalId: string,
    rangeStart: Date,
    rangeEnd: Date,
    excludeAppointmentId?: string,
  ): Promise<Appointment[]> {
    return [...this.rows.values()]
      .map((row) => row.appointment)
      .filter((appointment) => {
        if (appointment.storeId !== storeId) return false;
        if (appointment.professionalId !== professionalId) return false;
        if (excludeAppointmentId && appointment.id === excludeAppointmentId) {
          return false;
        }
        if (!BLOCKING_APPOINTMENT_STATUSES.includes(appointment.status)) {
          return false;
        }
        return appointment.startAt < rangeEnd && appointment.endAt > rangeStart;
      });
  }

  async hasOverlap(
    storeId: string,
    professionalId: string,
    startAt: Date,
    endAt: Date,
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    const blocking = await this.findBlockingByProfessionalAndRange(
      storeId,
      professionalId,
      startAt,
      endAt,
      excludeAppointmentId,
    );
    return blocking.length > 0;
  }

  async save(
    appointment: Appointment,
    options?: SaveAppointmentOptions,
  ): Promise<AppointmentDetail> {
    void options;
    const id = appointment.id || randomUUID();
    const existing = this.rows.get(id);
    const detail: AppointmentDetail = {
      appointment: Appointment.with(
        {
          storeId: appointment.storeId,
          patientId: appointment.patientId,
          professionalId: appointment.professionalId,
          procedureId: appointment.procedureId,
          roomId: appointment.roomId,
          categoryId: appointment.categoryId,
          status: appointment.status,
          confirmationSource: appointment.confirmationSource,
          channel: appointment.channel,
          insuranceType: appointment.insuranceType,
          startAt: appointment.startAt,
          endAt: appointment.endAt,
          durationMin: appointment.durationMin,
          notes: appointment.notes,
          returnOption: appointment.returnOption,
          returnDate: appointment.returnDate,
          returnReason: appointment.returnReason,
          fitInId: appointment.fitInId,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
        },
        id,
      ),
      patientName: existing?.patientName ?? 'Paciente Teste',
      patientPhone: existing?.patientPhone ?? null,
      category: existing?.category ?? null,
    };
    this.rows.set(id, detail);
    return detail;
  }

  async delete(storeId: string, id: string): Promise<void> {
    const row = this.rows.get(id);
    if (row?.appointment.storeId === storeId) {
      this.rows.delete(id);
    }
  }

  async listAppointmentsForDashboardInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date },
  ): Promise<AppointmentDashboardListItem[]> {
    return [...this.rows.values()]
      .filter((row) => row.appointment.storeId === storeId)
      .filter((row) =>
        TERMINAL_APPOINTMENT_STATUSES.includes(row.appointment.status),
      )
      .filter(
        (row) =>
          row.appointment.startAt >= range.startAt &&
          row.appointment.startAt <= range.endAt,
      )
      .map((row) => ({
        id: row.appointment.id,
        startAt: row.appointment.startAt,
        status: row.appointment
          .status as AppointmentDashboardListItem['status'],
        categoryId: row.appointment.categoryId,
        categoryName: row.category?.name ?? null,
        patientId: row.appointment.patientId,
        patientName: row.patientName,
        phone: row.patientPhone ?? '',
        professionalId: row.appointment.professionalId,
      }))
      .sort((a, b) => {
        const byDate = b.startAt.getTime() - a.startAt.getTime();
        if (byDate !== 0) return byDate;
        return a.id.localeCompare(b.id);
      });
  }

  async listAppointmentDashboardYears(storeId: string): Promise<number[]> {
    const years = new Set<number>();
    for (const row of this.rows.values()) {
      if (row.appointment.storeId !== storeId) continue;
      if (!TERMINAL_APPOINTMENT_STATUSES.includes(row.appointment.status)) {
        continue;
      }
      years.add(row.appointment.startAt.getUTCFullYear());
    }
    return [...years].sort((a, b) => b - a);
  }

  async listCancelledAppointmentTasksInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date },
    pagination: { skip: number; take: number },
  ): Promise<CancelledAppointmentTasksListResult> {
    const filtered = [...this.rows.values()]
      .filter((row) => row.appointment.storeId === storeId)
      .filter((row) =>
        (CANCELLED_TASK_STATUSES as readonly string[]).includes(
          row.appointment.status,
        ),
      )
      .filter(
        (row) =>
          row.appointment.startAt >= range.startAt &&
          row.appointment.startAt <= range.endAt,
      )
      .sort((a, b) => {
        const byDate =
          b.appointment.startAt.getTime() - a.appointment.startAt.getTime();
        if (byDate !== 0) return byDate;
        return a.appointment.id.localeCompare(b.appointment.id);
      });

    const total = filtered.length;
    const items = filtered
      .slice(pagination.skip, pagination.skip + pagination.take)
      .map((row) => ({
        id: row.appointment.id,
        patientId: row.appointment.patientId,
        patientName: row.patientName,
        patientPhone: row.patientPhone ?? '',
        professionalId: row.appointment.professionalId,
        startAt: row.appointment.startAt,
        durationMin: row.appointment.durationMin,
        categoryId: row.appointment.categoryId,
        notes: row.appointment.notes,
        status: row.appointment.status as
          | 'missed'
          | 'cancelled_patient'
          | 'cancelled_pro',
      }));

    return { items, total };
  }

  async findConfirmedInStartRange(
    storeId: string,
    rangeStart: Date,
    rangeEnd: Date,
  ): Promise<AppointmentDetail[]> {
    return [...this.rows.values()]
      .filter(
        (row) =>
          row.appointment.storeId === storeId &&
          row.appointment.status === 'confirmed' &&
          row.appointment.startAt.getTime() > rangeStart.getTime() &&
          row.appointment.startAt.getTime() <= rangeEnd.getTime(),
      )
      .sort(
        (a, b) =>
          a.appointment.startAt.getTime() - b.appointment.startAt.getTime(),
      );
  }

  async findScheduledInStartRange(
    storeId: string,
    rangeStart: Date,
    rangeEnd: Date,
  ): Promise<AppointmentDetail[]> {
    return [...this.rows.values()]
      .filter(
        (row) =>
          row.appointment.storeId === storeId &&
          row.appointment.status === 'scheduled' &&
          row.appointment.startAt.getTime() > rangeStart.getTime() &&
          row.appointment.startAt.getTime() <= rangeEnd.getTime(),
      )
      .sort(
        (a, b) =>
          a.appointment.startAt.getTime() - b.appointment.startAt.getTime(),
      );
  }
}
