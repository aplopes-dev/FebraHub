import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CompanyRepository } from '../../../domain/repositories/company.repository.interface';
import { Company } from '../../../domain/entities/company.entity';
import { CompanyNotFoundError } from '../../../domain/errors/company-not-found.error';
import type { GetCompanyDto } from '../../dtos/company.dto';

@Injectable()
export class GetCompanyUseCase implements IUseCase<GetCompanyDto, Company> {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async execute(dto: GetCompanyDto): Promise<Company> {
    const company = await this.companyRepository.findById(dto.companyId);
    if (!company) {
      throw new CompanyNotFoundError(GetCompanyUseCase.name, dto.companyId);
    }
    return company;
  }
}
