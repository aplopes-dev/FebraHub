import { AppointmentEntity } from '../domain/entities/appointment.entity';
import {
  AppointmentRepository,
  BLOCKING_APPOINTMENT_STATUSES,
  ListAppointmentsFilter,
} from '../domain/repositories/appointment.repository.interface';
import {
  buildOccupancyWindows,
  windowsOverlap,
} from '../application/utils/appointment-availability';
import {
  addMinutes,
  endOfDay,
  startOfDay,
} from '../application/utils/appointment-datetime';

export class InMemoryAppointmentRepository implements AppointmentRepository {
  public items: AppointmentEntity[] = [];

  async save(appointment: AppointmentEntity): Promise<void> {
    const index = this.items.findIndex((item) => item.id === appointment.id);
    if (index >= 0) {
      this.items[index] = appointment;
    } else {
      this.items.push(appointment);
    }
    await Promise.resolve();
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<AppointmentEntity | null> {
    await Promise.resolve();
    return (
      this.items.find((item) => item.id === id && item.storeId === storeId) ??
      null
    );
  }

  async findAll(
    storeId: string,
    filter: ListAppointmentsFilter,
  ): Promise<AppointmentEntity[]> {
    await Promise.resolve();
    const rangeStart = startOfDay(filter.from);
    const rangeEnd = endOfDay(filter.to);

    return this.items
      .filter((item) => {
        if (item.storeId !== storeId) return false;

        const overlaps =
          item.startAt.getTime() <= rangeEnd.getTime() &&
          item.endAt.getTime() >= rangeStart.getTime();
        if (!overlaps) return false;

        if (filter.clientId && item.clientId !== filter.clientId) return false;
        if (filter.status && item.status !== filter.status) return false;
        if (
          filter.professionalId &&
          !item.services.some((s) => s.professionalId === filter.professionalId)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }

  async hasOverlap(
    storeId: string,
    professionalId: string,
    startAt: Date,
    endAt: Date,
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    await Promise.resolve();
    return this.items.some((item) => {
      if (item.storeId !== storeId) return false;
      if (excludeAppointmentId && item.id === excludeAppointmentId) {
        return false;
      }
      if (!BLOCKING_APPOINTMENT_STATUSES.includes(item.status)) {
        return false;
      }
      const windows = buildOccupancyWindows(
        item.startAt,
        item.services.map((line) => ({
          professionalId: line.professionalId,
          duration: line.duration,
        })),
        addMinutes,
      );
      return windows.some(
        (window) =>
          window.professionalId === professionalId &&
          windowsOverlap(window.startAt, window.endAt, startAt, endAt),
      );
    });
  }
}
