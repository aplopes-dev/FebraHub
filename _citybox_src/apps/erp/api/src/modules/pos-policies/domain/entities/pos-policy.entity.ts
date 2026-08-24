import { Entity } from '../../../../shared/core/entity';
import { PosPolicyValidatorFactory } from '../factories/pos-policy-validator.factory';

export type PosPolicyProps = {
  organizationId: string;
  /** Desconto acima disto exige supervisor. `100` = nunca exige. */
  discountSupervisorAbovePercent: number;
  /** Sangria acima disto exige supervisor. `0` = sempre exige. */
  withdrawalSupervisorAboveCents: number;
  cancellationRequiresSupervisor: boolean;
  refundRequiresSupervisor: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Defaults **restritivos** de propósito.
 *
 * Organização que nunca abriu a tela de alçadas já nasce exigindo supervisor
 * para cancelamento e devolução. O contrário — nascer permissivo — seria uma
 * loja sem alçada nenhuma sem ninguém ter decidido isso.
 */
export const POS_POLICY_DEFAULTS = {
  discountSupervisorAbovePercent: 10,
  withdrawalSupervisorAboveCents: 50_000,
  cancellationRequiresSupervisor: true,
  refundRequiresSupervisor: true,
} as const;

export type UpdatePosPolicyInput = {
  discountSupervisorAbovePercent?: number;
  withdrawalSupervisorAboveCents?: number;
  cancellationRequiresSupervisor?: boolean;
  refundRequiresSupervisor?: boolean;
};

/**
 * Até onde o operador de caixa vai sozinho.
 *
 * **Uma por organização.** Alçada é política da empresa: limite por terminal
 * seria explorável escolhendo o caixa mais frouxo, e limite por unidade
 * transformaria "desconto máximo" numa negociação de loja.
 *
 * As perguntas ("isto exige supervisor?") são respondidas **aqui**, e não em
 * cada tela do PDV — três telas decidindo por conta própria divergem no
 * primeiro limite novo.
 */
export class PosPolicy extends Entity<PosPolicyProps> {
  constructor(props: PosPolicyProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    PosPolicyValidatorFactory.create().validate(this);
  }

  /** Política nova, com os defaults restritivos. */
  public static createDefault(organizationId: string, id?: string): PosPolicy {
    const now = new Date();
    return new PosPolicy(
      {
        organizationId,
        ...POS_POLICY_DEFAULTS,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static with(props: PosPolicyProps, id: string): PosPolicy {
    return new PosPolicy(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get discountSupervisorAbovePercent() {
    return this.props.discountSupervisorAbovePercent;
  }
  get withdrawalSupervisorAboveCents() {
    return this.props.withdrawalSupervisorAboveCents;
  }
  get cancellationRequiresSupervisor() {
    return this.props.cancellationRequiresSupervisor;
  }
  get refundRequiresSupervisor() {
    return this.props.refundRequiresSupervisor;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  /**
   * Estritamente **acima** do limite: com o teto em 10%, um desconto de
   * exatamente 10% passa sem supervisor. É como o lojista lê "até 10%".
   */
  requiresSupervisorForDiscount(percent: number): boolean {
    return percent > this.props.discountSupervisorAbovePercent;
  }

  requiresSupervisorForWithdrawal(amountCents: number): boolean {
    return amountCents > this.props.withdrawalSupervisorAboveCents;
  }

  /** PATCH: só os campos presentes em `input` mudam. */
  update(input: UpdatePosPolicyInput): PosPolicy {
    return PosPolicy.with(
      {
        ...this.props,
        discountSupervisorAbovePercent:
          input.discountSupervisorAbovePercent ??
          this.props.discountSupervisorAbovePercent,
        withdrawalSupervisorAboveCents:
          input.withdrawalSupervisorAboveCents ??
          this.props.withdrawalSupervisorAboveCents,
        cancellationRequiresSupervisor:
          input.cancellationRequiresSupervisor ??
          this.props.cancellationRequiresSupervisor,
        refundRequiresSupervisor:
          input.refundRequiresSupervisor ?? this.props.refundRequiresSupervisor,
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}
