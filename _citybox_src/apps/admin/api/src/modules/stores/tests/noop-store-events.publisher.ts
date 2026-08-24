import type { StoreEventsPublisher } from '../../../shared/infra/messaging/store-events.publisher';

export function createNoopStoreEventsPublisher(): StoreEventsPublisher {
  return {
    publishStoreCreated: () => Promise.resolve(undefined),
    publishStoreUpdated: () => Promise.resolve(undefined),
    publishStorePlanChanged: () => Promise.resolve(undefined),
    publishStoreSuspended: () => Promise.resolve(undefined),
    publishStoreReactivated: () => Promise.resolve(undefined),
  } as unknown as StoreEventsPublisher;
}
