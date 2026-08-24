import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export type PaymentMethodProps = {
  organizationId: string;
  name: string;
  fiscalCode: string | null;
  installmentPermission: string | null;
  systemKey: string | null;
  isSystem: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreatePaymentMethodProps = Optional<
  PaymentMethodProps,
  | 'fiscalCode'
  | 'installmentPermission'
  | 'systemKey'
  | 'isSystem'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
>;

/**
 * Forma de pagamento: meio usado para pagar/receber um lançamento financeiro
 * (spec `007-financeiro-ajustes-ui`). O nome é único por organização — as 15
 * formas padrão da plataforma (`isSystem: true`) não podem ser editadas nem
 * excluídas (FR-019); a empresa pode criar as próprias.
 */
export class PaymentMethod extends Entity<PaymentMethodProps> {
  constructor(props: PaymentMethodProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Validação de formato no DTO HTTP; domínio guarda só invariantes simples.
  }

  public static create(
    props: CreatePaymentMethodProps,
    id?: string,
  ): PaymentMethod {
    const now = new Date();
    return new PaymentMethod(
      {
        organizationId: props.organizationId,
        name: props.name.trim(),
        fiscalCode: props.fiscalCode ?? null,
        installmentPermission: props.installmentPermission ?? null,
        systemKey: props.systemKey ?? null,
        isSystem: props.isSystem ?? false,
        deletedAt: props.deletedAt ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  public static with(props: PaymentMethodProps, id: string): PaymentMethod {
    return new PaymentMethod(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get name() {
    return this.props.name;
  }
  get fiscalCode() {
    return this.props.fiscalCode;
  }
  get installmentPermission() {
    return this.props.installmentPermission;
  }
  get systemKey() {
    return this.props.systemKey;
  }
  get isSystem() {
    return this.props.isSystem;
  }
  get deletedAt() {
    return this.props.deletedAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  update(input: {
    name: string;
    fiscalCode: string | null;
    installmentPermission: string | null;
  }): PaymentMethod {
    return PaymentMethod.with(
      {
        ...this.props,
        name: input.name.trim(),
        fiscalCode: input.fiscalCode,
        installmentPermission: input.installmentPermission,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /**
   * Desativa a forma de pagamento sem apagá-la: pagamentos já registrados
   * apontam para ela (`FinancialEntryPayment.paymentMethod`, string solta —
   * sem FK, ver `research.md` R1), e o histórico precisa continuar exibindo o
   * valor mesmo que a forma não seja mais uma opção válida.
   */
  softDelete(): PaymentMethod {
    const now = new Date();
    return PaymentMethod.with(
      { ...this.props, deletedAt: now, updatedAt: now },
      this.id,
    );
  }

  restore(): PaymentMethod {
    return PaymentMethod.with(
      { ...this.props, deletedAt: null, updatedAt: new Date() },
      this.id,
    );
  }
}
