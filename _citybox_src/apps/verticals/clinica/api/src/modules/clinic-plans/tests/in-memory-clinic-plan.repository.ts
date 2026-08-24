import { ClinicPlan } from '../domain/entities/clinic-plan.entity';
import { ClinicPlanSpecialty } from '../domain/entities/clinic-plan-specialty.entity';
import { ClinicPlanTreatment } from '../domain/entities/clinic-plan-treatment.entity';
import {
  ClinicPlanRepository,
  type ClinicPlanAggregate,
} from '../domain/repositories/clinic-plan.repository.interface';

export class InMemoryClinicPlanRepository extends ClinicPlanRepository {
  private readonly plans = new Map<string, ClinicPlan>();
  private readonly specialties = new Map<string, ClinicPlanSpecialty>();
  private readonly treatments = new Map<string, ClinicPlanTreatment>();

  findByStoreId(storeId: string): Promise<ClinicPlan[]> {
    return Promise.resolve(
      [...this.plans.values()]
        .filter((plan) => plan.storeId === storeId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    );
  }

  findById(storeId: string, id: string): Promise<ClinicPlan | null> {
    const plan = this.plans.get(id);
    if (!plan || plan.storeId !== storeId) {
      return Promise.resolve(null);
    }
    return Promise.resolve(plan);
  }

  findDefaultActiveByStoreId(storeId: string): Promise<ClinicPlan | null> {
    return Promise.resolve(
      [...this.plans.values()].find(
        (plan) =>
          plan.storeId === storeId &&
          plan.isDefault &&
          plan.status === 'active',
      ) ?? null,
    );
  }

  async getMaxSortOrder(storeId: string): Promise<number> {
    const plans = await this.findByStoreId(storeId);
    if (plans.length === 0) return 0;
    return Math.max(...plans.map((plan) => plan.sortOrder));
  }

  save(plan: ClinicPlan): Promise<ClinicPlan> {
    this.plans.set(plan.id, plan);
    return Promise.resolve(plan);
  }

  clearDefaultForStore(storeId: string, exceptPlanId?: string): Promise<void> {
    for (const plan of this.plans.values()) {
      if (plan.storeId !== storeId || !plan.isDefault) continue;
      if (exceptPlanId && plan.id === exceptPlanId) continue;
      plan.clearDefault();
      this.plans.set(plan.id, plan);
    }
    return Promise.resolve();
  }

  async delete(storeId: string, id: string): Promise<void> {
    const plan = await this.findById(storeId, id);
    if (!plan) return;

    for (const treatment of this.treatments.values()) {
      if (treatment.planId === id) {
        this.treatments.delete(treatment.id);
      }
    }
    for (const specialty of this.specialties.values()) {
      if (specialty.planId === id) {
        this.specialties.delete(specialty.id);
      }
    }
    this.plans.delete(id);
  }

  linkedUsageCounts = new Map<string, number>();

  countLinkedUsage(_storeId: string, planId: string): Promise<number> {
    return Promise.resolve(this.linkedUsageCounts.get(planId) ?? 0);
  }

  async findAggregateById(
    storeId: string,
    id: string,
  ): Promise<ClinicPlanAggregate | null> {
    const plan = await this.findById(storeId, id);
    if (!plan) return null;

    const planSpecialties = [...this.specialties.values()]
      .filter(
        (specialty) => specialty.planId === id && specialty.storeId === storeId,
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const planTreatments = [...this.treatments.values()]
      .filter(
        (treatment) => treatment.planId === id && treatment.storeId === storeId,
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      plan,
      specialties: planSpecialties,
      treatments: planTreatments,
    };
  }

  async saveAggregate(
    aggregate: ClinicPlanAggregate,
  ): Promise<ClinicPlanAggregate> {
    if (aggregate.plan.isDefault) {
      await this.clearDefaultForStore(
        aggregate.plan.storeId,
        aggregate.plan.id,
      );
    }

    this.plans.set(aggregate.plan.id, aggregate.plan);
    for (const specialty of aggregate.specialties) {
      this.specialties.set(specialty.id, specialty);
    }
    for (const treatment of aggregate.treatments) {
      this.treatments.set(treatment.id, treatment);
    }

    return (
      (await this.findAggregateById(
        aggregate.plan.storeId,
        aggregate.plan.id,
      )) ?? aggregate
    );
  }

  async replaceTree(
    plan: ClinicPlan,
    specialties: ClinicPlanSpecialty[],
    treatments: ClinicPlanTreatment[],
  ): Promise<ClinicPlanAggregate> {
    if (plan.isDefault) {
      await this.clearDefaultForStore(plan.storeId, plan.id);
    }

    this.plans.set(plan.id, plan);

    for (const specialty of [...this.specialties.values()]) {
      if (specialty.planId === plan.id) {
        this.specialties.delete(specialty.id);
      }
    }
    for (const treatment of [...this.treatments.values()]) {
      if (treatment.planId === plan.id) {
        this.treatments.delete(treatment.id);
      }
    }

    for (const specialty of specialties) {
      this.specialties.set(specialty.id, specialty);
    }
    for (const treatment of treatments) {
      this.treatments.set(treatment.id, treatment);
    }

    return (
      (await this.findAggregateById(plan.storeId, plan.id)) ?? {
        plan,
        specialties,
        treatments,
      }
    );
  }
}
