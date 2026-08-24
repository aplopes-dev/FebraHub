import { Entity } from '../../../../shared/core/entity';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

export const POS_DOCUMENT_MODELS = ['MODEL_55', 'MODEL_65'] as const;
/** `MODEL_55` = NF-e · `MODEL_65` = NFC-e. */
export type PosDocumentModel = (typeof POS_DOCUMENT_MODELS)[number];

export type PosFiscalSettingsProps = {
  organizationId: string;
  /** `null` = não configurado — a venda conclui sem documento (comportamento atual). */
  posDocumentModel: PosDocumentModel | null;
  /** Quem alterou por último (registro — dado sensível: decide se a loja emite e qual). */
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdatePosFiscalSettingsInput = {
  posDocumentModel: PosDocumentModel | null;
  updatedByUserId: string | null;
};

/**
 * Configuração fiscal do PDV — **uma por organização** (spec erp/013).
 *
 * Qual modelo o PDV emite ao concluir a venda. Entidade própria, ao lado de
 * `PosPolicy` e não dentro dela: tipo de documento fiscal não é alçada de
 * operador. Não mora no Emitente da fiscal-api (que não conhece PDV/organização).
 */
export class PosFiscalSettings extends Entity<PosFiscalSettingsProps> {
  constructor(props: PosFiscalSettingsProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    const model = this.props.posDocumentModel;
    if (model !== null && !POS_DOCUMENT_MODELS.includes(model)) {
      // DomainError → 422 estruturado pelo AppExceptionFilter (não 500 cru).
      throw new ValidatorDomainError({
        internalMessage: `Invalid posDocumentModel: ${String(model)}`,
        externalMessage: 'Modelo de documento fiscal do PDV inválido.',
        context: 'PosFiscalSettings',
      });
    }
  }

  /** Config nova: não configurada (venda sem documento). */
  public static createDefault(
    organizationId: string,
    id?: string,
  ): PosFiscalSettings {
    const now = new Date();
    return new PosFiscalSettings(
      {
        organizationId,
        posDocumentModel: null,
        updatedByUserId: null,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static with(
    props: PosFiscalSettingsProps,
    id: string,
  ): PosFiscalSettings {
    return new PosFiscalSettings(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get posDocumentModel() {
    return this.props.posDocumentModel;
  }
  get updatedByUserId() {
    return this.props.updatedByUserId;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  update(input: UpdatePosFiscalSettingsInput): PosFiscalSettings {
    return PosFiscalSettings.with(
      {
        ...this.props,
        posDocumentModel: input.posDocumentModel,
        updatedByUserId: input.updatedByUserId,
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}
