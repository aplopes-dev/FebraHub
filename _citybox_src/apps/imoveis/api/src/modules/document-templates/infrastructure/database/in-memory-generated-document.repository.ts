import { randomUUID } from 'crypto';
import { GeneratedDocumentEntity } from '../../domain/entities/generated-document.entity';
import {
  GeneratedDocumentRepository,
  type GeneratedDocumentWritePayload,
} from '../../domain/repositories/generated-document.repository.interface';

export class InMemoryGeneratedDocumentRepository extends GeneratedDocumentRepository {
  private readonly items = new Map<string, GeneratedDocumentEntity>();

  async create(
    payload: GeneratedDocumentWritePayload,
  ): Promise<GeneratedDocumentEntity> {
    await Promise.resolve();
    const now = new Date();
    const entity = GeneratedDocumentEntity.create(
      {
        storeId: payload.storeId,
        templateId: payload.templateId,
        titulo: payload.titulo,
        conteudoRender: payload.conteudoRender,
        dadosSnapshot: payload.dadosSnapshot,
        objectKey: payload.objectKey,
        mimeType: payload.mimeType,
        status: payload.status ?? 'gerado',
        leadId: payload.leadId ?? null,
        dealId: payload.dealId ?? null,
        propertyId: payload.propertyId ?? null,
        appointmentId: payload.appointmentId ?? null,
        transactionId: payload.transactionId ?? null,
        createdAt: now,
        updatedAt: now,
      },
      payload.id ?? randomUUID(),
    );
    this.items.set(entity.id, entity);
    return entity;
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<GeneratedDocumentEntity | null> {
    await Promise.resolve();
    const item = this.items.get(id);
    if (!item || item.storeId !== storeId) return null;
    return item;
  }
}
