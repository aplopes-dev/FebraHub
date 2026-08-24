import { Entity } from '../../../../shared/core/entity';
import type { ApiDocumentTemplateType } from '../mappers/document-template-enum.mapper';

export type DocumentTemplateProps = {
  storeId: string;
  nome: string;
  tipo: ApiDocumentTemplateType;
  conteudoHtml: string;
  ativo: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class DocumentTemplateEntity extends Entity<DocumentTemplateProps> {
  get storeId(): string {
    return this.props.storeId;
  }
  get nome(): string {
    return this.props.nome;
  }
  get tipo(): ApiDocumentTemplateType {
    return this.props.tipo;
  }
  get conteudoHtml(): string {
    return this.props.conteudoHtml;
  }
  get ativo(): boolean {
    return this.props.ativo;
  }
  get isDefault(): boolean {
    return this.props.isDefault;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  protected validate(): void {
    if (!this.props.storeId) throw new Error('storeId is required');
    if (!this.props.nome?.trim()) throw new Error('nome is required');
    if (!this.props.conteudoHtml?.trim()) {
      throw new Error('conteudoHtml is required');
    }
  }

  with(patch: Partial<DocumentTemplateProps>): DocumentTemplateEntity {
    return DocumentTemplateEntity.create({ ...this.props, ...patch }, this.id);
  }

  static create(
    props: DocumentTemplateProps,
    id?: string,
  ): DocumentTemplateEntity {
    const entity = new DocumentTemplateEntity(
      {
        ...props,
        nome: props.nome.trim(),
        conteudoHtml: props.conteudoHtml,
      },
      id,
    );
    entity.validate();
    return entity;
  }
}
