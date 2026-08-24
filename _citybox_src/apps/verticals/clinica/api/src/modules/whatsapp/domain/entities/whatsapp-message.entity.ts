import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import type {
  WhatsappMessageDirection,
  WhatsappMessageStatus,
  WhatsappTemplateKey,
} from '../whatsapp.types';

export type WhatsappMessageProps = {
  storeId: string;
  patientId: string;
  appointmentId: string | null;
  direction: WhatsappMessageDirection;
  body: string;
  toE164: string;
  status: WhatsappMessageStatus;
  templateKey: WhatsappTemplateKey | null;
  providerMessageId: string | null;
  correlationId: string | null;
  expiresAt: Date | null;
  attemptCount: number;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class WhatsappMessage extends Entity<WhatsappMessageProps> {
  constructor(props: WhatsappMessageProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {}

  static create(
    props: Optional<
      WhatsappMessageProps,
      | 'createdAt'
      | 'updatedAt'
      | 'status'
      | 'appointmentId'
      | 'templateKey'
      | 'providerMessageId'
      | 'correlationId'
      | 'expiresAt'
      | 'attemptCount'
      | 'lastError'
    >,
    id?: string,
  ): WhatsappMessage {
    const now = new Date();
    return new WhatsappMessage(
      {
        storeId: props.storeId,
        patientId: props.patientId,
        appointmentId: props.appointmentId ?? null,
        direction: props.direction,
        body: props.body,
        toE164: props.toE164,
        status: props.status ?? (props.direction === 'inbound' ? 'received' : 'queued'),
        templateKey: props.templateKey ?? null,
        providerMessageId: props.providerMessageId ?? null,
        correlationId: props.correlationId ?? null,
        expiresAt: props.expiresAt ?? null,
        attemptCount: props.attemptCount ?? 0,
        lastError: props.lastError ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  static with(props: WhatsappMessageProps, id: string): WhatsappMessage {
    return new WhatsappMessage(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get patientId() {
    return this.props.patientId;
  }
  get appointmentId() {
    return this.props.appointmentId;
  }
  get direction() {
    return this.props.direction;
  }
  get body() {
    return this.props.body;
  }
  get toE164() {
    return this.props.toE164;
  }
  get status() {
    return this.props.status;
  }
  get templateKey() {
    return this.props.templateKey;
  }
  get providerMessageId() {
    return this.props.providerMessageId;
  }
  get correlationId() {
    return this.props.correlationId;
  }
  get expiresAt() {
    return this.props.expiresAt;
  }
  get attemptCount() {
    return this.props.attemptCount;
  }
  get lastError() {
    return this.props.lastError;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  markSent(providerMessageId?: string | null): void {
    this.props.status = 'sent';
    this.props.providerMessageId = providerMessageId ?? this.props.providerMessageId;
    this.props.attemptCount += 1;
    this.props.lastError = null;
    this.props.updatedAt = new Date();
  }

  markDelivered(): void {
    if (this.props.status === 'failed' || this.props.status === 'received') {
      return;
    }
    this.props.status = 'delivered';
    this.props.updatedAt = new Date();
  }

  markFailed(error: string): void {
    this.props.status = 'failed';
    this.props.attemptCount += 1;
    this.props.lastError = error;
    this.props.updatedAt = new Date();
  }

  isExpired(now = new Date()): boolean {
    return Boolean(this.props.expiresAt && this.props.expiresAt.getTime() < now.getTime());
  }
}
