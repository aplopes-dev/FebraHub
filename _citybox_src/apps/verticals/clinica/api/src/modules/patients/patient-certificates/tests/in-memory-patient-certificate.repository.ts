import { PatientCertificate } from '../domain/entities/patient-certificate.entity';
import { PatientCertificateRepository } from '../domain/repositories/patient-certificate.repository.interface';
import type { PatientCertificateListCriteria } from '../domain/repositories/patient-certificate.repository.interface';

export class InMemoryPatientCertificateRepository extends PatientCertificateRepository {
  private records: PatientCertificate[] = [];

  findById(
    storeId: string,
    patientId: string,
    certificateId: string,
  ): Promise<PatientCertificate | null> {
    const record = this.records.find(
      (item) =>
        item.id === certificateId &&
        item.storeId === storeId &&
        item.patientId === patientId,
    );
    return Promise.resolve(record ? this.clone(record) : null);
  }

  findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientCertificateListCriteria,
  ): Promise<PatientCertificate[]> {
    const search = criteria.search?.trim().toLowerCase();
    let items = this.records.filter(
      (item) => item.storeId === storeId && item.patientId === patientId,
    );

    if (search) {
      items = items.filter((item) =>
        item.professionalName.toLowerCase().includes(search),
      );
    }

    items = this.sortItems(items, criteria);
    return Promise.resolve(
      items
        .slice(criteria.skip, criteria.skip + criteria.take)
        .map((item) => this.clone(item)),
    );
  }

  countByPatientId(
    storeId: string,
    patientId: string,
    criteria: Omit<PatientCertificateListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    const search = criteria.search?.trim().toLowerCase();
    return Promise.resolve(
      this.records.filter((item) => {
        if (item.storeId !== storeId || item.patientId !== patientId) {
          return false;
        }
        if (search && !item.professionalName.toLowerCase().includes(search)) {
          return false;
        }
        return true;
      }).length,
    );
  }

  save(certificate: PatientCertificate): Promise<PatientCertificate> {
    const index = this.records.findIndex((item) => item.id === certificate.id);
    const saved = this.clone(certificate);
    if (index >= 0) {
      this.records[index] = saved;
    } else {
      this.records.push(saved);
    }
    return Promise.resolve(this.clone(saved));
  }

  delete(
    storeId: string,
    patientId: string,
    certificateId: string,
  ): Promise<void> {
    this.records = this.records.filter(
      (item) =>
        !(
          item.id === certificateId &&
          item.storeId === storeId &&
          item.patientId === patientId
        ),
    );
    return Promise.resolve();
  }

  getAll(): PatientCertificate[] {
    return this.records.map((item) => this.clone(item));
  }

  clear(): void {
    this.records = [];
  }

  private sortItems(
    items: PatientCertificate[],
    criteria: Pick<PatientCertificateListCriteria, 'sortBy' | 'sortOrder'>,
  ): PatientCertificate[] {
    const sortOrder = criteria.sortOrder ?? 'desc';
    const sorted = [...items].sort((left, right) => {
      switch (criteria.sortBy) {
        case 'type':
          return left.type.localeCompare(right.type, 'pt-BR');
        case 'issuedDate':
        default:
          return left.issuedDate.getTime() - right.issuedDate.getTime();
      }
    });
    return sortOrder === 'desc' ? sorted.reverse() : sorted;
  }

  private clone(certificate: PatientCertificate): PatientCertificate {
    return PatientCertificate.create(
      {
        storeId: certificate.storeId,
        patientId: certificate.patientId,
        professionalId: certificate.professionalId,
        professionalName: certificate.professionalName,
        councilType: certificate.councilType,
        councilNumber: certificate.councilNumber,
        councilUf: certificate.councilUf,
        patientName: certificate.patientName,
        clinicName: certificate.clinicName,
        type: certificate.type,
        issuedDate: new Date(certificate.issuedDate),
        issuedAt: new Date(certificate.issuedAt),
        daysCount: certificate.daysCount,
        startTime: certificate.startTime,
        endTime: certificate.endTime,
        cid: certificate.cid,
        createdAt: new Date(certificate.createdAt),
        updatedAt: new Date(certificate.updatedAt),
      },
      certificate.id,
    );
  }
}
