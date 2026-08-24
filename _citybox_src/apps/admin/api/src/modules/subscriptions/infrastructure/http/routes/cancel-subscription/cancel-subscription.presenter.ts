import type { Subscription } from '../../../../domain/entities/subscription.entity';
import { toSubscriptionListItem } from '../shared/subscription-response.mapper';

export class CancelSubscriptionPresenter {
  static toHttp(subscription: Subscription) {
    return {
      data: toSubscriptionListItem(subscription),
    };
  }
}
