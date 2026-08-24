import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  FiscalDefaultTaxes,
  type FiscalDefaultTaxesProps,
} from '../../domain/entities/fiscal-default-taxes.entity';
import { FiscalDefaultTaxesRepository } from '../../domain/repositories/fiscal-default-taxes.repository.interface';

type Row = {
  id: string;
  organizationId: string;
  icmsGroupId: string | null;
  ipiGroupId: string | null;
  pisCofinsGroupId: string | null;
  issqnGroupId: string | null;
  cfop: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaFiscalDefaultTaxesRepository extends FiscalDefaultTaxesRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByOrganization(
    organizationId: string,
  ): Promise<FiscalDefaultTaxes | null> {
    // `organizationId` é @unique — findUnique usa o índice e comunica a intenção.
    const row = await this.prisma.scoped.fiscalDefaultTaxes.findUnique({
      where: { organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async save(defaults: FiscalDefaultTaxes): Promise<FiscalDefaultTaxes> {
    const data = {
      icmsGroupId: defaults.icmsGroupId,
      ipiGroupId: defaults.ipiGroupId,
      pisCofinsGroupId: defaults.pisCofinsGroupId,
      issqnGroupId: defaults.issqnGroupId,
      cfop: defaults.cfop,
      updatedAt: defaults.updatedAt,
    };

    // Chaveado por `organizationId` (a coluna @unique), NÃO pelo `id` gerado em
    // memória: torna o INSERT ... ON CONFLICT atômico e evita P2002 quando duas
    // requisições disputam a primeira gravação do padrão da org.
    const row = await this.prisma.scoped.fiscalDefaultTaxes.upsert({
      where: { organizationId: defaults.organizationId },
      create: {
        id: defaults.id,
        organizationId: defaults.organizationId,
        ...data,
        createdAt: defaults.createdAt,
      },
      update: data,
    });

    return this.toEntity(row);
  }

  private toEntity(row: Row): FiscalDefaultTaxes {
    const props: FiscalDefaultTaxesProps = {
      organizationId: row.organizationId,
      icmsGroupId: row.icmsGroupId,
      ipiGroupId: row.ipiGroupId,
      pisCofinsGroupId: row.pisCofinsGroupId,
      issqnGroupId: row.issqnGroupId,
      cfop: row.cfop,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return FiscalDefaultTaxes.with(props, row.id);
  }
}
