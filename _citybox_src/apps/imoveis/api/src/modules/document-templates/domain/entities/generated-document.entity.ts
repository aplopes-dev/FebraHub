import { Entity } from '../../../../shared/core/entity';
import type { ApiGeneratedDocumentStatus } from '../mappers/document-template-enum.mapper';
import type { DocumentMergeSnapshot } from '../../application/policies/document-variable-catalog';

export type GeneratedDocumentProps = {
  storeId: string;
  templateId: string;
  titulo: string;
  conteudoRender: string;
  dadosSnapshot: DocumentMergeSnapshot;
  objectKey: string;
  mimeType: string;
  status: ApiGeneratedDocumentStatus;
  leadId: string | null;
  dealId: string | null;
  propertyId: string | null;
  appointmentId: string | null;
  transactionId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class GeneratedDocumentEntity extends Entity<GeneratedDocumentProps> {
  get storeId(): string {
    return this.props.storeId;
  }
  get templateId(): string {
    return this.props.templateId;
  }
  get titulo(): string {
    return this.props.titulo;
  }
  get conteudoRender(): string {
    return this.props.conteudoRender;
  }
  get dadosSnapshot(): DocumentMergeSnapshot {
    return this.props.dadosSnapshot;
  }
  get objectKey(): string {
    return this.props.objectKey;
  }
  get mimeType(): string {
    return this.props.mimeType;
  }
  get status(): ApiGeneratedDocumentStatus {
    return this.props.status;
  }
  get leadId(): string | null {
    return this.props.leadId;
  }
  get dealId(): string | null {
    return this.props.dealId;
  }
  get propertyId(): string | null {
    return this.props.propertyId;
  }
  get appointmentId(): string | null {
    return this.props.appointmentId;
  }
  get transactionId(): string | null {
    return this.props.transactionId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  protected validate(): void {
    if (!this.props.storeId) throw new Error('storeId is required');
    if (!this.props.templateId) throw new Error('templateId is required');
    if (!this.props.titulo?.trim()) throw new Error('titulo is required');
    if (!this.props.objectKey?.trim()) throw new Error('objectKey is required');
  }

  static create(
    props: GeneratedDocumentProps,
    id?: string,
  ): GeneratedDocumentEntity {
    const entity = new GeneratedDocumentEntity(props, id);
    entity.validate();
    return entity;
  }
}
