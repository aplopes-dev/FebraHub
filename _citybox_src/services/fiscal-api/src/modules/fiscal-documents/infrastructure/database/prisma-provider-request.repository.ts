import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ProviderRequestRepository } from '../../domain/repositories/provider-request.repository.interface';
import {
  ProviderRequest,
  type ProviderRequestProps,
} from '../../domain/entities/provider-request.entity';
import type { FiscalDocumentProvider } from '../../domain/entities/fiscal-document.entity';

type ProviderRequestRow = {
  id: string;
  fiscalDocumentId: string | null;
  provider: string;
  operation: string;
  requestXmlObjectKey: string | null;
  responseXmlObjectKey: string | null;
  requestPayload: unknown;
  responsePayload: unknown;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
};

@Injectable()
export class PrismaProviderRequestRepository extends ProviderRequestRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async save(request: ProviderRequest): Promise<ProviderRequest> {
    const row = await this.prisma.providerRequest.create({
      data: {
        id: request.id,
        fiscalDocumentId: request.fiscalDocumentId,
        provider: request.provider,
        operation: request.operation,
        status: request.status,
        errorMessage: request.errorMessage,
        createdAt: request.createdAt,
        // FR-011 — sem estes dois campos a trilha de auditoria fica vazia: o
        // caso de uso monta o payload com status, protocolo e código de erro
        // do órgão fiscal e o repositório os descartava. Mesmo cast de Json
        // usado em `prisma-fiscal-document.repository.ts` (o domínio trafega
        // `unknown`, o Prisma exige `InputJsonValue`).
        requestXmlObjectKey: request.requestXmlObjectKey,
        responseXmlObjectKey: request.responseXmlObjectKey,
        requestPayload: (request.requestPayload ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        responsePayload: (request.responsePayload ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
    return this.toEntity(row);
  }

  async findByFiscalDocumentId(
    fiscalDocumentId: string,
  ): Promise<ProviderRequest[]> {
    const rows = await this.prisma.providerRequest.findMany({
      where: { fiscalDocumentId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  private toEntity(row: ProviderRequestRow): ProviderRequest {
    const props: ProviderRequestProps = {
      fiscalDocumentId: row.fiscalDocumentId,
      provider: row.provider as FiscalDocumentProvider,
      operation: row.operation,
      requestXmlObjectKey: row.requestXmlObjectKey,
      responseXmlObjectKey: row.responseXmlObjectKey,
      requestPayload: row.requestPayload as Record<string, unknown> | null,
      responsePayload: row.responsePayload as Record<string, unknown> | null,
      status: row.status as 'SUCCESS' | 'ERROR' | 'TIMEOUT',
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
    };
    return ProviderRequest.with(props, row.id);
  }
}
