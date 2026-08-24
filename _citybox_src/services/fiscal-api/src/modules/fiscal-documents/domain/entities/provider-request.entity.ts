import { Entity } from '../../../../shared/core/entity';
import type { FiscalDocumentProvider } from './fiscal-document.entity';

/// Log de auditoria de toda tentativa de transmissão a um provider externo
/// (FR-011) — distinto de FiscalEvent (resultado de negócio); este é o log
/// técnico bruto de cada chamada, incluindo a tentativa de emissão inicial.
export type ProviderRequestProps = {
  fiscalDocumentId: string | null;
  provider: FiscalDocumentProvider;
  operation: string;
  requestXmlObjectKey: string | null;
  responseXmlObjectKey: string | null;
  requestPayload: Record<string, unknown> | null;
  responsePayload: Record<string, unknown> | null;
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  errorMessage: string | null;
  createdAt: Date;
};

export class ProviderRequest extends Entity<ProviderRequestProps> {
  constructor(props: ProviderRequestProps, id: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Registro de auditoria — sem regra de negócio a validar na reconstrução.
  }

  public static with(props: ProviderRequestProps, id: string): ProviderRequest {
    return new ProviderRequest(props, id);
  }

  get fiscalDocumentId() {
    return this.props.fiscalDocumentId;
  }
  get provider() {
    return this.props.provider;
  }
  get operation() {
    return this.props.operation;
  }
  get status() {
    return this.props.status;
  }
  get errorMessage() {
    return this.props.errorMessage;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  /// Trilha de auditoria (FR-011) — expostos para o repositório persistir.
  /// Sem estes getters os campos existiam no schema e na entidade, mas eram
  /// inalcançáveis na escrita.
  get requestXmlObjectKey() {
    return this.props.requestXmlObjectKey;
  }
  get responseXmlObjectKey() {
    return this.props.responseXmlObjectKey;
  }
  get requestPayload() {
    return this.props.requestPayload;
  }
  get responsePayload() {
    return this.props.responsePayload;
  }
}
