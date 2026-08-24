import { ExternalReferralProfessionalRepository } from '../domain/repositories/external-referral-professional.repository.interface';
import { ExternalReferralProfessional } from '../domain/entities/external-referral-professional.entity';

export class InMemoryExternalReferralProfessionalRepository extends ExternalReferralProfessionalRepository {
  private readonly items: ExternalReferralProfessional[] = [];

  seed(professionals: readonly ExternalReferralProfessional[]): void {
    this.items.splice(0, this.items.length, ...professionals);
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<ExternalReferralProfessional | null> {
    return (
      this.items.find(
        (item) => item.storeId === storeId && item.id === id,
      ) ?? null
    );
  }

  async findByName(
    storeId: string,
    name: string,
  ): Promise<ExternalReferralProfessional | null> {
    const normalized = name.trim().toLocaleLowerCase('pt-BR');
    return (
      this.items.find(
        (item) =>
          item.storeId === storeId &&
          item.name.toLocaleLowerCase('pt-BR') === normalized,
      ) ?? null
    );
  }

  async findAll(storeId: string): Promise<ExternalReferralProfessional[]> {
    return this.items
      .filter((item) => item.storeId === storeId)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  async save(
    professional: ExternalReferralProfessional,
  ): Promise<ExternalReferralProfessional> {
    const index = this.items.findIndex((item) => item.id === professional.id);
    if (index >= 0) {
      this.items[index] = professional;
    } else {
      this.items.push(professional);
    }
    return professional;
  }

  async delete(storeId: string, id: string): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.storeId === storeId && item.id === id,
    );
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
