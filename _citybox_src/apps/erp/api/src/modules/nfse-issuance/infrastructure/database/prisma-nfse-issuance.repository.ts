import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  NfseIssuance,
  type NfseEnvironment,
  type NfseIssuanceProps,
} from '../../domain/entities/nfse-issuance.entity';
import { NfseIssuanceRepository } from '../../domain/repositories/nfse-issuance.repository.interface';

type Row = {
  id: string;
  organizationId: string;
  companyId: string;
  sourceSystem: string;
  externalReference: string;
  idempotencyKey: string;
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
export class PrismaNfseIssuanceRepository extends NfseIssuanceRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByIdempotency(
    organizationId: string,
    sourceSystem: string,
    externalReference: string,
    idempotencyKey: string,
  ): Promise<NfseIssuance | null> {
    const row = await this.prisma.scoped.nfseIssuance.findFirst({
      where: {
        organizationId,
        sourceSystem,
        externalReference,
        idempotencyKey,
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<NfseIssuance | null> {
    const row = await this.prisma.scoped.nfseIssuance.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async listByOrganization(organizationId: string): Promise<NfseIssuance[]> {
    const rows = await this.prisma.scoped.nfseIssuance.findMany({
      where: { organizationId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map((row) => this.toEntity(row));
  }

  async save(issuance: NfseIssuance): Promise<NfseIssuance> {
    const data = {
      companyId: issuance.companyId,
      sourceSystem: issuance.sourceSystem,
      externalReference: issuance.externalReference,
      idempotencyKey: issuance.idempotencyKey,
      accessKey: issuance.accessKey,
      protocol: issuance.protocol,
      status: issuance.status,
      environment: issuance.environment,
      errorCode: issuance.errorCode,
      errorMessage: issuance.errorMessage,
      fiscalDocumentId: issuance.fiscalDocumentId,
      updatedAt: issuance.updatedAt,
    };
    const row = await this.prisma.scoped.nfseIssuance.upsert({
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

  private toEntity(row: Row): NfseIssuance {
    const props: NfseIssuanceProps = {
      organizationId: row.organizationId,
      companyId: row.companyId,
      sourceSystem: row.sourceSystem,
      externalReference: row.externalReference,
      idempotencyKey: row.idempotencyKey,
      accessKey: row.accessKey,
      protocol: row.protocol,
      status: row.status,
      // Cast estreitado por NfseIssuance.validate() no construtor.
      environment: row.environment as NfseEnvironment,
      errorCode: row.errorCode,
      errorMessage: row.errorMessage,
      fiscalDocumentId: row.fiscalDocumentId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return NfseIssuance.with(props, row.id);
  }
}
