import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CompanyRepository } from '../../../domain/repositories/company.repository.interface';
import type { Company } from '../../../domain/entities/company.entity';
import type { ListCompaniesDto } from '../../dtos/company.dto';

export type ListCompaniesResult = {
  companies: Company[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListCompaniesUseCase implements IUseCase<
  ListCompaniesDto,
  ListCompaniesResult
> {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async execute({
    page = 1,
    perPage = 20,
    cnpj,
    active,
  }: ListCompaniesDto): Promise<ListCompaniesResult> {
    const skip = (page - 1) * perPage;
    const criteria = { cnpj: cnpj?.trim() || undefined, active };

    const [companies, total] = await Promise.all([
      this.companyRepository.findAll({ ...criteria, skip, take: perPage }),
      this.companyRepository.count(criteria),
    ]);

    return {
      companies,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }
}
