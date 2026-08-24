import type { Plan } from '../../../../domain/entities/plan.entity';
import { toPlanListItem } from '../list-plans/list-plans.response.mapper';

export class FindPlanByIdPresenter {
  static toHttp(plan: Plan, subscriberCount: number) {
    return {
      data: toPlanListItem(plan, subscriberCount),
    };
  }
}
