import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  CompanyRepository,
  type ListCompaniesCriteria,
} from '../../domain/repositories/company.repository.interface';
import {
  Company,
  type CompanyAddress,
  type CompanyEnvironment,
  type CompanyProps,
  type TaxRegime,
} from '../../domain/entities/company.entity';

type CompanyRow = {
  id: string;
  storeId: string;
  cnpj: string;
  legalName: string;
  tradeName: string | null;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  taxRegime: string;
  cityCodeIbge: string;
  uf: string;
  address: unknown;
  defaultEnvironment: string;
  nationalNfseEnabled: boolean;
  accountingOfficeDocument: string | null;
  cscId: string | null;
  cscTokenEncrypted: string | null;
  inutilizationJustification: string | null;
  cancellationJustification: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaCompanyRepository extends CompanyRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Company | null> {
    const row = await this.prisma.company.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByCnpj(cnpj: string): Promise<Company | null> {
    const row = await this.prisma.company.findUnique({
      where: { cnpj: cnpj.replace(/\D/g, '') },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByStoreId(storeId: string): Promise<Company | null> {
    const row = await this.prisma.company.findUnique({ where: { storeId } });
    return row ? this.toEntity(row) : null;
  }

  async findAll(criteria: ListCompaniesCriteria): Promise<Company[]> {
    const rows = await this.prisma.company.findMany({
      where: this.toWhere(criteria),
      skip: criteria.skip,
      take: criteria.take,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async count(
    criteria: Omit<ListCompaniesCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.prisma.company.count({ where: this.toWhere(criteria) });
  }

  async save(company: Company): Promise<Company> {
    const row = await this.prisma.company.upsert({
      where: { id: company.id },
      create: {
        id: company.id,
        storeId: company.storeId,
        cnpj: company.cnpj,
        legalName: company.legalName,
        tradeName: company.tradeName,
        stateRegistration: company.stateRegistration,
        municipalRegistration: company.municipalRegistration,
        taxRegime: company.taxRegime,
        cityCodeIbge: company.cityCodeIbge,
        uf: company.uf,
        address: company.address,
        defaultEnvironment: company.defaultEnvironment,
        nationalNfseEnabled: company.nationalNfseEnabled,
        accountingOfficeDocument: company.accountingOfficeDocument,
        cscId: company.cscId,
        cscTokenEncrypted: company.cscTokenEncrypted,
        inutilizationJustification: company.inutilizationJustification,
        cancellationJustification: company.cancellationJustification,
        active: company.active,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      },
      update: {
        legalName: company.legalName,
        tradeName: company.tradeName,
        stateRegistration: company.stateRegistration,
        municipalRegistration: company.municipalRegistration,
        taxRegime: company.taxRegime,
        address: company.address,
        defaultEnvironment: company.defaultEnvironment,
        nationalNfseEnabled: company.nationalNfseEnabled,
        accountingOfficeDocument: company.accountingOfficeDocument,
        cscId: company.cscId,
        cscTokenEncrypted: company.cscTokenEncrypted,
        inutilizationJustification: company.inutilizationJustification,
        cancellationJustification: company.cancellationJustification,
        active: company.active,
        updatedAt: company.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  private toWhere(criteria: {
    cnpj?: string;
    active?: boolean;
  }): Record<string, unknown> {
    return {
      ...(criteria.cnpj ? { cnpj: criteria.cnpj } : {}),
      ...(criteria.active !== undefined ? { active: criteria.active } : {}),
    };
  }

  private toEntity(row: CompanyRow): Company {
    const props: CompanyProps = {
      storeId: row.storeId,
      cnpj: row.cnpj,
      legalName: row.legalName,
      tradeName: row.tradeName,
      stateRegistration: row.stateRegistration,
      municipalRegistration: row.municipalRegistration,
      taxRegime: row.taxRegime as TaxRegime,
      cityCodeIbge: row.cityCodeIbge,
      uf: row.uf,
      address: row.address as CompanyAddress,
      defaultEnvironment: row.defaultEnvironment as CompanyEnvironment,
      nationalNfseEnabled: row.nationalNfseEnabled,
      accountingOfficeDocument: row.accountingOfficeDocument,
      cscId: row.cscId,
      cscTokenEncrypted: row.cscTokenEncrypted,
      inutilizationJustification: row.inutilizationJustification,
      cancellationJustification: row.cancellationJustification,
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return Company.with(props, row.id);
  }
}
