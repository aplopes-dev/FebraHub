import { AsaasBillingType } from '../types/asaas.types';

export interface AsaasCreatePaymentDto {
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  dueDate: string;
  description?: string | null;
}
