import { CommissionRule } from '../domain/entities/commission-rule.entity';
import { CommissionRuleRepository } from '../domain/repositories/commission-rule.repository.interface';

export class InMemoryCommissionRuleRepository extends CommissionRuleRepository {
  private rules: CommissionRule[] = [];

  seed(rules: CommissionRule[]): void {
    this.rules = [...rules];
  }

  getAll(): CommissionRule[] {
    return this.rules;
  }

  async findByMember(
    storeId: string,
    memberId: string,
  ): Promise<CommissionRule[]> {
    return this.rules.filter(
      (rule) => rule.storeId === storeId && rule.memberId === memberId,
    );
  }

  async replaceAll(
    storeId: string,
    memberId: string,
    memberName: string,
    rules: CommissionRule[],
  ): Promise<CommissionRule[]> {
    const others = this.rules.filter(
      (rule) => !(rule.storeId === storeId && rule.memberId === memberId),
    );
    const replaced = rules.map((rule) =>
      CommissionRule.create(
        {
          storeId,
          memberId,
          memberName,
          paymentTrigger: rule.paymentTrigger,
          commissionType: rule.commissionType,
          percentageValue: rule.percentageValue,
          commissionValueCents: rule.commissionValueCents,
          allowValueExceedsTreatment: rule.allowValueExceedsTreatment,
          planId: rule.planId,
          specialtyId: rule.specialtyId,
          treatments: rule.treatments,
        },
        rule.id,
      ),
    );
    this.rules = [...others, ...replaced];
    return replaced;
  }

  async existsByMember(storeId: string, memberId: string): Promise<boolean> {
    return this.rules.some(
      (rule) => rule.storeId === storeId && rule.memberId === memberId,
    );
  }

  async listConfiguredMembers(
    storeId: string,
    search?: string,
  ): Promise<{ memberId: string; memberName: string }[]> {
    const needle = search?.trim().toLowerCase();
    const byMember = new Map<string, string>();
    for (const rule of this.rules) {
      if (rule.storeId !== storeId) continue;
      if (needle && !rule.memberName.toLowerCase().includes(needle)) continue;
      if (!byMember.has(rule.memberId)) {
        byMember.set(rule.memberId, rule.memberName);
      }
    }
    return [...byMember.entries()]
      .map(([memberId, memberName]) => ({ memberId, memberName }))
      .sort((a, b) => a.memberName.localeCompare(b.memberName, 'pt-BR'));
  }
}
