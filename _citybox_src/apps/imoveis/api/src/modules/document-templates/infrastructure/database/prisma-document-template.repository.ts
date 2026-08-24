import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { DocumentTemplateEntity } from '../../domain/entities/document-template.entity';
import {
  DocumentTemplateRepository,
  type DocumentTemplateWritePayload,
  type ListDocumentTemplatesFilters,
  type ListDocumentTemplatesResult,
} from '../../domain/repositories/document-template.repository.interface';
import type { ApiDocumentTemplateType } from '../../domain/mappers/document-template-enum.mapper';
import {
  templateTypeToApi,
  templateTypeToPrisma,
} from '../../domain/mappers/document-template-enum.mapper';
import { Prisma } from '../../../../../generated/prisma/client';
import { isPrismaTableMissingError } from '../../../../shared/infra/prisma/is-prisma-table-missing-error';

@Injectable()
export class PrismaDocumentTemplateRepository extends DocumentTemplateRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(
    storeId: string,
    filters: ListDocumentTemplatesFilters,
  ): Promise<ListDocumentTemplatesResult> {
    const where = {
      storeId,
      ...(filters.tipo ? { tipo: templateTypeToPrisma(filters.tipo) } : {}),
      ...(filters.ativo === undefined ? {} : { ativo: filters.ativo }),
      ...(filters.search?.trim()
        ? {
            nome: {
              contains: filters.search.trim(),
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };
    try {
      const [total, rows] = await this.prisma.$transaction([
        this.prisma.documentTemplate.count({ where }),
        this.prisma.documentTemplate.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip: (filters.page - 1) * filters.perPage,
          take: filters.perPage,
        }),
      ]);
      return { items: rows.map((row) => this.toEntity(row)), total };
    } catch (error) {
      if (isPrismaTableMissingError(error)) {
        return { items: [], total: 0 };
      }
      throw error;
    }
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<DocumentTemplateEntity | null> {
    const row = await this.prisma.documentTemplate.findFirst({
      where: { id, storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async listActiveByTypes(
    storeId: string,
    tipos: readonly ApiDocumentTemplateType[],
  ): Promise<DocumentTemplateEntity[]> {
    if (tipos.length === 0) return [];
    const rows = await this.prisma.documentTemplate.findMany({
      where: {
        storeId,
        ativo: true,
        tipo: { in: tipos.map(templateTypeToPrisma) },
      },
      orderBy: [{ isDefault: 'desc' }, { nome: 'asc' }],
    });
    return rows.map((row) => this.toEntity(row));
  }

  async create(
    payload: DocumentTemplateWritePayload,
  ): Promise<DocumentTemplateEntity> {
    if (payload.isDefault) {
      await this.clearDefault(payload.storeId, payload.tipo);
    }
    const row = await this.prisma.documentTemplate.create({
      data: {
        id: randomUUID(),
        storeId: payload.storeId,
        nome: payload.nome.trim(),
        tipo: templateTypeToPrisma(payload.tipo),
        conteudoHtml: payload.conteudoHtml,
        ativo: payload.ativo ?? true,
        isDefault: payload.isDefault ?? false,
      },
    });
    return this.toEntity(row);
  }

  async update(
    storeId: string,
    id: string,
    payload: Partial<Omit<DocumentTemplateWritePayload, 'storeId'>>,
  ): Promise<DocumentTemplateEntity | null> {
    const existing = await this.prisma.documentTemplate.findFirst({
      where: { id, storeId },
    });
    if (!existing) return null;
    const tipo = payload.tipo
      ? templateTypeToPrisma(payload.tipo)
      : existing.tipo;
    if (payload.isDefault) {
      await this.clearDefault(storeId, templateTypeToApi(tipo), id);
    }
    const row = await this.prisma.documentTemplate.update({
      where: { id },
      data: {
        ...(payload.nome !== undefined ? { nome: payload.nome.trim() } : {}),
        ...(payload.tipo !== undefined ? { tipo } : {}),
        ...(payload.conteudoHtml !== undefined
          ? { conteudoHtml: payload.conteudoHtml }
          : {}),
        ...(payload.ativo !== undefined ? { ativo: payload.ativo } : {}),
        ...(payload.isDefault !== undefined
          ? { isDefault: payload.isDefault }
          : {}),
      },
    });
    return this.toEntity(row);
  }

  async delete(storeId: string, id: string): Promise<boolean> {
    const existing = await this.prisma.documentTemplate.findFirst({
      where: { id, storeId },
    });
    if (!existing) return false;
    await this.prisma.documentTemplate.delete({ where: { id } });
    return true;
  }

  async countByStore(storeId: string): Promise<number> {
    return this.prisma.documentTemplate.count({ where: { storeId } });
  }

  private async clearDefault(
    storeId: string,
    tipo: ApiDocumentTemplateType,
    exceptId?: string,
  ): Promise<void> {
    await this.prisma.documentTemplate.updateMany({
      where: {
        storeId,
        tipo: templateTypeToPrisma(tipo),
        isDefault: true,
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      data: { isDefault: false },
    });
  }

  private toEntity(row: Prisma.DocumentTemplateGetPayload<object>): DocumentTemplateEntity {
    return DocumentTemplateEntity.create(
      {
        storeId: row.storeId,
        nome: row.nome,
        tipo: templateTypeToApi(row.tipo),
        conteudoHtml: row.conteudoHtml,
        ativo: row.ativo,
        isDefault: row.isDefault,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
