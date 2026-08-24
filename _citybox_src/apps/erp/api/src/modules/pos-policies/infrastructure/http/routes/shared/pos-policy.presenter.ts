import type { PosPolicy } from '../../../../domain/entities/pos-policy.entity';

export class PosPolicyPresenter {
  static toHttpDetail(policy: PosPolicy) {
    return {
      id: policy.id,
      discountSupervisorAbovePercent: policy.discountSupervisorAbovePercent,
      withdrawalSupervisorAboveCents: policy.withdrawalSupervisorAboveCents,
      cancellationRequiresSupervisor: policy.cancellationRequiresSupervisor,
      refundRequiresSupervisor: policy.refundRequiresSupervisor,
      updatedAt: policy.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(policy: PosPolicy) {
    return { data: PosPolicyPresenter.toHttpDetail(policy) };
  }
}
