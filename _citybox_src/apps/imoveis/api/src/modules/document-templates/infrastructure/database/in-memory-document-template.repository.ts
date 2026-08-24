import { randomUUID } from 'crypto';
import { DocumentTemplateEntity } from '../../domain/entities/document-template.entity';
import {
  DocumentTemplateRepository,
  type DocumentTemplateWritePayload,
  type ListDocumentTemplatesFilters,
  type ListDocumentTemplatesResult,
} from '../../domain/repositories/document-template.repository.interface';
import type { ApiDocumentTemplateType } from '../../domain/mappers/document-template-enum.mapper';

export class InMemoryDocumentTemplateRepository extends DocumentTemplateRepository {
  private readonly items = new Map<string, DocumentTemplateEntity>();

  async findMany(
    storeId: string,
    filters: ListDocumentTemplatesFilters,
  ): Promise<ListDocumentTemplatesResult> {
    await Promise.resolve();
    let rows = [...this.items.values()].filter((t) => t.storeId === storeId);
    if (filters.tipo) rows = rows.filter((t) => t.tipo === filters.tipo);
    if (filters.ativo !== undefined) {
      rows = rows.filter((t) => t.ativo === filters.ativo);
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      rows = rows.filter((t) => t.nome.toLowerCase().includes(q));
    }
    rows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    const total = rows.length;
    const start = (filters.page - 1) * filters.perPage;
    return { items: rows.slice(start, start + filters.perPage), total };
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<DocumentTemplateEntity | null> {
    await Promise.resolve();
    const item = this.items.get(id);
    if (!item || item.storeId !== storeId) return null;
    return item;
  }

  async listActiveByTypes(
    storeId: string,
    tipos: readonly ApiDocumentTemplateType[],
  ): Promise<DocumentTemplateEntity[]> {
    await Promise.resolve();
    return [...this.items.values()].filter(
      (t) => t.storeId === storeId && t.ativo && tipos.includes(t.tipo),
    );
  }

  async create(
    payload: DocumentTemplateWritePayload,
  ): Promise<DocumentTemplateEntity> {
    await Promise.resolve();
    if (payload.isDefault) this.clearDefault(payload.storeId, payload.tipo);
    const now = new Date();
    const entity = DocumentTemplateEntity.create(
      {
        storeId: payload.storeId,
        nome: payload.nome,
        tipo: payload.tipo,
        conteudoHtml: payload.conteudoHtml,
        ativo: payload.ativo ?? true,
        isDefault: payload.isDefault ?? false,
        createdAt: now,
        updatedAt: now,
      },
      randomUUID(),
    );
    this.items.set(entity.id, entity);
    return entity;
  }

  async update(
    storeId: string,
    id: string,
    payload: Partial<Omit<DocumentTemplateWritePayload, 'storeId'>>,
  ): Promise<DocumentTemplateEntity | null> {
    const existing = await this.findById(storeId, id);
    if (!existing) return null;
    const tipo = payload.tipo ?? existing.tipo;
    if (payload.isDefault) this.clearDefault(storeId, tipo, id);
    const next = existing.with({
      nome: payload.nome ?? existing.nome,
      tipo,
      conteudoHtml: payload.conteudoHtml ?? existing.conteudoHtml,
      ativo: payload.ativo ?? existing.ativo,
      isDefault: payload.isDefault ?? existing.isDefault,
      updatedAt: new Date(),
    });
    this.items.set(id, next);
    return next;
  }

  async delete(storeId: string, id: string): Promise<boolean> {
    const existing = await this.findById(storeId, id);
    if (!existing) return false;
    this.items.delete(id);
    return true;
  }

  async countByStore(storeId: string): Promise<number> {
    await Promise.resolve();
    return [...this.items.values()].filter((t) => t.storeId === storeId).length;
  }

  private clearDefault(
    storeId: string,
    tipo: ApiDocumentTemplateType,
    exceptId?: string,
  ): void {
    for (const [id, item] of this.items) {
      if (item.storeId !== storeId || item.tipo !== tipo) continue;
      if (exceptId && id === exceptId) continue;
      if (!item.isDefault) continue;
      this.items.set(id, item.with({ isDefault: false }));
    }
  }
}
