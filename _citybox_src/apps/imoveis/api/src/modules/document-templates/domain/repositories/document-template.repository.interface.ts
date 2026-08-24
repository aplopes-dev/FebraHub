import type { DocumentTemplateEntity } from '../entities/document-template.entity';
import type { ApiDocumentTemplateType } from '../mappers/document-template-enum.mapper';

export type ListDocumentTemplatesFilters = {
  page: number;
  perPage: number;
  search?: string;
  tipo?: ApiDocumentTemplateType;
  ativo?: boolean;
};

export type ListDocumentTemplatesResult = {
  items: DocumentTemplateEntity[];
  total: number;
};

export type DocumentTemplateWritePayload = {
  storeId: string;
  nome: string;
  tipo: ApiDocumentTemplateType;
  conteudoHtml: string;
  ativo?: boolean;
  isDefault?: boolean;
};

export abstract class DocumentTemplateRepository {
  abstract findMany(
    storeId: string,
    filters: ListDocumentTemplatesFilters,
  ): Promise<ListDocumentTemplatesResult>;

  abstract findById(
    storeId: string,
    id: string,
  ): Promise<DocumentTemplateEntity | null>;

  abstract listActiveByTypes(
    storeId: string,
    tipos: readonly ApiDocumentTemplateType[],
  ): Promise<DocumentTemplateEntity[]>;

  abstract create(
    payload: DocumentTemplateWritePayload,
  ): Promise<DocumentTemplateEntity>;

  abstract update(
    storeId: string,
    id: string,
    payload: Partial<Omit<DocumentTemplateWritePayload, 'storeId'>>,
  ): Promise<DocumentTemplateEntity | null>;

  abstract delete(storeId: string, id: string): Promise<boolean>;

  abstract countByStore(storeId: string): Promise<number>;
}
