import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CompanyRepository } from '../../../domain/repositories/company.repository.interface';
import { Company } from '../../../domain/entities/company.entity';
import { CompanyNotFoundError } from '../../../domain/errors/company-not-found.error';
import type { UpdateCompanyDto } from '../../dtos/company.dto';

@Injectable()
export class UpdateCompanyUseCase implements IUseCase<
  UpdateCompanyDto,
  Company
> {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async execute({ companyId, ...input }: UpdateCompanyDto): Promise<Company> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new CompanyNotFoundError(UpdateCompanyUseCase.name, companyId);
    }

    company.update(input);

    return this.companyRepository.save(company);
  }
}
