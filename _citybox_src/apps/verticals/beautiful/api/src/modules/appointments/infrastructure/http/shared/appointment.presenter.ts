import { AppointmentEntity } from '../../../domain/entities/appointment.entity';
import type { AppointmentStatus } from '../../../domain/appointment.types';
import {
  toIsoDate,
  toTimeHm,
} from '../../../application/utils/appointment-datetime';

export interface AppointmentServiceResponse {
  id?: string;
  professionalId: string;
  professionalName?: string;
  serviceId: string;
  serviceName?: string;
  price: number;
  duration: number;
}

export interface AppointmentResponse {
  id: string;
  clientId: string;
  clientName?: string;
  clientPhone?: string;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  clientNotes: string | null;
  startAt: string;
  endAt: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  totalPrice: number;
  professionalId?: string;
  professionalName?: string;
  serviceId?: string;
  serviceName?: string;
  services: AppointmentServiceResponse[];
  createdAt: string;
  updatedAt: string;
}

export class AppointmentPresenter {
  static toHTTP(entity: AppointmentEntity): AppointmentResponse {
    const first = entity.services[0];
    return {
      id: entity.id,
      clientId: entity.clientId,
      clientName: entity.clientName,
      clientPhone: entity.clientPhone,
      categoryId: entity.categoryId,
      categoryName: entity.categoryName ?? undefined,
      categoryColor: entity.categoryColor ?? undefined,
      clientNotes: entity.clientNotes,
      startAt: entity.startAt.toISOString(),
      endAt: entity.endAt.toISOString(),
      date: toIsoDate(entity.startAt),
      startTime: toTimeHm(entity.startAt),
      endTime: toTimeHm(entity.endAt),
      status: entity.status,
      totalPrice: entity.totalPrice,
      professionalId: first?.professionalId,
      professionalName: first?.professionalName,
      serviceId: first?.serviceId,
      serviceName: first?.serviceName,
      services: entity.services.map((line) => ({
        id: line.id,
        professionalId: line.professionalId,
        professionalName: line.professionalName,
        serviceId: line.serviceId,
        serviceName: line.serviceName,
        price: line.price,
        duration: line.duration,
      })),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static toHTTPList(entities: AppointmentEntity[]): AppointmentResponse[] {
    return entities.map((e) => AppointmentPresenter.toHTTP(e));
  }
}
