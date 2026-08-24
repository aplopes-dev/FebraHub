export const IS_PUBLIC_KEY = 'isPublic';
export const REQUIRES_ADMIN_KEY = 'requiresAdmin';

export type PaymentAuthContext = {
  sourceSystem: string;
  tenantId: string;
  isAdmin: boolean;
};

export type PaymentRequest = {
  paymentAuth?: PaymentAuthContext;
};
