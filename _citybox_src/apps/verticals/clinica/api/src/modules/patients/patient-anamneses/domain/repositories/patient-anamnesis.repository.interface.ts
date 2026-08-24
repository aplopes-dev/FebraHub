import type { PatientAnamnesis } from '../entities/patient-anamnesis.entity';

export type PatientAnamnesisListSortBy = 'issuedAt' | 'templateName';

export type PatientAnamnesisListCriteria = {
  skip: number;
  take: number;
  search?: string;
  sortBy?: PatientAnamnesisListSortBy;
  sortOrder?: 'asc' | 'desc';
};

export type PatientAnamnesisPublicContext = {
  anamnesis: PatientAnamnesis;
  patientName: string;
  /** Nome exibido no formulário público (perfil da clínica / trade name). */
  clinicDisplayName: string;
};

export abstract class PatientAnamnesisRepository {
  abstract findById(
    storeId: string,
    patientId: string,
    anamnesisId: string,
  ): Promise<PatientAnamnesis | null>;

  abstract findByPublicToken(
    publicToken: string,
  ): Promise<PatientAnamnesisPublicContext | null>;

  abstract findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientAnamnesisListCriteria,
  ): Promise<PatientAnamnesis[]>;

  abstract countByPatientId(
    storeId: string,
    patientId: string,
    criteria: Omit<PatientAnamnesisListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  abstract save(anamnesis: PatientAnamnesis): Promise<PatientAnamnesis>;

  abstract delete(
    storeId: string,
    patientId: string,
    anamnesisId: string,
  ): Promise<void>;
}
