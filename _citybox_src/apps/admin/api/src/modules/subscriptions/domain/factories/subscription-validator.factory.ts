import { SubscriptionZodValidator } from '../validators/subscription.zod.validator';

export class SubscriptionValidatorFactory {
  static create() {
    return SubscriptionZodValidator.create();
  }
}
