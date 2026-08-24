export type SettingsTabId =
  | 'store'
  | 'categories'
  | 'modifiers'
  | 'payments'
  | 'taxes'
  | 'discounts'
  | 'receipt'
  | 'printer';

export type StoreSettingsData = {
  logoUrl: string | null;
  storeName: string;
  phone: string;
  whatsapp: string;
  city: string;
  state: string;
  neighborhood: string;
  postCode: string;
  fullAddress: string;
};

export type PaymentMethodConfig = {
  id: string;
  name: string;
  enabled: boolean;
  type: 'pix' | 'credit' | 'debit' | 'cash' | 'voucher';
  icon: string;
};

export type PrinterConfig = {
  id: string;
  name: string;
  type: 'cashier' | 'kitchen' | 'bar';
  connection: 'usb' | 'network' | 'bluetooth';
  ipAddress?: string;
  autoPrint: boolean;
};

export type ReceiptConfig = {
  headerText: string;
  footerText: string;
  showCnpj: boolean;
  cnpj: string;
  showLogo: boolean;
  showPixQrCode: boolean;
};

export type TaxConfig = {
  serviceTaxPercent: number;
  enableServiceTax: boolean;
  salesTaxPercent: number;
  enableSalesTax: boolean;
};
