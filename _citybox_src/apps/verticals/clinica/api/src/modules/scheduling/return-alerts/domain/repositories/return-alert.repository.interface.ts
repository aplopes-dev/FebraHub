import { DomainError } from '../../../../../shared/core/errors/domain.error';
import type { ReturnAlert } from '../entities/return-alert.entity';

export class ReturnAlertNotFoundError extends DomainError {
  constructor(context: string, alertId: string) {
    super({
      internalMessage: `Return alert not found: ${alertId}`,
      externalMessage: 'Alerta de retorno não encontrado',
      context,
    });
  }
}

export type ReturnAlertDetail = {
  alert: ReturnAlert;
  patientName: string;
  patientPhone: string | null;
};

export type ReturnAlertListCriteria = {
  skip: number;
  take: number;
  fromDate?: string;
  toDate?: string;
  patientId?: string;
};

export abstract class ReturnAlertRepository {
  abstract findById(
    storeId: string,
    id: string,
  ): Promise<ReturnAlertDetail | null>;

  abstract findByAppointmentId(
    storeId: string,
    appointmentId: string,
  ): Promise<ReturnAlert | null>;

  abstract findMany(
    storeId: string,
    criteria: ReturnAlertListCriteria,
  ): Promise<ReturnAlertDetail[]>;

  abstract count(
    storeId: string,
    criteria: Omit<ReturnAlertListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  abstract save(alert: ReturnAlert): Promise<ReturnAlertDetail>;
  abstract delete(storeId: string, id: string): Promise<void>;
}
