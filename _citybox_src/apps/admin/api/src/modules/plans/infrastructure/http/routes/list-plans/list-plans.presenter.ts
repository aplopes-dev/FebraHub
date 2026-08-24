import type { PlanWithSubscribers } from '../../../../application/use-cases/list-plans/list-plans.use-case';
import { toPlanListItem } from './list-plans.response.mapper';

export class ListPlansPresenter {
  static toHttp(
    plans: PlanWithSubscribers[],
    meta: { total: number; page: number; perPage: number; totalPages: number },
  ) {
    return {
      data: plans.map(({ plan, subscriberCount }) =>
        toPlanListItem(plan, subscriberCount),
      ),
      meta,
    };
  }
}
