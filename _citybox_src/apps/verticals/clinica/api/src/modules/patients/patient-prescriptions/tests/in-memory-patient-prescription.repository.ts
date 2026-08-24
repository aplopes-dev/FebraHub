import { PatientPrescription } from '../domain/entities/patient-prescription.entity';
import { PatientPrescriptionRepository } from '../domain/repositories/patient-prescription.repository.interface';
import type { PatientPrescriptionListCriteria } from '../domain/repositories/patient-prescription.repository.interface';

export class InMemoryPatientPrescriptionRepository extends PatientPrescriptionRepository {
  private records: PatientPrescription[] = [];

  findById(
    storeId: string,
    patientId: string,
    prescriptionId: string,
  ): Promise<PatientPrescription | null> {
    const record = this.records.find(
      (item) =>
        item.id === prescriptionId &&
        item.storeId === storeId &&
        item.patientId === patientId,
    );
    return Promise.resolve(record ? this.clone(record) : null);
  }

  findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientPrescriptionListCriteria,
  ): Promise<PatientPrescription[]> {
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
    criteria: Omit<PatientPrescriptionListCriteria, 'skip' | 'take'>,
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

  save(prescription: PatientPrescription): Promise<PatientPrescription> {
    const index = this.records.findIndex((item) => item.id === prescription.id);
    const saved = this.clone(prescription);
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
    prescriptionId: string,
  ): Promise<void> {
    this.records = this.records.filter(
      (item) =>
        !(
          item.id === prescriptionId &&
          item.storeId === storeId &&
          item.patientId === patientId
        ),
    );
    return Promise.resolve();
  }

  clear(): void {
    this.records = [];
  }

  private sortItems(
    items: PatientPrescription[],
    criteria: Pick<PatientPrescriptionListCriteria, 'sortBy' | 'sortOrder'>,
  ): PatientPrescription[] {
    const sortOrder = criteria.sortOrder ?? 'desc';
    const sorted = [...items].sort((left, right) => {
      switch (criteria.sortBy) {
        case 'professionalName':
          return left.professionalName.localeCompare(
            right.professionalName,
            'pt-BR',
          );
        case 'issuedDate':
        default:
          return left.issuedDate.getTime() - right.issuedDate.getTime();
      }
    });
    return sortOrder === 'desc' ? sorted.reverse() : sorted;
  }

  private clone(prescription: PatientPrescription): PatientPrescription {
    return PatientPrescription.create(
      {
        storeId: prescription.storeId,
        patientId: prescription.patientId,
        professionalId: prescription.professionalId,
        professionalName: prescription.professionalName,
        councilType: prescription.councilType,
        councilNumber: prescription.councilNumber,
        councilUf: prescription.councilUf,
        patientName: prescription.patientName,
        clinicName: prescription.clinicName,
        issuedDate: new Date(prescription.issuedDate),
        issuedAt: new Date(prescription.issuedAt),
        items: prescription.items.map((item) => ({ ...item })),
        createdAt: new Date(prescription.createdAt),
        updatedAt: new Date(prescription.updatedAt),
      },
      prescription.id,
    );
  }
}
