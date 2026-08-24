import type { ListSubscriptionsResult } from '../../../../application/use-cases/list-subscriptions/list-subscriptions.use-case';
import { toSubscriptionListItem } from '../shared/subscription-response.mapper';

export class ListSubscriptionsPresenter {
  static toHttp(result: ListSubscriptionsResult) {
    return {
      data: result.subscriptions.map(toSubscriptionListItem),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
