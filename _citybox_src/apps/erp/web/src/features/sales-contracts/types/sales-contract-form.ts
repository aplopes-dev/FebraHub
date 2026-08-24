import type {
  RecurrenceDuration,
  RecurrenceFrequency,
  SalesContractItem,
} from "@/features/sales-contracts/types/sales-contract";

export type SalesContractFormValues = {
  customerId: string;
  sellerId: string;
  startDate: string;
  endIndefinite: boolean;
  endDate: string;
  statusId: string;
  statusDetail: string;
  notes: string;
  items: SalesContractItem[];
  firstDueDate: string;
  frequency: RecurrenceFrequency;
  durationMode: RecurrenceDuration["mode"];
  durationUntilDate: string;
  durationTimes: number;
  paymentMethodId: string;
};

export const SALES_CONTRACT_NOTES_MAX_LENGTH = 2000;
