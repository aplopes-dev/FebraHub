import { Entity } from '../../../../shared/core/entity';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import type { Optional } from '../../../../shared/core/types/optional.type';

/** Ambiente de emissão. Nesta plataforma só HOMOLOGATION (produção proibida). */
export const NFE_ENVIRONMENTS = ['HOMOLOGATION', 'PRODUCTION'] as const;
export type NfeEnvironment = (typeof NFE_ENVIRONMENTS)[number];

export type NfeIssuanceProps = {
  organizationId: string;
  /** Pedido de venda que originou a emissão — único (FR-006/SC-004). */
  saleOrderId: string;
  /** Emitente na fiscal-api (Company.id). */
  companyId: string;
  /** Chave de acesso / protocolo do órgão — nulos enquanto pendente/rejeitado. */
  accessKey: string | null;
  protocol: string | null;
  /** Espelha o status da fiscal-api (SIGNED, AUTHORIZED, REJECTED, …). */
  status: string;
  environment: NfeEnvironment;
  /**
   * Código/mensagem de rejeição do órgão (spec erp/028) — nulos quando
   * AUTHORIZED ou quando a falha foi de transporte/config (nunca chegou a
   * ser avaliada pelo órgão). A `fiscal-api` já devolve os dois na resposta
   * de `POST /v1/nfe`; antes desta spec o erp-api os descartava.
   */
  errorCode: string | null;
  errorMessage: string | null;
  /**
   * Id do documento na fiscal-api (spec erp/029) — falta dele impedia montar
   * a URL de download (`GET /v1/nfe/:id/xml|danfe`). Nulo só no caso teórico
   * de uma emissão que nunca chegou a criar o documento do lado da
   * fiscal-api (hoje isso sempre lança antes de `NfeIssuance.create`).
   */
  fiscalDocumentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateProps = Optional<
  NfeIssuanceProps,
  | 'accessKey'
  | 'protocol'
  | 'errorCode'
  | 'errorMessage'
  | 'fiscalDocumentId'
  | 'createdAt'
  | 'updatedAt'
>;

/**
 * Vínculo do ERP com uma NF-e emitida na fiscal-api a partir de um pedido de
 * venda (spec erp/026). Mesmo papel que `NfseIssuance` cumpre para NFS-e, mas
 * a idempotência/proteção contra reemissão (FR-006) é por `saleOrderId`
 * (índice único no banco), não por `sourceSystem`/`externalReference`
 * arbitrários — um pedido de venda só pode gerar uma NF-e.
 */
export class NfeIssuance extends Entity<NfeIssuanceProps> {
  constructor(props: NfeIssuanceProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    for (const [field, value] of [
      ['saleOrderId', this.props.saleOrderId],
      ['companyId', this.props.companyId],
      ['status', this.props.status],
    ] as const) {
      if (!value || value.trim().length === 0) {
        throw new ValidatorDomainError({
          internalMessage: `NfeIssuance.${field} vazio`,
          externalMessage: 'Dados da emissão incompletos.',
          context: NfeIssuance.name,
        });
      }
    }
    if (!NFE_ENVIRONMENTS.includes(this.props.environment)) {
      throw new ValidatorDomainError({
        internalMessage: `NfeIssuance environment inválido: ${this.props.environment}`,
        externalMessage: 'Ambiente de emissão inválido.',
        context: NfeIssuance.name,
      });
    }
  }

  static create(props: CreateProps): NfeIssuance {
    const now = new Date();
    return new NfeIssuance({
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

  static with(props: NfeIssuanceProps, id: string): NfeIssuance {
    return new NfeIssuance(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get saleOrderId() {
    return this.props.saleOrderId;
  }
  get companyId() {
    return this.props.companyId;
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
