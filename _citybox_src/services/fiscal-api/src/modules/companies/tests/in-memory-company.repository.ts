import {
  CompanyRepository,
  type ListCompaniesCriteria,
} from '../domain/repositories/company.repository.interface';
import type { Company } from '../domain/entities/company.entity';

export class InMemoryCompanyRepository extends CompanyRepository {
  private readonly companies = new Map<string, Company>();

  findById(id: string): Promise<Company | null> {
    return Promise.resolve(this.companies.get(id) ?? null);
  }

  findByCnpj(cnpj: string): Promise<Company | null> {
    const alvo = cnpj.replace(/\D/g, '');
    const found = [...this.companies.values()].find(
      (company) => company.cnpj.replace(/\D/g, '') === alvo,
    );
    return Promise.resolve(found ?? null);
  }

  findByStoreId(storeId: string): Promise<Company | null> {
    const found = [...this.companies.values()].find(
      (company) => company.storeId === storeId,
    );
    return Promise.resolve(found ?? null);
  }

  findAll(criteria: ListCompaniesCriteria): Promise<Company[]> {
    const filtered = this.applyFilters(criteria);
    return Promise.resolve(
      filtered.slice(criteria.skip, criteria.skip + criteria.take),
    );
  }

  count(
    criteria: Omit<ListCompaniesCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return Promise.resolve(this.applyFilters(criteria).length);
  }

  save(company: Company): Promise<Company> {
    this.companies.set(company.id, company);
    return Promise.resolve(company);
  }

  private applyFilters(criteria: {
    cnpj?: string;
    active?: boolean;
  }): Company[] {
    return [...this.companies.values()].filter((company) => {
      if (criteria.cnpj && company.cnpj !== criteria.cnpj) return false;
      if (criteria.active !== undefined && company.active !== criteria.active)
        return false;
      return true;
    });
  }
}
