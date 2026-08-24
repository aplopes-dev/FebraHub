export type OrderFulfillmentType = 'dine_in' | 'delivery';

export const ORDER_FULFILLMENT_OPTIONS = [
  { id: 'dine_in' as const, label: 'Consumo local' },
  { id: 'delivery' as const, label: 'Delivery' },
] as const;
