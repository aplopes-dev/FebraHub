export type PatientFinancialPaymentMethod =
  | 'cash'
  | 'credit'
  | 'debit'
  | 'pix'
  | 'transfer'
  | 'boleto'
  | 'check';

export type PatientFinancialCardMode = 'no-fee' | 'with-fee';

export type PatientFinancialReceiveFormValues = {
  paymentMethod: PatientFinancialPaymentMethod;
  paidAmount: string;
  receivedDate: Date | null;
  cashRegisterId: string;
  observations: string;
  cardMode: PatientFinancialCardMode;
  checkIssueDate: Date | null;
  checkHolderName: string;
  checkNumber: string;
  checkBank: string;
  checkDocument: string;
};

export const EMPTY_PATIENT_FINANCIAL_RECEIVE_FORM_VALUES: PatientFinancialReceiveFormValues = {
  paymentMethod: 'cash',
  paidAmount: '',
  receivedDate: null,
  cashRegisterId: '',
  observations: '',
  cardMode: 'no-fee',
  checkIssueDate: null,
  checkHolderName: '',
  checkNumber: '',
  checkBank: '',
  checkDocument: '',
};
