import type { Plan } from '../../../../domain/entities/plan.entity';
import { toPlanListItem } from '../list-plans/list-plans.response.mapper';

export class CreatePlanPresenter {
  static toHttp(plan: Plan) {
    return {
      data: toPlanListItem(plan, 0),
    };
  }
}
