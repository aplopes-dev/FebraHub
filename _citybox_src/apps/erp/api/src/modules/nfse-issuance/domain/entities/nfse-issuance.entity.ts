import { Entity } from '../../../../shared/core/entity';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import type { Optional } from '../../../../shared/core/types/optional.type';

/** Ambiente de emissão. Nesta plataforma só HOMOLOGATION (produção proibida). */
export const NFSE_ENVIRONMENTS = ['HOMOLOGATION', 'PRODUCTION'] as const;
export type NfseEnvironment = (typeof NFSE_ENVIRONMENTS)[number];

export type NfseIssuanceProps = {
  organizationId: string;
  /** Emitente na fiscal-api (Company.id). */
  companyId: string;
  sourceSystem: string;
  externalReference: string;
  idempotencyKey: string;
  /** Chave de acesso / protocolo do órgão — nulos enquanto pendente/rejeitado. */
  accessKey: string | null;
  protocol: string | null;
  /** Espelha o status da fiscal-api (SIGNED, AUTHORIZED, REJECTED, …). */
  status: string;
  environment: NfseEnvironment;
  /**
   * Código/mensagem de rejeição do órgão (spec erp/028) — nulos quando
   * AUTHORIZED ou quando a falha foi de transporte/config (nunca chegou a
   * ser avaliada pelo órgão). A `fiscal-api` já devolve os dois na resposta
   * de `POST /v1/nfse`; antes desta spec o erp-api os descartava.
   */
  errorCode: string | null;
  errorMessage: string | null;
  /**
   * Id do documento na fiscal-api (spec erp/029) — falta dele impedia montar
   * a URL de download (`GET /v1/nfse/:id/xml|danfse`). Nulo só no caso
   * teórico de uma emissão que nunca chegou a criar o documento do lado da
   * fiscal-api (hoje isso sempre lança antes de `NfseIssuance.create`).
   */
  fiscalDocumentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateProps = Optional<
  NfseIssuanceProps,
  | 'accessKey'
  | 'protocol'
  | 'errorCode'
  | 'errorMessage'
  | 'fiscalDocumentId'
  | 'createdAt'
  | 'updatedAt'
>;

/**
 * Vínculo do ERP com uma NFS-e emitida na fiscal-api (spec erp/018). O erp-api
 * gera a idempotência e registra o documento (chave/protocolo/status); a
 * fiscal-api é a dona do documento — esta entidade é o ponteiro do ERP para ele
 * e a base da idempotência local (não reemitir a mesma operação).
 */
export class NfseIssuance extends Entity<NfseIssuanceProps> {
  constructor(props: NfseIssuanceProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    for (const [field, value] of [
      ['companyId', this.props.companyId],
      ['sourceSystem', this.props.sourceSystem],
      ['externalReference', this.props.externalReference],
      ['idempotencyKey', this.props.idempotencyKey],
      ['status', this.props.status],
    ] as const) {
      if (!value || value.trim().length === 0) {
        throw new ValidatorDomainError({
          internalMessage: `NfseIssuance.${field} vazio`,
          externalMessage: 'Dados da emissão incompletos.',
          context: NfseIssuance.name,
        });
      }
    }
    if (!NFSE_ENVIRONMENTS.includes(this.props.environment)) {
      throw new ValidatorDomainError({
        internalMessage: `NfseIssuance environment inválido: ${this.props.environment}`,
        externalMessage: 'Ambiente de emissão inválido.',
        context: NfseIssuance.name,
      });
    }
  }

  static create(props: CreateProps): NfseIssuance {
    const now = new Date();
    return new NfseIssuance({
      ...props,
      accessKey: props.accessKey ?? null,
      protocol: props.protocol ?? null,
      errorCode: props.errorCode ?? null,
      errorMessage: props.errorMessage ?? null,
      fiscalDocumentId: props.fiscalDocumentId ?? null,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    });
  }

  static with(props: NfseIssuanceProps, id: string): NfseIssuance {
    return new NfseIssuance(props, id);
  }

  /** Atualiza o desfecho devolvido pela fiscal-api (idempotência: mesmo id). */
  withOutcome(outcome: {
    status: string;
    accessKey: string | null;
    protocol: string | null;
  }): NfseIssuance {
    return new NfseIssuance(
      {
        ...this.props,
        status: outcome.status,
        accessKey: outcome.accessKey,
        protocol: outcome.protocol,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get companyId() {
    return this.props.companyId;
  }
  get sourceSystem() {
    return this.props.sourceSystem;
  }
  get externalReference() {
    return this.props.externalReference;
  }
  get idempotencyKey() {
    return this.props.idempotencyKey;
  }
  get accessKey() {
    return this.props.accessKey;
  }
  get protocol() {
    return this.props.protocol;
  }
  get status() {
    return this.props.status;
  }
  get environment() {
    return this.props.environment;
  }
  get errorCode() {
    return this.props.errorCode;
  }
  get errorMessage() {
    return this.props.errorMessage;
  }
  get fiscalDocumentId() {
    return this.props.fiscalDocumentId;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}
