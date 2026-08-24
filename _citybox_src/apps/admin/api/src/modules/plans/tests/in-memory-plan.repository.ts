import {
  PlanRepository,
  type PlanListCriteria,
} from '../domain/repositories/plan.repository.interface';
import { Plan } from '../domain/entities/plan.entity';

export class InMemoryPlanRepository extends PlanRepository {
  private items: Plan[] = [];

  findById(id: string): Promise<Plan | null> {
    return Promise.resolve(this.items.find((p) => p.id === id) ?? null);
  }

  findByCode(code: string): Promise<Plan | null> {
    return Promise.resolve(this.items.find((p) => p.code === code) ?? null);
  }

  findAll(criteria?: PlanListCriteria): Promise<Plan[]> {
    if (!criteria?.vertical) return Promise.resolve([...this.items]);
    return Promise.resolve(
      this.items.filter((p) => p.vertical === criteria.vertical),
    );
  }

  async count(criteria?: PlanListCriteria): Promise<number> {
    return (await this.findAll(criteria)).length;
  }

  countSubscribersByCode(): Promise<number> {
    return Promise.resolve(0);
  }

  save(plan: Plan): Promise<Plan> {
    const index = this.items.findIndex((p) => p.id === plan.id);
    if (index >= 0) {
      this.items[index] = plan;
    } else {
      this.items.push(plan);
    }
    return Promise.resolve(plan);
  }

  delete(id: string): Promise<void> {
    this.items = this.items.filter((p) => p.id !== id);
    return Promise.resolve();
  }
}
