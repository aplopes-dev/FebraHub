import type { CommissionRule } from '../entities/commission-rule.entity';

export type CommissionConfiguredMember = {
  memberId: string;
  memberName: string;
};

export abstract class CommissionRuleRepository {
  abstract findByMember(
    storeId: string,
    memberId: string,
  ): Promise<CommissionRule[]>;

  abstract replaceAll(
    storeId: string,
    memberId: string,
    memberName: string,
    rules: CommissionRule[],
  ): Promise<CommissionRule[]>;

  abstract existsByMember(storeId: string, memberId: string): Promise<boolean>;

  abstract listConfiguredMembers(
    storeId: string,
    search?: string,
  ): Promise<CommissionConfiguredMember[]>;
}
