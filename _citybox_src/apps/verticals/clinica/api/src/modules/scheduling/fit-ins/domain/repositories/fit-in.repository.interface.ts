import type { FitInStatus } from '../../../shared/domain/scheduling-enums';
import type { FitIn } from '../entities/fit-in.entity';

export type FitInCategorySnapshot = {
  id: string;
  name: string;
  color: string;
} | null;

export type FitInDetail = {
  fitIn: FitIn;
  patientName: string;
  patientPhone: string | null;
  category: FitInCategorySnapshot;
  appointmentId: string | null;
};

export type FitInListCriteria = {
  status?: FitInStatus;
  startDate?: string;
  endDate?: string;
};

export abstract class FitInRepository {
  abstract findById(storeId: string, id: string): Promise<FitInDetail | null>;
  abstract findMany(
    storeId: string,
    criteria: FitInListCriteria,
  ): Promise<FitInDetail[]>;
  abstract findPendingByPatient(
    storeId: string,
    patientId: string,
  ): Promise<FitInDetail[]>;
  abstract save(fitIn: FitIn): Promise<FitInDetail>;
  abstract updateStatus(
    storeId: string,
    id: string,
    status: FitInStatus,
  ): Promise<void>;
  abstract delete(storeId: string, id: string): Promise<void>;
}
