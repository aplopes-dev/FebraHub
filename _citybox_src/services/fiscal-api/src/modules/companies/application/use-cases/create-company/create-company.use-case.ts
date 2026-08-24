import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CompanyRepository } from '../../../domain/repositories/company.repository.interface';
import { Company } from '../../../domain/entities/company.entity';
import { CompanyAlreadyExistsForStoreError } from '../../../domain/errors/store-already-has-company.error';
import { CompanyAlreadyExistsForCnpjError } from '../../../domain/errors/cnpj-already-registered.error';
import type { CreateCompanyDto } from '../../dtos/company.dto';

@Injectable()
export class CreateCompanyUseCase implements IUseCase<
  CreateCompanyDto,
  Company
> {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async execute(dto: CreateCompanyDto): Promise<Company> {
    const existing = await this.companyRepository.findByStoreId(dto.storeId);
    if (existing) {
      throw new CompanyAlreadyExistsForStoreError(
        CreateCompanyUseCase.name,
        dto.storeId,
      );
    }

    // CNPJ e unico no banco; sem esta checagem a violacao vira 500.
    const mesmoCnpj = await this.companyRepository.findByCnpj(dto.cnpj);
    if (mesmoCnpj) {
      throw new CompanyAlreadyExistsForCnpjError(
        CreateCompanyUseCase.name,
        dto.cnpj,
      );
    }

    const company = Company.create({
      storeId: dto.storeId,
      cnpj: dto.cnpj,
      legalName: dto.legalName,
      tradeName: dto.tradeName ?? null,
      stateRegistration: dto.stateRegistration ?? null,
      municipalRegistration: dto.municipalRegistration ?? null,
      taxRegime: dto.taxRegime,
      cityCodeIbge: dto.cityCodeIbge,
      uf: dto.uf,
      address: dto.address,
      defaultEnvironment: dto.defaultEnvironment,
      // Sem esta linha o flag chegava na rota e sumia aqui: a montagem e
      // campo a campo, entao campo novo nao entra sozinho — e a empresa
      // nascia sem poder emitir NFS-e, com 422 sem causa aparente.
      nationalNfseEnabled: dto.nationalNfseEnabled,
      accountingOfficeDocument: dto.accountingOfficeDocument ?? null,
    });

    return this.companyRepository.save(company);
  }
}
