import { PatientContractEmission } from '../domain/entities/patient-contract-emission.entity';
import { PatientContractEmissionRepository } from '../domain/repositories/patient-contract-emission.repository.interface';
import type { PatientContractEmissionListCriteria } from '../domain/repositories/patient-contract-emission.repository.interface';

export class InMemoryPatientContractEmissionRepository extends PatientContractEmissionRepository {
  private records: PatientContractEmission[] = [];

  findById(
    storeId: string,
    patientId: string,
    contractId: string,
  ): Promise<PatientContractEmission | null> {
    const record = this.records.find(
      (item) =>
        item.id === contractId &&
        item.storeId === storeId &&
        item.patientId === patientId,
    );
    return Promise.resolve(record ? this.clone(record) : null);
  }

  findByBudgetId(
    storeId: string,
    budgetId: string,
  ): Promise<PatientContractEmission | null> {
    const record = this.records.find(
      (item) => item.storeId === storeId && item.budgetId === budgetId,
    );
    return Promise.resolve(record ? this.clone(record) : null);
  }

  findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientContractEmissionListCriteria,
  ): Promise<PatientContractEmission[]> {
    const search = criteria.search?.trim().toLowerCase();
    let items = this.records.filter(
      (item) => item.storeId === storeId && item.patientId === patientId,
    );

    if (search) {
      items = items.filter((item) =>
        item.templateName.toLowerCase().includes(search),
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
    criteria: Omit<PatientContractEmissionListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    const search = criteria.search?.trim().toLowerCase();
    return Promise.resolve(
      this.records.filter((item) => {
        if (item.storeId !== storeId || item.patientId !== patientId) {
          return false;
        }
        if (search && !item.templateName.toLowerCase().includes(search)) {
          return false;
        }
        return true;
      }).length,
    );
  }

  save(emission: PatientContractEmission): Promise<PatientContractEmission> {
    const index = this.records.findIndex((item) => item.id === emission.id);
    const saved = this.clone(emission);
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
    contractId: string,
  ): Promise<void> {
    this.records = this.records.filter(
      (item) =>
        !(
          item.id === contractId &&
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
    items: PatientContractEmission[],
    criteria: Pick<PatientContractEmissionListCriteria, 'sortBy' | 'sortOrder'>,
  ): PatientContractEmission[] {
    const sortOrder = criteria.sortOrder ?? 'desc';
    const sorted = [...items].sort((left, right) => {
      switch (criteria.sortBy) {
        case 'templateName':
          return left.templateName.localeCompare(right.templateName, 'pt-BR');
        case 'issuedAt':
        default:
          return left.issuedAt.getTime() - right.issuedAt.getTime();
      }
    });
    return sortOrder === 'desc' ? sorted.reverse() : sorted;
  }

  private clone(emission: PatientContractEmission): PatientContractEmission {
    return PatientContractEmission.create(
      {
        storeId: emission.storeId,
        patientId: emission.patientId,
        budgetId: emission.budgetId,
        templateId: emission.templateId,
        templateName: emission.templateName,
        content: emission.content,
        issuedAt: new Date(emission.issuedAt),
        issuedVia: emission.issuedVia,
        responsibleName: emission.responsibleName,
        patientName: emission.patientName,
        responsibleSignatureStatus: emission.responsibleSignatureStatus,
        patientSignatureStatus: emission.patientSignatureStatus,
        formValues: { ...emission.formValues },
        createdAt: new Date(emission.createdAt),
        updatedAt: new Date(emission.updatedAt),
      },
      emission.id,
    );
  }
}
