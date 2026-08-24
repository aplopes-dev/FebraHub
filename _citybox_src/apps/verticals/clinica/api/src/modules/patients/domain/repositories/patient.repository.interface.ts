import type {
  Patient,
  PatientGender,
  PatientStatus,
} from '../entities/patient.entity';
import type { PatientReferralOriginSystemKey } from '../../patient-referral-origins/domain/entities/patient-referral-origin.entity';

export type PatientListSortBy =
  | 'name'
  | 'birthDate'
  | 'status'
  | 'planName'
  | 'category';

export type PatientListCriteria = {
  skip: number;
  take: number;
  search?: string;
  categoryId?: string;
  status?: PatientStatus;
  sortBy?: PatientListSortBy;
  sortOrder?: 'asc' | 'desc';
};

export type PatientDetail = {
  patient: Patient;
  planName: string | null;
  planStatus: 'active' | 'inactive' | null;
  categoryName: string;
  categoryColorId: string;
  referralOriginName: string | null;
  referralOriginSystemKey: PatientReferralOriginSystemKey | null;
  referredByPatientName: string | null;
  referredByExternalProfessionalName: string | null;
};

export type BirthdayPatient = {
  id: string;
  name: string;
  phone: string;
  birthDate: Date;
  photoObjectKey: string | null;
};

/** Row for dashboard "Como o paciente chegou" (cadastro no período). */
export type PatientAcquisitionListItem = {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpf: string | null;
  createdAt: Date;
  referralOriginSystemKey: PatientReferralOriginSystemKey | null;
  referralOriginName: string | null;
};

/** Row for dashboard demografia (idade/sexo); só active. */
export type PatientDemographicsListItem = {
  birthDate: Date | null;
  gender: PatientGender;
};

export abstract class PatientRepository {
  abstract findById(storeId: string, id: string): Promise<PatientDetail | null>;
  abstract findByCpf(
    storeId: string,
    cpf: string,
    excludeId?: string,
  ): Promise<Patient | null>;
  abstract findMany(
    storeId: string,
    criteria: PatientListCriteria,
  ): Promise<PatientDetail[]>;
  abstract count(
    storeId: string,
    criteria: PatientListCriteria,
  ): Promise<number>;
  /**
   * Active patients with non-null birthDate whose next birthday is within
   * `withinDays` (inclusive, 0 = today). Default window: 30 days.
   */
  abstract countUpcomingBirthdays(
    storeId: string,
    todayIsoDate: string,
    withinDays?: number,
  ): Promise<number>;
  /** Active patients with non-null birthDate (optional name/phone/cpf search). */
  abstract findActiveWithBirthDate(
    storeId: string,
    search?: string,
  ): Promise<BirthdayPatient[]>;
  /**
   * Pacientes da loja com `createdAt` no intervalo (active + inactive).
   * Usado pelo card de origem no dashboard.
   */
  abstract listPatientsForAcquisitionInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date },
  ): Promise<PatientAcquisitionListItem[]>;
  /** Anos civis (UTC) com pelo menos um cadastro na loja, desc. */
  abstract listAcquisitionYears(storeId: string): Promise<number[]>;
  /**
   * Pacientes active da loja (birthDate + gender) para demografia do dashboard.
   */
  abstract listPatientsForDemographics(
    storeId: string,
  ): Promise<PatientDemographicsListItem[]>;
  abstract save(patient: Patient): Promise<Patient>;
}
