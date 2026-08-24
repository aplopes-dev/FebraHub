import { PatientReferralOriginRepository } from '../domain/repositories/patient-referral-origin.repository.interface';
import {
  PatientReferralOrigin,
  type PatientReferralOriginSystemKey,
} from '../domain/entities/patient-referral-origin.entity';

export class InMemoryPatientReferralOriginRepository extends PatientReferralOriginRepository {
  private readonly items: PatientReferralOrigin[] = [];

  seed(origins: readonly PatientReferralOrigin[]): void {
    this.items.splice(0, this.items.length, ...origins);
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<PatientReferralOrigin | null> {
    return (
      this.items.find(
        (item) => item.storeId === storeId && item.id === id,
      ) ?? null
    );
  }

  async findByName(
    storeId: string,
    name: string,
  ): Promise<PatientReferralOrigin | null> {
    const normalized = name.trim().toLocaleLowerCase('pt-BR');
    return (
      this.items.find(
        (item) =>
          item.storeId === storeId &&
          item.name.toLocaleLowerCase('pt-BR') === normalized,
      ) ?? null
    );
  }

  async findBySystemKey(
    storeId: string,
    systemKey: PatientReferralOriginSystemKey,
  ): Promise<PatientReferralOrigin | null> {
    return (
      this.items.find(
        (item) => item.storeId === storeId && item.systemKey === systemKey,
      ) ?? null
    );
  }

  async findAll(storeId: string): Promise<PatientReferralOrigin[]> {
    return this.items
      .filter((item) => item.storeId === storeId)
      .slice()
      .sort((a, b) => {
        if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
        return a.name.localeCompare(b.name, 'pt-BR');
      });
  }

  async save(origin: PatientReferralOrigin): Promise<PatientReferralOrigin> {
    const index = this.items.findIndex((item) => item.id === origin.id);
    if (index >= 0) {
      this.items[index] = origin;
    } else {
      this.items.push(origin);
    }
    return origin;
  }

  async saveMany(
    origins: readonly PatientReferralOrigin[],
  ): Promise<PatientReferralOrigin[]> {
    const saved: PatientReferralOrigin[] = [];
    for (const origin of origins) {
      saved.push(await this.save(origin));
    }
    return saved;
  }
}
