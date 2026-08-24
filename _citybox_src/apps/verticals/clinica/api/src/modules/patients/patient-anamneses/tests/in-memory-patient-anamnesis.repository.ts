import { PatientAnamnesis } from '../domain/entities/patient-anamnesis.entity';
import { PatientAnamnesisRepository } from '../domain/repositories/patient-anamnesis.repository.interface';
import type {
  PatientAnamnesisListCriteria,
  PatientAnamnesisPublicContext,
} from '../domain/repositories/patient-anamnesis.repository.interface';

type PatientNameRecord = {
  storeId: string;
  patientId: string;
  name: string;
};

export class InMemoryPatientAnamnesisRepository extends PatientAnamnesisRepository {
  private records: PatientAnamnesis[] = [];
  private patientNames: PatientNameRecord[] = [];
  private clinicDisplayNames = new Map<string, string>();

  seedPatientName(storeId: string, patientId: string, name: string): void {
    this.patientNames.push({ storeId, patientId, name });
  }

  seedClinicDisplayName(storeId: string, clinicDisplayName: string): void {
    this.clinicDisplayNames.set(storeId, clinicDisplayName);
  }

  findById(
    storeId: string,
    patientId: string,
    anamnesisId: string,
  ): Promise<PatientAnamnesis | null> {
    const record = this.records.find(
      (item) =>
        item.id === anamnesisId &&
        item.storeId === storeId &&
        item.patientId === patientId,
    );
    return Promise.resolve(record ? this.clone(record) : null);
  }

  findByPublicToken(
    publicToken: string,
  ): Promise<PatientAnamnesisPublicContext | null> {
    const record = this.records.find(
      (item) => item.publicToken === publicToken,
    );
    if (!record) {
      return Promise.resolve(null);
    }

    const patientName =
      this.patientNames.find(
        (item) =>
          item.storeId === record.storeId &&
          item.patientId === record.patientId,
      )?.name ?? 'Paciente';

    return Promise.resolve({
      anamnesis: this.clone(record),
      patientName,
      clinicDisplayName:
        this.clinicDisplayNames.get(record.storeId)?.trim() || 'Clínica',
    });
  }

  findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientAnamnesisListCriteria,
  ): Promise<PatientAnamnesis[]> {
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
    criteria: Omit<PatientAnamnesisListCriteria, 'skip' | 'take'>,
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

  save(anamnesis: PatientAnamnesis): Promise<PatientAnamnesis> {
    const index = this.records.findIndex((item) => item.id === anamnesis.id);
    const saved = this.clone(anamnesis);
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
    anamnesisId: string,
  ): Promise<void> {
    this.records = this.records.filter(
      (item) =>
        !(
          item.id === anamnesisId &&
          item.storeId === storeId &&
          item.patientId === patientId
        ),
    );
    return Promise.resolve();
  }

  getAll(): PatientAnamnesis[] {
    return this.records.map((item) => this.clone(item));
  }

  clear(): void {
    this.records = [];
    this.patientNames = [];
  }

  private sortItems(
    items: PatientAnamnesis[],
    criteria: Pick<PatientAnamnesisListCriteria, 'sortBy' | 'sortOrder'>,
  ): PatientAnamnesis[] {
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

  private clone(anamnesis: PatientAnamnesis): PatientAnamnesis {
    return PatientAnamnesis.create(
      {
        storeId: anamnesis.storeId,
        patientId: anamnesis.patientId,
        templateId: anamnesis.templateId,
        templateName: anamnesis.templateName,
        issuedAt: new Date(anamnesis.issuedAt),
        status: anamnesis.status,
        signatureStatus: anamnesis.signatureStatus,
        fillingMode: anamnesis.fillingMode,
        consultationReason: anamnesis.consultationReason,
        questionsSnapshot: anamnesis.questionsSnapshot.map((question) => ({
          ...question,
        })),
        answers: anamnesis.answers
          ? anamnesis.answers.map((answer) => ({ ...answer }))
          : null,
        publicToken: anamnesis.publicToken,
        linkExpiresAt: anamnesis.linkExpiresAt
          ? new Date(anamnesis.linkExpiresAt)
          : null,
        createdAt: new Date(anamnesis.createdAt),
        updatedAt: new Date(anamnesis.updatedAt),
      },
      anamnesis.id,
    );
  }
}
