import type { PatientCertificate } from '../entities/patient-certificate.entity';

export type PatientCertificateListSortBy = 'issuedDate' | 'type';

export type PatientCertificateListCriteria = {
  skip: number;
  take: number;
  search?: string;
  sortBy?: PatientCertificateListSortBy;
  sortOrder?: 'asc' | 'desc';
};

export abstract class PatientCertificateRepository {
  abstract findById(
    storeId: string,
    patientId: string,
    certificateId: string,
  ): Promise<PatientCertificate | null>;

  abstract findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientCertificateListCriteria,
  ): Promise<PatientCertificate[]>;

  abstract countByPatientId(
    storeId: string,
    patientId: string,
    criteria: Omit<PatientCertificateListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  abstract save(certificate: PatientCertificate): Promise<PatientCertificate>;

  abstract delete(
    storeId: string,
    patientId: string,
    certificateId: string,
  ): Promise<void>;
}
