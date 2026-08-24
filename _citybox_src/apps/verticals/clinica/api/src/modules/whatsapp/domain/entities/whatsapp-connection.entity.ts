import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import type { WhatsappConnectionStatus } from '../whatsapp.types';

export type WhatsappConnectionProps = {
  storeId: string;
  status: WhatsappConnectionStatus;
  phoneE164: string | null;
  lastError: string | null;
  authStateKey: string;
  qrBase64: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class WhatsappConnection extends Entity<WhatsappConnectionProps> {
  constructor(props: WhatsappConnectionProps, id?: string) {
    super(props, id ?? props.storeId);
  }

  protected validate(): void {}

  static create(
    props: Optional<WhatsappConnectionProps, 'createdAt' | 'updatedAt' | 'status' | 'phoneE164' | 'lastError' | 'authStateKey' | 'qrBase64'>,
  ): WhatsappConnection {
    const now = new Date();
    return new WhatsappConnection({
      storeId: props.storeId,
      status: props.status ?? 'disconnected',
      phoneE164: props.phoneE164 ?? null,
      lastError: props.lastError ?? null,
      authStateKey: props.authStateKey ?? `whatsapp/${props.storeId}`,
      qrBase64: props.qrBase64 ?? null,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    });
  }

  static with(props: WhatsappConnectionProps): WhatsappConnection {
    return new WhatsappConnection(props);
  }

  get storeId() {
    return this.props.storeId;
  }
  get status() {
    return this.props.status;
  }
  get phoneE164() {
    return this.props.phoneE164;
  }
  get lastError() {
    return this.props.lastError;
  }
  get authStateKey() {
    return this.props.authStateKey;
  }
  get qrBase64() {
    return this.props.qrBase64;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  markQrRequested(): void {
    this.props.status = 'qr_pending';
    this.props.qrBase64 = null;
    this.props.lastError = null;
    this.props.updatedAt = new Date();
  }

  markQrPending(qrBase64: string): void {
    this.props.status = 'qr_pending';
    this.props.qrBase64 = qrBase64;
    this.props.lastError = null;
    this.props.updatedAt = new Date();
  }

  markConnected(phoneE164: string | null): void {
    this.props.status = 'connected';
    this.props.phoneE164 = phoneE164;
    this.props.qrBase64 = null;
    this.props.lastError = null;
    this.props.updatedAt = new Date();
  }

  markDisconnected(): void {
    this.props.status = 'disconnected';
    this.props.qrBase64 = null;
    this.props.phoneE164 = null;
    this.props.updatedAt = new Date();
  }

  markError(message: string): void {
    this.props.status = 'error';
    this.props.lastError = message;
    this.props.qrBase64 = null;
    this.props.updatedAt = new Date();
  }
}
