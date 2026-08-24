import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { GeneratedDocumentEntity } from '../../domain/entities/generated-document.entity';
import {
  GeneratedDocumentRepository,
  type GeneratedDocumentWritePayload,
} from '../../domain/repositories/generated-document.repository.interface';
import type { DocumentMergeSnapshot } from '../../application/policies/document-variable-catalog';
import { generatedStatusToApi } from '../../domain/mappers/document-template-enum.mapper';

@Injectable()
export class PrismaGeneratedDocumentRepository extends GeneratedDocumentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(
    payload: GeneratedDocumentWritePayload,
  ): Promise<GeneratedDocumentEntity> {
    const row = await this.prisma.generatedDocument.create({
      data: {
        id: payload.id ?? randomUUID(),
        storeId: payload.storeId,
        templateId: payload.templateId,
        titulo: payload.titulo,
        conteudoRender: payload.conteudoRender,
        dadosSnapshot: payload.dadosSnapshot as Prisma.InputJsonValue,
        objectKey: payload.objectKey,
        mimeType: payload.mimeType,
        status: payload.status ?? 'gerado',
        leadId: payload.leadId ?? null,
        dealId: payload.dealId ?? null,
        propertyId: payload.propertyId ?? null,
        appointmentId: payload.appointmentId ?? null,
        transactionId: payload.transactionId ?? null,
      },
    });
    return this.toEntity(row);
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<GeneratedDocumentEntity | null> {
    const row = await this.prisma.generatedDocument.findFirst({
      where: { id, storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  private toEntity(row: {
    id: string;
    storeId: string;
    templateId: string;
    titulo: string;
    conteudoRender: string;
    dadosSnapshot: Prisma.JsonValue;
    objectKey: string;
    mimeType: string;
    status: string;
    leadId: string | null;
    dealId: string | null;
    propertyId: string | null;
    appointmentId: string | null;
    transactionId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): GeneratedDocumentEntity {
    return GeneratedDocumentEntity.create(
      {
        storeId: row.storeId,
        templateId: row.templateId,
        titulo: row.titulo,
        conteudoRender: row.conteudoRender,
        dadosSnapshot: row.dadosSnapshot as DocumentMergeSnapshot,
        objectKey: row.objectKey,
        mimeType: row.mimeType,
        status: generatedStatusToApi(row.status),
        leadId: row.leadId,
        dealId: row.dealId,
        propertyId: row.propertyId,
        appointmentId: row.appointmentId,
        transactionId: row.transactionId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
