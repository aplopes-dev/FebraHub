import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  NfeIssuance,
  type NfeEnvironment,
  type NfeIssuanceProps,
} from '../../domain/entities/nfe-issuance.entity';
import { NfeIssuanceRepository } from '../../domain/repositories/nfe-issuance.repository.interface';

type Row = {
  id: string;
  organizationId: string;
  saleOrderId: string;
  companyId: string;
  accessKey: string | null;
  protocol: string | null;
  status: string;
  environment: string;
  errorCode: string | null;
  errorMessage: string | null;
  fiscalDocumentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaNfeIssuanceRepository extends NfeIssuanceRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findBySaleOrderId(
    organizationId: string,
    saleOrderId: string,
  ): Promise<NfeIssuance | null> {
    const row = await this.prisma.scoped.nfeIssuance.findFirst({
      where: { organizationId, saleOrderId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<NfeIssuance | null> {
    const row = await this.prisma.scoped.nfeIssuance.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findBySaleOrderIds(
    organizationId: string,
    saleOrderIds: string[],
  ): Promise<NfeIssuance[]> {
    if (saleOrderIds.length === 0) return [];
    const rows = await this.prisma.scoped.nfeIssuance.findMany({
      where: { organizationId, saleOrderId: { in: saleOrderIds } },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async listByOrganization(organizationId: string): Promise<NfeIssuance[]> {
    const rows = await this.prisma.scoped.nfeIssuance.findMany({
      where: { organizationId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map((row) => this.toEntity(row));
  }

  async save(issuance: NfeIssuance): Promise<NfeIssuance> {
    const data = {
      saleOrderId: issuance.saleOrderId,
      companyId: issuance.companyId,
      accessKey: issuance.accessKey,
      protocol: issuance.protocol,
      status: issuance.status,
      environment: issuance.environment,
      errorCode: issuance.errorCode,
      errorMessage: issuance.errorMessage,
      fiscalDocumentId: issuance.fiscalDocumentId,
      updatedAt: issuance.updatedAt,
    };
    const row = await this.prisma.scoped.nfeIssuance.upsert({
      where: { id: issuance.id },
      create: {
        id: issuance.id,
        organizationId: issuance.organizationId,
        ...data,
        createdAt: issuance.createdAt,
      },
      update: data,
    });
    return this.toEntity(row);
  }

  private toEntity(row: Row): NfeIssuance {
    const props: NfeIssuanceProps = {
      organizationId: row.organizationId,
      saleOrderId: row.saleOrderId,
      companyId: row.companyId,
      accessKey: row.accessKey,
      protocol: row.protocol,
      status: row.status,
      // Cast estreitado por NfeIssuance.validate() no construtor.
      environment: row.environment as NfeEnvironment,
      errorCode: row.errorCode,
      errorMessage: row.errorMessage,
      fiscalDocumentId: row.fiscalDocumentId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return NfeIssuance.with(props, row.id);
  }
}
