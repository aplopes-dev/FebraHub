import type {
  CardPaymentMethodType,
  CardRateTierInput,
} from '../../domain/entities/card-payment-method.entity';

export type CardRateTierDto = CardRateTierInput;

export type CardPaymentMethodWritableDto = {
  type: CardPaymentMethodType;
  brand?: string | null;
  rate?: number | null;
  feeCents?: number | null;
  settlementDays?: number | null;
  minInstallments?: number | null;
  maxInstallments?: number | null;
  firstPaymentDays?: number | null;
  daysBetweenInstallments?: number | null;
  progressiveEnabled?: boolean;
  progressiveTiers?: CardRateTierDto[];
};

export type ListPaymentMethodsDto = {
  organizationId: string;
  contractId: string;
};

export type CreatePaymentMethodDto = {
  organizationId: string;
  contractId: string;
} & CardPaymentMethodWritableDto;

export type UpdatePaymentMethodDto = {
  organizationId: string;
  contractId: string;
  id: string;
} & CardPaymentMethodWritableDto;

export type DeletePaymentMethodDto = {
  organizationId: string;
  contractId: string;
  id: string;
};
