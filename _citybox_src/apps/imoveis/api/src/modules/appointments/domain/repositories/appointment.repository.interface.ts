import type { AppointmentEntity } from '../entities/appointment.entity';
import type { ApiAppointmentKind } from '../mappers/appointment-enum.mapper';

export type ListAppointmentsFilters = {
  page: number;
  perPage: number;
  /** Início inclusivo do intervalo (instant). */
  from: Date;
  /** Fim exclusivo do intervalo (instant — dia seguinte 00:00 Bahia). */
  toExclusive: Date;
  agentId?: string;
  excludeAgentId?: string;
  kind?: ApiAppointmentKind[];
  /** Omitido = concluídos e pendentes. */
  done?: boolean;
};

export type ListAppointmentsResult = {
  items: AppointmentEntity[];
  total: number;
};

export type AppointmentWritePayload = {
  storeId: string;
  title: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  location?: string;
  kind: ApiAppointmentKind;
  agentId: string;
  done?: boolean;
  leadId?: string | null;
  leadName?: string | null;
  leadEmail?: string | null;
  leadPhone?: string | null;
  leadPhotoUrl?: string | null;
  propertyId?: string | null;
  googleEventId?: string | null;
};

export abstract class AppointmentRepository {
  abstract findMany(
    storeId: string,
    filters: ListAppointmentsFilters,
  ): Promise<ListAppointmentsResult>;

  abstract findById(
    storeId: string,
    id: string,
  ): Promise<AppointmentEntity | null>;

  /**
   * Follow-up pendente vinculado ao lead (kind `follow-up`, `done=false`).
   * Usado para sync a partir do cadastro do lead.
   */
  abstract findOpenFollowUpByLeadId(
    storeId: string,
    leadId: string,
  ): Promise<AppointmentEntity | null>;

  abstract create(payload: AppointmentWritePayload): Promise<AppointmentEntity>;

  abstract update(
    storeId: string,
    id: string,
    payload: Omit<AppointmentWritePayload, 'storeId'>,
  ): Promise<AppointmentEntity | null>;

  /** Atualiza só o vínculo Google (pós-sync). */
  abstract setGoogleEventId(
    storeId: string,
    id: string,
    googleEventId: string | null,
  ): Promise<AppointmentEntity | null>;

  abstract delete(storeId: string, id: string): Promise<boolean>;
}
