import type { Company } from '../entities/company.entity';

export type ListCompaniesCriteria = {
  skip: number;
  take: number;
  cnpj?: string;
  active?: boolean;
};

export abstract class CompanyRepository {
  abstract findById(id: string): Promise<Company | null>;
  /// CNPJ e unico entre Emitentes — usado para recusar duplicata com erro
  /// legivel em vez de deixar a constraint do banco virar 500.
  abstract findByCnpj(cnpj: string): Promise<Company | null>;

  abstract findByStoreId(storeId: string): Promise<Company | null>;
  abstract findAll(criteria: ListCompaniesCriteria): Promise<Company[]>;
  abstract count(
    criteria: Omit<ListCompaniesCriteria, 'skip' | 'take'>,
  ): Promise<number>;
  abstract save(company: Company): Promise<Company>;
}
