import { AsaasBillingType, AsaasCycle } from '../types/asaas.types';

export interface AsaasCreateSubscriptionDto {
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  nextDueDate: string;
  cycle: AsaasCycle;
  description?: string | null;
}
