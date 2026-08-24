import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma, type $Enums } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  AgentFolderDocumentEntity,
  type DocumentFolderId,
  type DocumentSource,
} from '../../domain/entities/agent-folder-document.entity';
import {
  AgentFolderDocumentRepository,
  type AgentFolderDocumentCreatePayload,
  type AgentFolderDocumentUpdatePayload,
} from '../../domain/repositories/agent-folder-document.repository.interface';

type AgentFolderDocumentRow = Prisma.AgentFolderDocumentGetPayload<object>;

/** Domínio usa kebab (`profile-legal`); o enum Prisma usa snake. */
function toPrismaSource(source: DocumentSource): $Enums.AgentDocumentSource {
  // linked-* nunca são persistidos nesta tabela.
  return source === 'profile-legal' ? 'profile_legal' : 'manual';
}

function toDomainSource(source: $Enums.AgentDocumentSource): DocumentSource {
  return source === 'profile_legal' ? 'profile-legal' : 'manual';
}

@Injectable()
export class PrismaAgentFolderDocumentRepository extends AgentFolderDocumentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findAll(
    storeId: string,
    agentId: string,
    folderId?: DocumentFolderId,
  ): Promise<AgentFolderDocumentEntity[]> {
    const rows = await this.prisma.agentFolderDocument.findMany({
      where: { storeId, agentId, ...(folderId ? { folderId } : {}) },
      orderBy: { createdAt: Prisma.SortOrder.desc },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findById(
    storeId: string,
    agentId: string,
    documentId: string,
  ): Promise<AgentFolderDocumentEntity | null> {
    const row = await this.prisma.agentFolderDocument.findFirst({
      where: { id: documentId, storeId, agentId },
    });
    return row ? this.toEntity(row) : null;
  }

  async create(
    storeId: string,
    agentId: string,
    payload: AgentFolderDocumentCreatePayload,
  ): Promise<AgentFolderDocumentEntity> {
    const row = await this.prisma.agentFolderDocument.create({
      data: {
        id: randomUUID(),
        storeId,
        agentId,
        folderId: payload.folderId,
        name: payload.name,
        status: payload.status,
        sizeLabel: payload.sizeLabel,
        detailsLabel: payload.detailsLabel,
        objectKey: payload.objectKey,
        mimeType: payload.mimeType,
        source: toPrismaSource(payload.source),
        legalKind: payload.legalKind,
      },
    });
    return this.toEntity(row);
  }

  async update(
    storeId: string,
    agentId: string,
    documentId: string,
    payload: AgentFolderDocumentUpdatePayload,
  ): Promise<AgentFolderDocumentEntity | null> {
    const existing = await this.prisma.agentFolderDocument.findFirst({
      where: { id: documentId, storeId, agentId },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await this.prisma.agentFolderDocument.update({
      where: { id: existing.id },
      data: {
        status: payload.status,
        detailsLabel: payload.detailsLabel,
      },
    });
    return this.toEntity(row);
  }

  async delete(
    storeId: string,
    agentId: string,
    documentId: string,
  ): Promise<boolean> {
    const { count } = await this.prisma.agentFolderDocument.deleteMany({
      where: { id: documentId, storeId, agentId },
    });
    return count > 0;
  }

  async deleteAllForAgent(storeId: string, agentId: string): Promise<string[]> {
    const rows = await this.prisma.agentFolderDocument.findMany({
      where: { storeId, agentId },
      select: { objectKey: true },
    });
    await this.prisma.agentFolderDocument.deleteMany({
      where: { storeId, agentId },
    });
    return rows
      .map((row) => row.objectKey)
      .filter((key): key is string => Boolean(key));
  }

  private toEntity(row: AgentFolderDocumentRow): AgentFolderDocumentEntity {
    return AgentFolderDocumentEntity.create(
      {
        storeId: row.storeId,
        agentId: row.agentId,
        folderId: row.folderId,
        name: row.name,
        status: row.status,
        sizeLabel: row.sizeLabel,
        detailsLabel: row.detailsLabel,
        objectKey: row.objectKey,
        mimeType: row.mimeType,
        source: toDomainSource(row.source),
        legalKind: row.legalKind,
        addedAt: row.createdAt,
      },
      row.id,
    );
  }
}
