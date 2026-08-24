import type { Company } from '../../../../domain/entities/company.entity';
import { toCompanyResponse } from './company-response.mapper';

type ListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export class CompanyPresenter {
  static toHttp(company: Company) {
    return { data: toCompanyResponse(company) };
  }

  static toListHttp(companies: Company[], meta: ListMeta) {
    return { data: companies.map(toCompanyResponse), meta };
  }
}
