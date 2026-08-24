import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import type { WhatsappTemplateKey } from '../whatsapp.types';

export type WhatsappTemplateProps = {
  storeId: string;
  key: WhatsappTemplateKey;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

export class WhatsappTemplate extends Entity<WhatsappTemplateProps> {
  constructor(props: WhatsappTemplateProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {}

  static create(
    props: Optional<WhatsappTemplateProps, 'createdAt' | 'updatedAt'>,
    id?: string,
  ): WhatsappTemplate {
    const now = new Date();
    return new WhatsappTemplate(
      {
        ...props,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  static with(props: WhatsappTemplateProps, id: string): WhatsappTemplate {
    return new WhatsappTemplate(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get key() {
    return this.props.key;
  }
  get body() {
    return this.props.body;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  updateBody(body: string): void {
    this.props.body = body;
    this.props.updatedAt = new Date();
  }
}
